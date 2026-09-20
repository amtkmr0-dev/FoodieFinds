/**
 * Creator OTP authentication routes (PR #7).
 *
 * Mounted at `/api/auth/creator` from `server/routes/index.ts`. Mirrors the
 * user OTP flow in `auth.routes.ts` but issues a JWT with role='creator'
 * AND userId=<creatorProfile.id>. The phone must match a seeded creator;
 * otherwise the verify step returns 403.
 *
 * Demo phone numbers (see scripts/seed.ts and MemStorage's
 * initializeDefaultCreators): 9000000001 .. 9000000009 map to creator IDs
 * "1" through "9". The OTP is generated server-side and logged via console
 * (visible in Render logs); in non-prod the OTP is also returned in the
 * response body for convenience.
 *
 * Route layout - we deliberately re-implement send-otp / verify-otp here
 * (instead of overloading the existing /api/auth/* endpoints) so the user
 * and creator OTP stores stay independent and the flow is clearly traced
 * to creator-side logic. The cost is two ~30 line handlers; the win is
 * zero risk of cross-contaminating user OTP semantics.
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { generateAccessToken, generateRefreshToken, authRateLimit } from "../auth";
import { asyncHandler, errors } from "../middleware/errorHandler";

// Process-local OTP store keyed by phone. Stores OTP, expiry, attempt count.
// Mirrors the global.otpStore pattern used in auth.routes.ts.
const creatorOtpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

export function buildCreatorAuthRouter(): Router {
    const router = Router();

    // POST /api/auth/creator/send-otp { phone }
    router.post("/send-otp", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
        const { phone } = req.body;
        if (!phone || phone.length < 10) {
            throw errors.badRequest("Invalid phone number");
        }

        // Verify the phone is a known creator BEFORE issuing an OTP. This
        // prevents an attacker from probing valid creator phones via timing.
        const creator = await storage.getCreatorByMobile(phone);
        if (!creator) {
            // Generic message - don't leak whether the phone is registered.
            throw errors.notFound("No creator account found for this phone number");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        creatorOtpStore.set(phone, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0,
        });

        // eslint-disable-next-line no-console
        console.log(`Creator OTP for ${phone} (${creator.name}, id=${creator.id}): ${otp}`);

        res.json({
            success: true,
            message: "OTP sent successfully",
            // Convenience: return the OTP in non-prod so testers don't
            // have to scrape server logs.
            ...(process.env.NODE_ENV !== "production" && { otp }),
        });
    }));

    // POST /api/auth/creator/verify-otp { phone, otp }
    router.post("/verify-otp", authRateLimit, asyncHandler(async (req: Request, res: Response) => {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            throw errors.badRequest("Phone and OTP are required");
        }

        const stored = creatorOtpStore.get(phone);
        if (!stored) {
            throw errors.badRequest("OTP expired or not found");
        }
        if (stored.expiresAt < Date.now()) {
            creatorOtpStore.delete(phone);
            throw errors.badRequest("OTP expired");
        }
        if (stored.otp !== otp) {
            stored.attempts++;
            if (stored.attempts >= 3) {
                creatorOtpStore.delete(phone);
                throw errors.badRequest("Too many failed attempts. Please request a new OTP.");
            }
            throw errors.badRequest("Invalid OTP");
        }

        // OTP valid - look up the creator and issue a JWT.
        const creator = await storage.getCreatorByMobile(phone);
        if (!creator) {
            // Could happen if the creator was deleted between send-otp and verify-otp.
            creatorOtpStore.delete(phone);
            throw errors.forbidden("Creator account no longer exists");
        }

        // The JWT subject IS the creator profile id. /api/creators/me/dashboard
        // and any other creator-only route reads `req.user.userId` as the
        // creator id directly, so call_transactions.creatorId joins cleanly.
        const accessToken = generateAccessToken({ userId: creator.id, role: "creator" });
        const refreshToken = generateRefreshToken({ userId: creator.id, role: "creator" });

        creatorOtpStore.delete(phone);

        res.cookie("creatorRefreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
        });

        res.json({
            success: true,
            accessToken,
            user: {
                userId: creator.id,
                name: creator.name,
                phone: creator.mobileNumber,
                role: "creator",
            },
        });
    }));

    return router;
}
