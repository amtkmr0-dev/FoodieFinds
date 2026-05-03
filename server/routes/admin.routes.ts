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

export function buildAdminRouter(): Router {
    const router = Router();

    // Apply auth + admin-role check to every /admin/* route below.
    const adminOnly = [authenticateToken, requireRole("admin", "super_user")];

    // ---- /admin/gifts CRUD ----

    router.get("/admin/gifts", ...adminOnly, async (_req: Request, res: Response) => {
        try {
            const gifts = await storage.getAllGifts();
            res.json(gifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/admin/gifts", ...adminOnly, async (req: Request, res: Response) => {
        try {
            const validatedData = insertGiftConfigSchema.parse(req.body);
            const gift = await storage.createGift(validatedData);
            res.json(gift);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.patch("/admin/gifts/:id", ...adminOnly, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const gift = await storage.updateGift(id, req.body);
            res.json(gift);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete("/admin/gifts/:id", ...adminOnly, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await storage.deleteGift(id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- Public bonus calculator ----

    router.get("/bonus/calculate", async (req: Request, res: Response) => {
        try {
            const { amount } = req.query;
            if (!amount) {
                return res.status(400).json({ error: "Amount is required" });
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
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
