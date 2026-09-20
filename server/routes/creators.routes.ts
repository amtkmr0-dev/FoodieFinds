/**
 * Public-facing creator routes (PR #7).
 *
 * Mounted at `/api/creators` from `server/routes/index.ts`.
 *
 *   GET  /api/creators            -> list all creators (public)
 *   GET  /api/creators/:id        -> single creator detail (public)
 *   GET  /api/creators/me/dashboard
 *        -> creator-only: today/total earnings, recent calls.
 *           Requires JWT with role='creator'.
 *
 * The list/detail endpoints replace the static `client/src/lib/creatorsData.ts`
 * array. The frontend now hits these endpoints with a static-data fallback,
 * so even if the API is unreachable the home page still renders.
 *
 * The /me/dashboard endpoint computes earnings on-the-fly from the
 * `transactions` table (where type='call' and metadata.creatorId == JWT
 * subject). No new aggregate table needed for the demo.
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { authenticateToken, requireRole } from "../auth";
import { asyncHandler, errors } from "../middleware/errorHandler";

export function buildCreatorsRouter(): Router {
    const router = Router();

    // Public: list all creators.
    router.get("/", asyncHandler(async (_req: Request, res: Response) => {
        const creators = await storage.getCreators();
        // Map server-shape -> client-shape (matches creatorsData.ts).
        // The server stores isOnline / randomMatchEnabled as text "true"/"false"
        // for Drizzle compatibility; translate to booleans for the client.
        res.json(creators.map(toClientShape));
    }));

    // /me MUST be registered before /:id so Express doesn't match "me" as an id.
    // Creator-only: returns earnings summary + recent calls for the
    // authenticated creator (JWT subject = their creator profile id).
    router.get(
        "/me/dashboard",
        authenticateToken,
        requireRole("creator"),
        asyncHandler(async (req: Request, res: Response) => {
            const creatorId = (req as any).user.userId as string;
            const summary = await storage.getCreatorEarningsSummary(creatorId);

            const profile = await storage.getCreatorById(creatorId);
            if (!profile) {
                throw errors.notFound("Creator profile not found");
            }

            res.json({
                creator: toClientShape(profile),
                summary,
            });
        }),
    );

    // Public: single creator detail.
    router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
        const creator = await storage.getCreatorById(req.params.id);
        if (!creator) {
            throw errors.notFound("Creator not found");
        }
        res.json(toClientShape(creator));
    }));

    return router;
}

// Convert the server-side CreatorProfile (with text "true"/"false") to the
// client-facing shape (booleans, matching the static creatorsData.ts).
// Also strips `mobileNumber` from the public payload — that's PII and
// only needed server-side for OTP login.
function toClientShape(c: {
    id: string;
    mobileNumber: string;
    name: string;
    country: string;
    followers: number;
    pricePerMinute: number;
    isOnline: string;
    randomMatchEnabled: string;
    allowedCallTypes: string;
    languages: unknown;
    aboutMe: string | null;
    talksAbout: unknown;
    hobbies: unknown;
    foodPreferences: unknown;
    sportsInterests: unknown;
    photoUrl: string | null;
}) {
    return {
        id: c.id,
        name: c.name,
        // creatorsData.ts uses `price` not `pricePerMinute`; preserve the legacy field name.
        price: c.pricePerMinute,
        country: c.country,
        followers: c.followers,
        languages: Array.isArray(c.languages) ? c.languages : [],
        isOnline: c.isOnline === "true",
        randomMatchEnabled: c.randomMatchEnabled === "true",
        allowedCallTypes: c.allowedCallTypes as "audio" | "video" | "both",
        aboutMe: c.aboutMe ?? undefined,
        talksAbout: Array.isArray(c.talksAbout) ? c.talksAbout : undefined,
        hobbies: Array.isArray(c.hobbies) ? c.hobbies : undefined,
        foodPreferences: Array.isArray(c.foodPreferences) ? c.foodPreferences : undefined,
        sportsInterests: Array.isArray(c.sportsInterests) ? c.sportsInterests : undefined,
        photoUrl: c.photoUrl ?? undefined,
    };
}
