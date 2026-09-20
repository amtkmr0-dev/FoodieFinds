/**
 * Postgres / Drizzle bootstrap.
 *
 * Lazy: nothing connects until something actually calls `getDb()`. This
 * lets the server boot in MemStorage mode (tests, local dev without Postgres)
 * without throwing on import.
 *
 * To use the Drizzle backend, set `DATABASE_URL`. `server/storage.ts` then
 * picks `DrizzleStorage` over `MemStorage` automatically.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

interface DbInstance {
    pool: Pool;
    db: ReturnType<typeof drizzle<typeof schema>>;
}

let _instance: DbInstance | null = null;

function init(): DbInstance {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error(
            'DATABASE_URL is not set. Either configure it (see .env.example) ' +
            'or run without the Drizzle backend - storage.ts falls back to MemStorage automatically.',
        );
    }
    const pool = new Pool({ connectionString: url });
    const db = drizzle({ client: pool, schema });
    return { pool, db };
}

export function getDb() {
    if (!_instance) _instance = init();
    return _instance.db;
}

export function getPool() {
    if (!_instance) _instance = init();
    return _instance.pool;
}

/**
 * `true` iff `DATABASE_URL` is set. Used by `server/storage.ts` to decide
 * whether to construct a `DrizzleStorage` or fall back to `MemStorage`.
 * Doesn't actually connect.
 */
export function isDatabaseConfigured(): boolean {
    return !!process.env.DATABASE_URL;
}

/** Test helper: drop the cached pool/db so a fresh init runs next call. */
export function __resetDbForTests(): void {
    if (_instance) {
        // Best-effort close; ignore errors on shutdown.
        _instance.pool.end().catch(() => undefined);
        _instance = null;
    }
}

// Back-compat: a few callers import `db` directly. Proxy keeps that working
// while still being lazy.
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_t, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Reflect.get(getDb() as any, prop);
    },
});

// Same for the pool.
export const pool = new Proxy({} as Pool, {
    get(_t, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Reflect.get(getPool() as any, prop);
    },
});
