/**
 * Seed initial data into the database.
 *
 * Currently seeds the gifts catalog (matches the defaults that MemStorage
 * loads at boot). Idempotent: if a gift with the same name already exists,
 * it's skipped.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed.ts
 */
import { eq } from "drizzle-orm";
import { giftsConfig } from "@shared/schema";
import { getDb, getPool } from "../server/db";

const DEFAULT_GIFTS = [
    { name: "Rose", iconType: "rose", amount: 20 },
    { name: "Tulip", iconType: "tulip", amount: 40 },
    { name: "Sunflower", iconType: "sunflower", amount: 50 },
    { name: "Diamond", iconType: "diamond", amount: 100 },
    { name: "Crown", iconType: "crown", amount: 250 },
    { name: "Star", iconType: "star", amount: 500 },
    { name: "Rocket", iconType: "rocket", amount: 750 },
    { name: "Trophy", iconType: "trophy", amount: 900 },
    { name: "Universe", iconType: "universe", amount: 1000 },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set; aborting.");
        process.exit(1);
    }

    const db = getDb();
    let inserted = 0;
    let skipped = 0;

    for (const [i, gift] of DEFAULT_GIFTS.entries()) {
        const existing = await db.select().from(giftsConfig).where(eq(giftsConfig.name, gift.name)).limit(1);
        if (existing.length > 0) {
            skipped++;
            console.log(`  skip   ${gift.name}  (already exists)`);
            continue;
        }
        await db.insert(giftsConfig).values({
            name: gift.name,
            imageUrl: gift.iconType,
            iconType: gift.iconType,
            amount: gift.amount,
            isActive: "true",
            sortOrder: i,
        });
        inserted++;
        console.log(`  insert ${gift.name}  (₹${gift.amount})`);
    }

    console.log(`\nDone. inserted=${inserted} skipped=${skipped}`);

    await getPool().end();
}

main().catch(async (err) => {
    console.error(err);
    try { await getPool().end(); } catch { /* ignore */ }
    process.exit(1);
});
