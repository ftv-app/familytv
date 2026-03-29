import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
// @ts-expect-error - neon sql returns unknown[]
const db = drizzle(sql, { schema });

export { db };
export * from "./schema";
