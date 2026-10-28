// Stock reservation without transactions (works on standalone MongoDB): each line is decremented
// only if enough stock remains; if any line fails, the lines already taken are put back.
import type { Types } from "mongoose";
import { OrderModel, VariantModel } from "@/models";

export class StockError extends Error {
  constructor(public item: string, message: string) {
    super(message);
  }
}

type Line = { variant: Types.ObjectId | string; qty: number; name: string; size?: string | null };

export async function reserveStock(lines: Line[]) {
  const taken: Line[] = [];
  for (const line of lines) {
    const res = await VariantModel.updateOne({ _id: line.variant, isActive: true, stock: { $gte: line.qty } }, { $inc: { stock: -line.qty } });
    if (res.modifiedCount !== 1) {
      await releaseStock(taken);
      const label = line.size && line.size !== "One Size" ? `${line.name} (${line.size})` : line.name;
      throw new StockError(label, `Sorry, ${label} just sold out or has fewer items left than you ordered. Please review your bag.`);
    }
    taken.push(line);
  }
}

export async function releaseStock(lines: Pick<Line, "variant" | "qty">[]) {
  for (const line of lines) await VariantModel.updateOne({ _id: line.variant }, { $inc: { stock: line.qty } });
}

/** Put an order's stock back exactly once (guarded by stockRestoredAt). */
export async function restoreOrderStock(orderId: Types.ObjectId | string): Promise<boolean> {
  const order = await OrderModel.findOneAndUpdate({ _id: orderId, stockRestoredAt: { $exists: false } }, { stockRestoredAt: new Date() }).lean();
  if (!order) return false;
  await releaseStock(order.items.map((i) => ({ variant: i.variant, qty: i.qty })));
  return true;
}
