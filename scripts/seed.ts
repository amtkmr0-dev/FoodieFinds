/**
 * Seed initial data into the database.
 *
 * Currently seeds:
 *   - The gifts catalog (matches the defaults that MemStorage loads at boot).
 *   - The 9 demo creators (PR #7) so the user app has something to browse
 *     and the creator OTP login has something to authenticate against.
 *
 * Idempotent: skips rows that already exist by name (gifts) or id (creators).
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/seed.ts
 */
import { eq } from "drizzle-orm";
import { giftsConfig, creatorProfiles } from "@shared/schema";
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

// PR #7: same 9 creators as the static client/src/lib/creatorsData.ts.
// Phone numbers follow 9000000001..9000000009 so OTP login is predictable.
const DEFAULT_CREATORS = [
    {
        id: "1", mobileNumber: "9000000001", name: "Sarah Johnson", country: "India",
        followers: 1250, pricePerMinute: 45, isOnline: "true", randomMatchEnabled: "true", allowedCallTypes: "both",
        languages: ["English", "Hindi", "Tamil"],
        aboutMe: "Friendly conversationalist who loves discussing life experiences and offering advice on personal growth.",
        talksAbout: ["Life coaching", "Relationships", "Career guidance", "Mental wellness"],
        hobbies: ["Reading", "Yoga", "Traveling", "Cooking"],
        foodPreferences: ["Vegetarian", "Italian cuisine", "Indian sweets"],
        sportsInterests: ["Cricket", "Badminton", "Running"],
    },
    {
        id: "2", mobileNumber: "9000000002", name: "Rahul Verma", country: "India",
        followers: 890, pricePerMinute: 38, isOnline: "false", randomMatchEnabled: "false", allowedCallTypes: "video",
        languages: ["Hindi", "English"],
        aboutMe: "Tech enthusiast and startup mentor with 10 years of experience in software development.",
        talksAbout: ["Technology", "Startups", "Programming", "Career advice"],
        hobbies: ["Gaming", "Photography", "Blogging"],
        foodPreferences: ["Non-vegetarian", "North Indian", "Chinese"],
        sportsInterests: ["Football", "Chess", "Table tennis"],
    },
    {
        id: "3", mobileNumber: "9000000003", name: "Priya Sharma", country: "India",
        followers: 2100, pricePerMinute: 52, isOnline: "true", randomMatchEnabled: "true", allowedCallTypes: "both",
        languages: ["English", "Hindi", "Marathi"],
        aboutMe: "Business consultant and motivational speaker passionate about empowering entrepreneurs.",
        talksAbout: ["Business strategy", "Entrepreneurship", "Marketing", "Leadership"],
        hobbies: ["Public speaking", "Writing", "Gardening"],
        foodPreferences: ["Vegetarian", "South Indian", "Continental"],
        sportsInterests: ["Tennis", "Swimming", "Cycling"],
    },
    {
        id: "4", mobileNumber: "9000000004", name: "Amit Patel", country: "India",
        followers: 1500, pricePerMinute: 40, isOnline: "true", randomMatchEnabled: "false", allowedCallTypes: "audio",
        languages: ["Gujarati", "Hindi", "English"],
        aboutMe: "Finance expert helping people make smart investment decisions and achieve financial freedom.",
        talksAbout: ["Investment", "Stock market", "Personal finance", "Real estate"],
        hobbies: ["Reading", "Playing guitar", "Hiking"],
        foodPreferences: ["Vegetarian", "Gujarati cuisine", "Street food"],
        sportsInterests: ["Cricket", "Volleyball", "Jogging"],
    },
    {
        id: "5", mobileNumber: "9000000005", name: "Neha Kapoor", country: "India",
        followers: 1780, pricePerMinute: 48, isOnline: "true", randomMatchEnabled: "true", allowedCallTypes: "both",
        languages: ["English", "Hindi", "Punjabi"],
        aboutMe: "Fashion designer and lifestyle blogger who loves sharing creative ideas and style tips.",
        talksAbout: ["Fashion", "Lifestyle", "Beauty", "Social media"],
        hobbies: ["Sketching", "Shopping", "Dancing", "Photography"],
        foodPreferences: ["Vegetarian", "Punjabi cuisine", "Fusion food"],
        sportsInterests: ["Zumba", "Yoga", "Badminton"],
    },
    {
        id: "6", mobileNumber: "9000000006", name: "Vikram Singh", country: "India",
        followers: 750, pricePerMinute: 35, isOnline: "false", randomMatchEnabled: "false", allowedCallTypes: "video",
        languages: ["Hindi", "English"],
        aboutMe: "Fitness trainer and nutrition coach dedicated to helping people achieve their health goals.",
        talksAbout: ["Fitness", "Nutrition", "Weight loss", "Muscle building"],
        hobbies: ["Gym training", "Sports", "Cooking healthy meals"],
        foodPreferences: ["High protein", "Salads", "Smoothies"],
        sportsInterests: ["Bodybuilding", "Boxing", "Running", "Basketball"],
    },
    {
        id: "7", mobileNumber: "9000000007", name: "Anjali Mehta", country: "India",
        followers: 1320, pricePerMinute: 42, isOnline: "true", randomMatchEnabled: "true", allowedCallTypes: "audio",
        languages: ["English", "Hindi", "Bengali"],
        aboutMe: "Psychologist and counselor specializing in stress management and emotional well-being.",
        talksAbout: ["Mental health", "Stress management", "Relationships", "Self-care"],
        hobbies: ["Meditation", "Reading", "Painting", "Listening to music"],
        foodPreferences: ["Vegetarian", "Bengali cuisine", "Organic food"],
        sportsInterests: ["Walking", "Swimming", "Yoga"],
    },
    {
        id: "8", mobileNumber: "9000000008", name: "Karan Malhotra", country: "India",
        followers: 1950, pricePerMinute: 50, isOnline: "true", randomMatchEnabled: "false", allowedCallTypes: "both",
        languages: ["Hindi", "English", "Urdu"],
        aboutMe: "Digital marketing expert helping brands grow their online presence and reach their audience.",
        talksAbout: ["Digital marketing", "SEO", "Content creation", "Brand building"],
        hobbies: ["Traveling", "Photography", "Blogging", "Music"],
        foodPreferences: ["Non-vegetarian", "Mughlai", "Italian"],
        sportsInterests: ["Cricket", "Football", "Snooker"],
    },
    {
        id: "9", mobileNumber: "9000000009", name: "Kavya Iyer", country: "India",
        followers: 1650, pricePerMinute: 46, isOnline: "false", randomMatchEnabled: "false", allowedCallTypes: "video",
        languages: ["English", "Tamil", "Hindi"],
        aboutMe: "Classical dancer and arts enthusiast sharing insights on Indian culture and performing arts.",
        talksAbout: ["Dance", "Indian culture", "Arts", "Music", "Traditions"],
        hobbies: ["Dancing", "Teaching", "Traveling", "Cooking"],
        foodPreferences: ["Vegetarian", "South Indian", "Traditional sweets"],
        sportsInterests: ["Badminton", "Swimming", "Yoga"],
    },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set; aborting.");
        process.exit(1);
    }

    const db = getDb();

    // ---- gifts ----
    let giftsInserted = 0;
    let giftsSkipped = 0;
    for (const [i, gift] of DEFAULT_GIFTS.entries()) {
        const existing = await db.select().from(giftsConfig).where(eq(giftsConfig.name, gift.name)).limit(1);
        if (existing.length > 0) {
            giftsSkipped++;
            console.log(`  skip   gift  ${gift.name}  (already exists)`);
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
        giftsInserted++;
        console.log(`  insert gift  ${gift.name}  (₹${gift.amount})`);
    }

    // ---- creators ----
    let creatorsInserted = 0;
    let creatorsSkipped = 0;
    for (const c of DEFAULT_CREATORS) {
        const existing = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, c.id)).limit(1);
        if (existing.length > 0) {
            creatorsSkipped++;
            console.log(`  skip   creator ${c.id} ${c.name}  (already exists)`);
            continue;
        }
        await db.insert(creatorProfiles).values({
            id: c.id,
            mobileNumber: c.mobileNumber,
            name: c.name,
            country: c.country,
            followers: c.followers,
            pricePerMinute: c.pricePerMinute,
            isOnline: c.isOnline,
            randomMatchEnabled: c.randomMatchEnabled,
            allowedCallTypes: c.allowedCallTypes,
            languages: c.languages,
            aboutMe: c.aboutMe,
            talksAbout: c.talksAbout,
            hobbies: c.hobbies,
            foodPreferences: c.foodPreferences,
            sportsInterests: c.sportsInterests,
        });
        creatorsInserted++;
        console.log(`  insert creator ${c.id} ${c.name}  (₹${c.pricePerMinute}/min)`);
    }

    console.log(`\nDone.`);
    console.log(`  gifts:    inserted=${giftsInserted} skipped=${giftsSkipped}`);
    console.log(`  creators: inserted=${creatorsInserted} skipped=${creatorsSkipped}`);

    await getPool().end();
}

main().catch(async (err) => {
    console.error(err);
    try { await getPool().end(); } catch { /* ignore */ }
    process.exit(1);
});
