import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CartModel, LeadModel, ProductModel, VariantModel } from "@/models";
import { addItem, buildCartView, CartError, findCart, markLeadSkipped, setItemQty } from "@/server/services/cart";
import { upsertLead, sweepAbandonedLeads } from "@/server/services/lead";
import { clearDb, startDb, stopDb } from "./helpers/db";
import { seedProduct } from "./helpers/fixtures";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const LEAD = { name: "Test Customer", phone: "07700900009", email: "test@example.com" };

describe("cart", () => {
  it("creates a cart on first add and prices it from the database", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 2);
    expect(token).toBeTruthy();
    const view = await buildCartView(await findCart(token), 10000);
    expect(view.count).toBe(2);
    expect(view.lines[0]).toMatchObject({ unitPrice: 800, regularPrice: 1000, lineTotal: 1600 });
    expect(view.subtotal).toBe(1600);
    expect(view.freeDeliveryGap).toBe(8400);
    expect(view.needsLead).toBe(true);
  });

  it("merges repeat adds into one line", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await addItem(token, String(m._id), 1);
    const cart = await findCart(token);
    expect(cart!.items).toHaveLength(1);
    expect(cart!.items[0].qty).toBe(2);
  });

  it("refuses more than the stock and sold-out sizes", async () => {
    const { m, l } = await seedProduct();
    await expect(addItem(undefined, String(m._id), 4)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
    await expect(addItem(undefined, String(l._id), 1)).rejects.toBeInstanceOf(CartError);
    const { token } = await addItem(undefined, String(m._id), 2);
    await expect(addItem(token, String(m._id), 2)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });

  it("uses the current price, not the price when added", async () => {
    const { product, m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await ProductModel.updateOne({ _id: product._id }, { $unset: { salePrice: 1 } });
    const view = await buildCartView(await findCart(token), 0);
    expect(view.lines[0].unitPrice).toBe(1000);
  });

  it("clamps quantity when stock drops and removes sold-out lines", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 3);
    await VariantModel.updateOne({ _id: m._id }, { stock: 1 });
    let view = await buildCartView(await findCart(token), 0);
    expect(view.lines[0].qty).toBe(1);
    expect(view.notices).toHaveLength(1);
    await VariantModel.updateOne({ _id: m._id }, { stock: 0 });
    view = await buildCartView(await findCart(token), 0);
    expect(view.lines).toHaveLength(0);
    expect((await findCart(token))!.items).toHaveLength(0);
  });

  it("updates and removes lines", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await setItemQty(token, String(m._id), 3);
    expect((await findCart(token))!.items[0].qty).toBe(3);
    await setItemQty(token, String(m._id), 0);
    expect((await findCart(token))!.items).toHaveLength(0);
  });

  it("rejects invalid quantities", async () => {
    const { m } = await seedProduct();
    await expect(addItem(undefined, String(m._id), 0)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(addItem(undefined, String(m._id), 11)).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("lead capture", () => {
  it("stores a lead with a live cart snapshot", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await upsertLead((await findCart(token))!, LEAD, "add_to_cart");
    const cart = await findCart(token);
    expect(cart!.lead).toBeTruthy();
    let lead = await LeadModel.findById(cart!.lead).lean();
    expect(lead).toMatchObject({ ...LEAD, status: "cart", cartValue: 800, source: "add_to_cart" });

    await addItem(token, String(m._id), 1);
    lead = await LeadModel.findById(cart!.lead).lean();
    expect(lead!.cartValue).toBe(1600);
    expect(lead!.cartSnapshot[0]).toMatchObject({ sku: "OV-TST-001-WHI-M", qty: 2, unitPrice: 800 });
    expect((await buildCartView(await findCart(token), 0)).needsLead).toBe(false);
  });

  it("does not ask again after skipping", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await markLeadSkipped(token);
    expect((await buildCartView(await findCart(token), 0)).needsLead).toBe(false);
  });

  it("marks idle carts abandoned once, and revives them on activity", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    const leadId = await upsertLead((await findCart(token))!, LEAD, "add_to_cart");
    const later = new Date(Date.now() + 61 * 60_000);

    const first = await sweepAbandonedLeads(60, later);
    expect(first).toHaveLength(1);
    expect((await LeadModel.findById(leadId).lean())!.status).toBe("abandoned");
    expect(await sweepAbandonedLeads(60, later)).toHaveLength(0);

    await addItem(token, String(m._id), 1);
    expect((await LeadModel.findById(leadId).lean())!.status).toBe("cart");
  });

  it("ignores carts that are still active or empty", async () => {
    const { m } = await seedProduct();
    const { token } = await addItem(undefined, String(m._id), 1);
    await upsertLead((await findCart(token))!, LEAD, "add_to_cart");
    expect(await sweepAbandonedLeads(60)).toHaveLength(0);
    await setItemQty(token, String(m._id), 0);
    expect(await sweepAbandonedLeads(60, new Date(Date.now() + 2 * 3600_000))).toHaveLength(0);
    expect(await CartModel.countDocuments()).toBe(1);
  });
});
