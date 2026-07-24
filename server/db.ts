import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Idle clients in the pool can be terminated by the database server
// (e.g. "terminating connection due to administrator command").
// Without this handler, that emits an unhandled 'error' event and
// crashes the whole process. Log it and let the pool reconnect.
pool.on("error", (err) => {
  console.error("Database pool error (recovered):", err.message);
});

export const db = drizzle(pool, { schema });
