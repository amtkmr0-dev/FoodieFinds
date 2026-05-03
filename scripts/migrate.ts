/**
 * Apply SQL migrations from `./migrations/` against `DATABASE_URL`.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/migrate.ts
 *
 * Idempotent: each migration is recorded in `_migrations` (filename) so
 * re-running skips already-applied files. Failures abort the run.
 *
 * Why hand-rolled instead of `drizzle-kit migrate`? The latter requires
 * the same Node runtime as the app and the full Drizzle dependency tree.
 * This script only needs `pg` (or `@neondatabase/serverless`) and reads
 * raw SQL files - which is what `drizzle-kit generate` produces anyway.
 */
import fs from "node:fs";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL is not set; aborting.");
    process.exit(1);
}

async function main() {
    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                filename text PRIMARY KEY,
                applied_at timestamp NOT NULL DEFAULT now()
            )
        `);

        const dir = path.join(process.cwd(), "migrations");
        const files = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

        if (files.length === 0) {
            console.log("No migrations to apply.");
            return;
        }

        const applied = new Set(
            (await client.query<{ filename: string }>(`SELECT filename FROM _migrations`)).rows.map(
                (r) => r.filename,
            ),
        );

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`  skip   ${file}  (already applied)`);
                continue;
            }
            const sql = fs.readFileSync(path.join(dir, file), "utf8");
            console.log(`  apply  ${file}`);
            await client.query("BEGIN");
            try {
                await client.query(sql);
                await client.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
                await client.query("COMMIT");
            } catch (e) {
                await client.query("ROLLBACK");
                throw new Error(`Migration ${file} failed: ${(e as Error).message}`);
            }
        }

        console.log(`Done. ${files.length} migration(s) considered, ${files.length - applied.size} newly applied.`);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
