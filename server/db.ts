// MongoDB connection. Server code and scripts only (no "server-only" import so seed/tests can use it).
import mongoose, { type Mongoose } from "mongoose";

const g = globalThis as unknown as { _mongoose?: Promise<Mongoose> };

/** Cached connection (survives hot reload and warm serverless invocations). */
export async function connectDB(uri = process.env.MONGODB_URI): Promise<Mongoose> {
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and add your MongoDB connection string.");
  if (!g._mongoose) {
    g._mongoose = mongoose.connect(uri, { bufferCommands: false }).catch((err) => {
      g._mongoose = undefined;
      throw err;
    });
  }
  return g._mongoose;
}

export async function disconnectDB() {
  if (g._mongoose) {
    await (await g._mongoose).disconnect();
    g._mongoose = undefined;
  }
}
