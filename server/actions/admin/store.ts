"use server";
// Coupons, delivery options, settings, admin users, messages.
import { adminAction, AdminError } from "@/server/admin/guard";
import { revalidateStore } from "@/server/admin/revalidate";
import { audit, diff } from "@/server/services/audit";
import { hashPassword } from "@/server/auth/password";
import { revokeUserSessions } from "@/server/auth/session";
import { cleanText } from "@/server/sanitize";
import { ok } from "@/server/result";
import { rateLimit } from "@/server/rate-limit";
import { sendTest } from "@/server/notifications";
import { ContactMessageModel, CouponModel, DeliveryZoneModel, SettingModel, UserModel } from "@/models";
import { isCountry } from "@/lib/address";
import { londonLocalToDate } from "@/lib/dates";
import { adminUserSchema, couponSchema, idSchema, messageStatusSchema, resetAdminPasswordSchema, settingsSchema, testNotificationSchema, zoneSchema } from "@/lib/validation/admin";

const plain = <T,>(v: T) => (v ? JSON.parse(JSON.stringify(v)) : null);

export async function saveCoupon(input: unknown) {
  return adminAction("catalog.edit", couponSchema, input, async (d, admin) => {
    const { id, startsAt, expiresAt, maxDiscount, ...rest } = d;
    const fields = {
      ...rest,
      description: cleanText(rest.description),
      // Fixed coupons are typed in dollars; stored in cents like every amount.
      value: rest.type === "fixed" ? Math.round(rest.value * 100) : rest.value,
      startsAt: startsAt ? londonLocalToDate(startsAt) : undefined,
      expiresAt: londonLocalToDate(expiresAt),
      maxDiscount: rest.type === "percent" ? maxDiscount : undefined,
    };
    const unset = Object.fromEntries((["startsAt", "maxDiscount"] as const).filter((k) => fields[k] === undefined).map((k) => [k, 1]));
    const before = id ? await CouponModel.findById(id).lean() : null;
    const saved = id
      ? await CouponModel.findByIdAndUpdate(id, { ...fields, ...(Object.keys(unset).length && { $unset: unset }) }, { returnDocument: "after" }).lean()
      : (await CouponModel.create(fields)).toObject();
    if (!saved) throw new AdminError("NOT_FOUND", "Coupon not found.");
    await audit(admin, id ? "coupon.update" : "coupon.create", { type: "coupon", id: String(saved._id), label: saved.code }, diff(plain(before), plain(fields), ["code", "type", "value", "maxDiscount", "minOrder", "startsAt", "expiresAt", "usageLimit", "perCustomerLimit", "isActive"]));
    revalidateStore();
    return ok({ id: String(saved._id) });
  });
}

export async function saveZone(input: unknown) {
  return adminAction("catalog.edit", zoneSchema, input, async (d, admin) => {
    const unknown = d.countries.filter((c) => !isCountry(c));
    if (unknown.length) throw new AdminError("VALIDATION", "Some country codes aren't recognised.", { countries: `Unknown: ${unknown.join(", ")}` });
    const { id, ...rest } = d;
    const fields = { ...rest, name: cleanText(rest.name), note: cleanText(rest.note), countries: [...new Set(rest.countries)] };
    const before = id ? await DeliveryZoneModel.findById(id).lean() : null;
    const saved = id ? await DeliveryZoneModel.findByIdAndUpdate(id, fields, { returnDocument: "after" }).lean() : (await DeliveryZoneModel.create(fields)).toObject();
    if (!saved) throw new AdminError("NOT_FOUND", "Delivery option not found.");
    await audit(admin, id ? "zone.update" : "zone.create", { type: "zone", id: String(saved._id), label: saved.name }, diff(plain(before), plain(fields), ["name", "fee", "etaMinDays", "etaMaxDays", "countries", "freeEligible", "note", "sortOrder", "isActive"]));
    revalidateStore("zones");
    return ok({ id: String(saved._id) });
  });
}

export async function deleteZone(input: unknown) {
  return adminAction("catalog.edit", idSchema, input, async (d, admin) => {
    const zone = await DeliveryZoneModel.findById(d.id).lean();
    if (!zone) throw new AdminError("NOT_FOUND", "Delivery option not found.");
    const fallbacks = await DeliveryZoneModel.countDocuments({ isActive: true, "countries.0": { $exists: false }, _id: { $ne: d.id } });
    if (!fallbacks) throw new AdminError("CONFLICT", "Keep at least one active option with no countries: it covers every country no other option lists.");
    await DeliveryZoneModel.deleteOne({ _id: d.id });
    await audit(admin, "zone.delete", { type: "zone", id: d.id, label: zone.name });
    revalidateStore("zones");
    return ok(null);
  });
}

