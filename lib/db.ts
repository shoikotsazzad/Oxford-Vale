// MongoDB connection. Only used when MONGODB_URI is set. Server code only.
import type { Mongoose } from "mongoose";

export const dbEnabled = () => Boolean(process.env.MONGODB_URI);

const g = globalThis as unknown as { _mongoose?: Promise<Mongoose> };

/** Cached connection (survives hot reload and warm serverless invocations). */
export async function connectDB(): Promise<Mongoose> {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!g._mongoose) {
    const mongoose = (await import("mongoose")).default;
    g._mongoose = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }
  return g._mongoose;
}
