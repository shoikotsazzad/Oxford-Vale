"use server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/server/db";
import { UserModel } from "@/models";
import { getCurrentUser } from "@/server/auth/session";
import { cleanFields, cleanText } from "@/server/sanitize";
import { fail, fromZod, ok, type Result } from "@/server/result";
import { savedAddressSchema } from "@/lib/validation/address";
import { profileSchema } from "@/lib/validation/auth";
import { objectIdSchema } from "@/lib/validation/common";

async function requireUser() {
  await connectDB();
  return getCurrentUser();
}
const loginRequired = () => fail("UNAUTHORIZED", "Please log in first.");

export async function updateProfile(input: unknown): Promise<Result<null>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const user = await requireUser();
  if (!user) return loginRequired();
  await UserModel.updateOne({ _id: user.id }, { name: cleanText(parsed.data.name), phone: parsed.data.phone });
  revalidatePath("/account");
  return ok(null);
}

/** Add (no id) or edit an address. */
export async function saveAddress(input: unknown): Promise<Result<null>> {
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const user = await requireUser();
  if (!user) return loginRequired();
  const id = (input as { id?: string }).id;
  const data = cleanFields(parsed.data);
  const doc = await UserModel.findById(user.id).select("addresses").lean();
  if (!doc) return loginRequired();
  if (!id && doc.addresses.length >= 10) return fail("VALIDATION", "You can save up to 10 addresses.");
  const makeDefault = data.isDefault || doc.addresses.length === 0;
  if (makeDefault) await UserModel.updateOne({ _id: user.id }, { $set: { "addresses.$[].isDefault": false } });
  if (id) {
    if (!objectIdSchema.safeParse(id).success) return fail("NOT_FOUND", "Address not found.");
    const res = await UserModel.updateOne(
      { _id: user.id, "addresses._id": id },
      { $set: Object.fromEntries(Object.entries({ ...data, isDefault: makeDefault }).map(([k, v]) => [`addresses.$.${k}`, v])) },
    );
    if (!res.matchedCount) return fail("NOT_FOUND", "Address not found.");
  } else {
    await UserModel.updateOne({ _id: user.id }, { $push: { addresses: { ...data, isDefault: makeDefault } } });
  }
  revalidatePath("/account/addresses");
  return ok(null);
}

export async function deleteAddress(id: string): Promise<Result<null>> {
  const user = await requireUser();
  if (!user) return loginRequired();
  if (!objectIdSchema.safeParse(id).success) return fail("NOT_FOUND", "Address not found.");
  await UserModel.updateOne({ _id: user.id }, { $pull: { addresses: { _id: id } } });
  // Keep one default if any address is left.
  const doc = await UserModel.findById(user.id).select("addresses").lean();
  if (doc?.addresses.length && !doc.addresses.some((a) => a.isDefault)) {
    await UserModel.updateOne({ _id: user.id, "addresses._id": doc.addresses[0]._id }, { $set: { "addresses.$.isDefault": true } });
  }
  revalidatePath("/account/addresses");
  return ok(null);
}
