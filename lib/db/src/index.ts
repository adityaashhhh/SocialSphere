import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || `file:${path.join(__dirname, "../../../sqlite.db")}`;

export const client = createClient({
  url: dbPath,
});
export const db = drizzle(client, { schema });

export * from "./schema/index.js";
