/**
 * Admin-only routes (gift management) and the public bonus calculator.
 *
 * Mounted at `/api` from `server/routes/index.ts` so paths read as:
 *   GET    /api/admin/gifts
 *   POST   /api/admin/gifts
 *   PATCH  /api/admin/gifts/:id
 *   DELETE /api/admin/gifts/:id
 *   GET    /api/bonus/calculate
 *
 * Auth model (post-audit fix): every `/admin/*` route requires
 * authenticateToken AND `requireRole('admin', 'super_user')`. The bonus
 * calculator stays public (it's a stateless utility for the recharge UI).
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { insertGiftConfigSchema } from "@shared/schema";
import { calculateBonus, DEFAULT_BONUS_TIERS } from "@foodiefinds/shared";
import { authenticateToken, requireRole } from "../auth";
import { asyncHandler, errors } from "../middleware/errorHandler";

export function buildAdminRouter(): Router {
    const router = Router();

    // Apply auth + admin-role check to every /admin/* route below.
    const adminOnly = [authenticateToken, requireRole("admin", "super_user")];

    // ---- /admin/gifts CRUD ----

    router.get("/admin/gifts", ...adminOnly, asyncHandler(async (_req: Request, res: Response) => {
        const gifts = await storage.getAllGifts();
        res.json(gifts);
    }));

    router.post("/admin/gifts", ...adminOnly, asyncHandler(async (req: Request, res: Response) => {
        // NOTE: a Zod parse failure currently surfaces as 500 via the central
        // handler (matches pre-refactor behavior - the old try/catch caught
        // the ZodError and emitted a 500 too). A future PR can teach
        // errorHandler.ts to recognize ZodError and emit 400; out of scope
        // for the asyncHandler refactor.
        const validatedData = insertGiftConfigSchema.parse(req.body);
        const gift = await storage.createGift(validatedData);
        res.json(gift);
    }));

    router.patch("/admin/gifts/:id", ...adminOnly, asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const gift = await storage.updateGift(id, req.body);
        res.json(gift);
    }));

    router.delete("/admin/gifts/:id", ...adminOnly, asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await storage.deleteGift(id);
        res.json({ success: true });
    }));

    // ---- Public bonus calculator ----

    router.get("/bonus/calculate", asyncHandler(async (req: Request, res: Response) => {
        const { amount } = req.query;
        if (!amount) {
            throw errors.badRequest("Amount is required");
        }

        const numericAmount = parseFloat(amount as string);
        const bonus = calculateBonus(numericAmount, DEFAULT_BONUS_TIERS);
        const totalAmount = numericAmount + bonus;

        res.json({
            amount: numericAmount,
            bonus,
            totalAmount,
            bonusPercentage: bonus > 0 ? Math.round((bonus / numericAmount) * 100) : 0,
        });
    }));

    return router;
}
