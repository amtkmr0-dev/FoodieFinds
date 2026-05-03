/**
 * Payment status / cancel / refund routes.
 *
 * Mounted at `/api/payments` from `server/routes/index.ts`.
 *
 * The actual payment-success / payment-failure side effects (wallet
 * mutations, realtime publish) live on the mock processor's `onWebhook`
 * handler in `_shared.ts`. These HTTP routes are just inspection /
 * cancellation / refund endpoints.
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { mockPaymentProcessor } from "./_shared";

export function buildPaymentsRouter(): Router {
    const router = Router();

    router.get("/:transactionId/status", async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;
            const paymentStatus = await mockPaymentProcessor.getPaymentStatus({ transactionId });

            if (!paymentStatus) {
                return res.status(404).json({ error: "Transaction not found" });
            }
            res.json(paymentStatus);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/:transactionId/cancel", async (req: Request, res: Response) => {
        try {
            const { transactionId } = req.params;
            const cancelledPayment = await mockPaymentProcessor.cancelPayment(transactionId);
            await storage.updateTransactionStatus(transactionId, 'cancelled');
            res.json({ success: true, transaction: cancelledPayment });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post("/refund", async (req: Request, res: Response) => {
        try {
            const { transactionId, amount, reason } = req.body;
            const refundResponse = await mockPaymentProcessor.processRefund({
                transactionId,
                amount,
                reason,
            });
            const rollbackSuccess = await storage.rollbackTransaction(transactionId);
            if (rollbackSuccess) {
                res.json({ success: true, transaction: refundResponse });
            } else {
                res.status(400).json({ error: "Failed to rollback transaction" });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
