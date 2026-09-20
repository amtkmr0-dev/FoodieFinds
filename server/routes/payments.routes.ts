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
import { authenticateToken, requireRole } from "../auth";
import { asyncHandler, errors } from "../middleware/errorHandler";

export function buildPaymentsRouter(): Router {
    const router = Router();

    /**
     * Status check. Authenticated; ownership verified by looking up the
     * transaction record. The `transactionId` itself is treated as a soft
     * capability (you have to know it), but we still require auth so an
     * unauthenticated probe of someone else's payment is rejected.
     */
    router.get("/:transactionId/status", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
        const { transactionId } = req.params;
        const paymentStatus = await mockPaymentProcessor.getPaymentStatus({ transactionId });
        if (!paymentStatus) {
            throw errors.notFound("Transaction not found");
        }

        // Ownership check unless caller is admin.
        const user = (req as any).user as { userId: string; role: string };
        if (user.role !== "admin" && user.role !== "super_user") {
            const stored = await storage.getTransactionByID(transactionId);
            if (stored && stored.userId !== user.userId) {
                throw errors.forbidden("Not your transaction");
            }
        }

        res.json(paymentStatus);
    }));

    /**
     * Cancel: same ownership rule as status. A user can cancel their own
     * pending payment; an admin can cancel any.
     */
    router.post("/:transactionId/cancel", authenticateToken, asyncHandler(async (req: Request, res: Response) => {
        const { transactionId } = req.params;
        const user = (req as any).user as { userId: string; role: string };
        if (user.role !== "admin" && user.role !== "super_user") {
            const stored = await storage.getTransactionByID(transactionId);
            if (stored && stored.userId !== user.userId) {
                throw errors.forbidden("Not your transaction");
            }
        }
        const cancelledPayment = await mockPaymentProcessor.cancelPayment(transactionId);
        await storage.updateTransactionStatus(transactionId, 'cancelled');
        res.json({ success: true, transaction: cancelledPayment });
    }));

    /**
     * Refund: admin/support only. Refunds reverse a wallet credit, so this
     * is a privileged operation. (Pre-audit, this was open to anyone.)
     */
    router.post("/refund", authenticateToken, requireRole("admin", "super_user", "support"), asyncHandler(async (req: Request, res: Response) => {
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
            throw errors.badRequest("Failed to rollback transaction");
        }
    }));

    return router;
}
