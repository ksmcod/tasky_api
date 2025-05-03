import { PrismaClient } from "../../generated/prisma";

declare global {
  var db: PrismaClient | undefined;
}

const db = globalThis.db || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.db = globalThis.db || db;
}

export default db;
