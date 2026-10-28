import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "./_model";

const CounterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });

export type Counter = InferSchemaType<typeof CounterSchema>;
export const CounterModel = defineModel<Counter>("Counter", CounterSchema);

/** Atomically get the next number in a named sequence (e.g. "order-261022"). */
export async function nextSeq(name: string): Promise<number> {
  const doc = await CounterModel.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" }).lean();
  return doc!.seq;
}
