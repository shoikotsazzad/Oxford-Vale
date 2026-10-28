// In-memory MongoDB for tests. Uses a local mongod if one is installed (MONGOMS_SYSTEM_BINARY), else downloads one.
import { existsSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer | undefined;

export async function startDb() {
  const local = ["/opt/homebrew/bin/mongod", "/usr/local/bin/mongod", "/usr/bin/mongod"].find(existsSync);
  if (local && !process.env.MONGOMS_SYSTEM_BINARY) process.env.MONGOMS_SYSTEM_BINARY = local;
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: "test" });
}

export async function stopDb() {
  await mongoose.disconnect();
  await server?.stop();
}

export async function clearDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
