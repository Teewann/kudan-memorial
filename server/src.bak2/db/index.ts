import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

// A single pooled connection, reused across every request.
// max: 10 — enough for this app's traffic without exhausting Neon's free-tier
// connection limit (and avoids the "pool exhausted" crashes of a too-high
// or too-low setting).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export const db = drizzle(pool, { schema });