export async function saveSettings(input: unknown) {
  return adminAction("settings", settingsSchema, input, async (d, admin) => {
    const deepClean = (v: unknown): unknown =>
      typeof v === "string" ? cleanText(v) : Array.isArray(v) ? v.map(deepClean) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClean(x)])) : v;
    const fields = deepClean(d) as typeof d;
    const before = await SettingModel.findOne({ key: "store" }).lean();
    await SettingModel.updateOne({ key: "store" }, { $set: fields }, { upsert: true });
    await audit(admin, "settings.update", { type: "settings", id: "store", label: "Store settings" }, diff(plain(before), plain(fields), Object.keys(fields)));
    revalidateStore("settings");
    return ok(null);
  });
}

async function assertOwnerRemains(exceptId: string) {
  const owners = await UserModel.countDocuments({ role: "owner", isActive: true, _id: { $ne: exceptId } });
  if (!owners) throw new AdminError("CONFLICT", "There must always be at least one active owner.");
}

export async function saveAdminUser(input: unknown) {
  return adminAction("users", adminUserSchema, input, async (d, admin) => {
    const name = cleanText(d.name);
    if (!d.id) {
      if (!d.password) throw new AdminError("VALIDATION", "Set a starting password.", { password: "Set a starting password (10+ characters)." });
      if (await UserModel.exists({ email: d.email })) throw new AdminError("CONFLICT", "An account with this email already exists.", { email: "Already has an account." });
      const user = await UserModel.create({ name, email: d.email, role: d.role, isActive: d.isActive, passwordHash: await hashPassword(d.password) });
      await audit(admin, "user.create", { type: "user", id: String(user._id), label: d.email }, { role: { from: null, to: d.role } });
      revalidateStore();
      return ok({ id: String(user._id) });
    }
    const before = await UserModel.findById(d.id).lean();
    if (!before || before.role === "customer") throw new AdminError("NOT_FOUND", "Admin user not found.");
    if (d.id === admin.id && (d.role !== before.role || !d.isActive)) throw new AdminError("FORBIDDEN", "You can't change your own role or deactivate yourself.");
    if (before.role === "owner" && (d.role !== "owner" || !d.isActive)) await assertOwnerRemains(d.id);
    if (d.email !== before.email && (await UserModel.exists({ email: d.email, _id: { $ne: d.id } }))) throw new AdminError("CONFLICT", "An account with this email already exists.", { email: "Already has an account." });
    const fields = { name, email: d.email, role: d.role, isActive: d.isActive };
    await UserModel.updateOne({ _id: d.id }, fields);
    if (!d.isActive || d.role !== before.role) await revokeUserSessions(d.id); // new permissions apply on next sign-in
    await audit(admin, "user.update", { type: "user", id: d.id, label: d.email }, diff(plain(before), fields, ["name", "email", "role", "isActive"]));
    revalidateStore();
    return ok({ id: d.id });
  });
}

export async function resetAdminPassword(input: unknown) {
  return adminAction("users", resetAdminPasswordSchema, input, async (d, admin) => {
    const user = await UserModel.findOneAndUpdate({ _id: d.id, role: { $ne: "customer" } }, { passwordHash: await hashPassword(d.password) }).select("email").lean();
    if (!user) throw new AdminError("NOT_FOUND", "Admin user not found.");
    if (d.id !== admin.id) await revokeUserSessions(d.id);
    await audit(admin, "user.password.reset", { type: "user", id: d.id, label: user.email });
    return ok(null);
  });
}

export async function sendTestNotification(input: unknown) {
  return adminAction("settings", testNotificationSchema, input, async (d, admin) => {
    if (!(await rateLimit(`notify-test:${admin.id}`, 10, 3600))) throw new AdminError("FORBIDDEN", "Too many test messages. Try again in an hour.");
    const delivered = await sendTest(d.to);
    await audit(admin, "notification.test", { type: "notification", id: d.channel, label: d.to });
    revalidateStore();
    if (!delivered) throw new AdminError("CONFLICT", "The email provider returned an error. See the details under Messages → Sent emails.");
    return ok({ provider: process.env.EMAIL_PROVIDER || "log" });
  });
}

export async function setMessageStatus(input: unknown) {
  return adminAction("messages", messageStatusSchema, input, async (d, admin) => {
    const before = await ContactMessageModel.findByIdAndUpdate(d.id, { status: d.status }).select("status email").lean();
    if (!before) throw new AdminError("NOT_FOUND", "Message not found.");
    if (before.status !== d.status) await audit(admin, "message.status", { type: "message", id: d.id, label: before.email }, { status: { from: before.status, to: d.status } });
    revalidateStore();
    return ok(null);
  });
}
