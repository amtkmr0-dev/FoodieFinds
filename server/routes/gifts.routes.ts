/**
 * User-facing gift routes.
 *
 * Mounted at `/api/gifts` from `server/routes/index.ts`. Admin-only gift
 * management lives in `admin.routes.ts`.
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";

export function buildGiftsRouter(): Router {
    const router = Router();

    router.get("/", async (_req: Request, res: Response) => {
        try {
            const gifts = await storage.getActiveGifts();
            res.json(gifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/send", async (req: Request, res: Response) => {
        try {
            const { senderId, recipientId, giftId, quantity, message } = req.body;
            if (!senderId || !recipientId || !giftId || !quantity) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const gift = await storage.getGift(giftId);
            if (!gift) {
                return res.status(404).json({ error: "Gift not found" });
            }

            const totalAmount = gift.price * quantity;

            const result = await storage.executeWalletOperation({
                userId: senderId,
                operation: 'debit',
                amount: totalAmount,
                transactionId: `GIFT${Date.now()}`,
                description: `Gift sent to ${recipientId}`,
                metadata: { recipientId, giftId, quantity, message },
            });

            if (result.success) {
                await storage.createGiftTransaction({
                    senderId,
                    receiverId: recipientId,
                    giftId,
                    quantity,
                    totalAmount,
                    message,
                });
                res.json({ success: true, wallet: result.wallet });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error?.message || 'Gift sending failed',
                });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
