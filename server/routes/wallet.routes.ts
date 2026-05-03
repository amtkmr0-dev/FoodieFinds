/**
 * Wallet + billing routes.
 *
 * Mounted at `/api/wallet` from `server/routes/index.ts`. Owns:
 *   GET    /:userId
 *   GET    /:userId/transactions
 *   POST   /recharge
 *   POST   /deduct-call
 *   GET    /:userId/balance-status
 *   GET    /:userId/has-completed-recharge
 *
 * Order matters: literal-prefix routes (`/recharge`, `/deduct-call`) must
 * be registered BEFORE the parameterized `/:userId` routes so Express
 * doesn't match `recharge` as a userId.
 */

import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { calculateBonus, DEFAULT_BONUS_TIERS } from "@foodiefinds/shared";
import { publishRealtime } from "../realtime";
import { mockPaymentProcessor, computeCallCost } from "./_shared";

export function buildWalletRouter(): Router {
    const router = Router();

    // ---- Recharge (literal prefix - must come before /:userId) ----

    router.post("/recharge", async (req: Request, res: Response) => {
        try {
            const { userId, amount, paymentMethod } = req.body;

            if (!userId || !amount || !paymentMethod) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({ error: "Invalid amount. Amount must be a positive number." });
            }

            const MIN_AMOUNT = 10;
            const MAX_AMOUNT = 100000;
            if (numericAmount < MIN_AMOUNT) {
                return res.status(400).json({ error: `Minimum recharge amount is ₹${MIN_AMOUNT}` });
            }
            if (numericAmount > MAX_AMOUNT) {
                return res.status(400).json({ error: `Maximum recharge amount is ₹${MAX_AMOUNT}` });
            }

            const validPaymentMethods = ['upi', 'card', 'netbanking'];
            if (!validPaymentMethods.includes(paymentMethod)) {
                return res.status(400).json({ error: "Invalid payment method" });
            }

            // Duplicate payment detection.
            const recentTransactions = await storage.getTransactionHistory(userId, {
                status: 'pending',
                limit: 5,
            });
            const duplicateTransaction = recentTransactions.find(t =>
                t.amount === numericAmount &&
                t.paymentMethod === paymentMethod &&
                Date.now() - new Date(t.createdAt).getTime() < 60000,
            );
            if (duplicateTransaction) {
                return res.status(409).json({
                    error: "Duplicate payment detected",
                    message: "A similar payment is already being processed. Please wait or check your transaction history.",
                    transactionId: duplicateTransaction.transactionId,
                });
            }

            const bonus = calculateBonus(numericAmount, DEFAULT_BONUS_TIERS);
            const totalAmount = numericAmount + bonus;

            const paymentResponse = await mockPaymentProcessor.processPayment({
                userId,
                amount: totalAmount,
                paymentMethod,
                currency: 'INR',
                metadata: {
                    originalAmount: numericAmount,
                    bonusAmount: bonus,
                },
            });

            let mappedStatus: 'pending' | 'success' | 'failed' = 'pending';
            if (paymentResponse.status === 'success') mappedStatus = 'success';
            else if (paymentResponse.status === 'failed' || paymentResponse.status === 'cancelled' || paymentResponse.status === 'refunded') {
                mappedStatus = 'failed';
            }

            await storage.createRechargeTransaction({
                userId,
                amount: totalAmount,
                paymentMethod,
                status: mappedStatus,
                transactionId: paymentResponse.transactionId,
            });

            if (paymentResponse.status === 'success') {
                const wallet = await storage.addToWallet(userId, totalAmount);

                publishRealtime(`wallet:${userId}`, {
                    type: 'wallet:updated',
                    reason: 'recharge',
                    wallet,
                });
                publishRealtime(`payment:${paymentResponse.transactionId}`, {
                    type: 'payment:status',
                    status: 'success',
                    transactionId: paymentResponse.transactionId,
                    amount: totalAmount,
                    bonus,
                });

                res.json({ success: true, wallet, transaction: paymentResponse, bonus, totalAmount });
            } else if (paymentResponse.status === 'pending') {
                res.json({
                    success: false,
                    status: 'pending',
                    transactionId: paymentResponse.transactionId,
                    message: 'Payment is being processed',
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: paymentResponse.error?.message || 'Payment failed',
                    transaction: paymentResponse,
                });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- End-of-call billing (literal prefix) ----

    router.post("/deduct-call", async (req: Request, res: Response) => {
        try {
            const {
                userId,
                creatorId,
                callType,
                durationSeconds,
                pricePerMinute,
                giftCost,
                // NOTE: `totalCost` may be present for back-compat but we IGNORE it (Manus §2.1).
            } = req.body ?? {};

            if (!userId || !creatorId) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            if (typeof durationSeconds !== "number" || durationSeconds < 0) {
                return res.status(400).json({ error: "Invalid durationSeconds" });
            }
            if (typeof pricePerMinute !== "number" || pricePerMinute < 0) {
                return res.status(400).json({ error: "Invalid pricePerMinute" });
            }
            const allowedCallTypes = new Set(["audio", "video"]);
            const safeCallType = allowedCallTypes.has(callType) ? callType : "audio";
            const safeGiftCost = Math.max(0, Number.isFinite(giftCost) ? Number(giftCost) : 0);

            const { billableMinutes, callCost } = computeCallCost(durationSeconds, pricePerMinute);
            const totalCost = callCost + safeGiftCost;

            const result = await storage.executeWalletOperation({
                userId,
                operation: 'debit',
                amount: totalCost,
                transactionId: `CALL${Date.now()}`,
                description: `Call with ${creatorId}`,
                metadata: {
                    creatorId,
                    callType: safeCallType,
                    durationSeconds,
                    pricePerMinute,
                    billableMinutes,
                    callCost,
                    giftCost: safeGiftCost,
                },
            });

            if (result.success) {
                await storage.createCallTransaction({
                    userId,
                    creatorId,
                    callType: safeCallType,
                    durationSeconds,
                    pricePerMinute,
                    totalCost,
                });

                const callHistory = await storage.getTransactionHistory(userId, { type: 'call', limit: 2 });
                const firstCall = callHistory.length === 1;

                publishRealtime(`wallet:${userId}`, {
                    type: 'wallet:updated',
                    reason: 'call_deduction',
                    wallet: result.wallet,
                    totalCost,
                });

                res.json({
                    success: true,
                    wallet: result.wallet,
                    billableMinutes,
                    callCost,
                    giftCost: safeGiftCost,
                    totalCost,
                    firstCall,
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error?.message || 'Deduction failed',
                });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    // ---- /:userId/* (specific paths first, bare /:userId last) ----

    router.get("/:userId/transactions", async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const { type, status, paymentMethod, limit, offset } = req.query;

            const transactions = await storage.getTransactionHistory(userId, {
                type: type as string,
                status: status as string,
                paymentMethod: paymentMethod as string,
                limit: limit ? parseInt(limit as string) : undefined,
                offset: offset ? parseInt(offset as string) : undefined,
            });

            res.json(transactions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/:userId/balance-status", async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const pricePerMinute = parseFloat((req.query.pricePerMinute as string) ?? "0");
            const durationSeconds = parseInt((req.query.durationSeconds as string) ?? "0", 10);
            const giftCost = parseFloat((req.query.giftCost as string) ?? "0");

            if (Number.isNaN(pricePerMinute) || pricePerMinute < 0) {
                return res.status(400).json({ error: "Invalid pricePerMinute" });
            }

            const wallet = await storage.getWallet(userId);
            const balance = wallet
                ? typeof wallet.balance === "number"
                    ? wallet.balance
                    : parseFloat(wallet.balance as unknown as string)
                : 0;

            const { billableMinutes, callCost } = computeCallCost(durationSeconds, pricePerMinute);
            const safeGiftCost = Math.max(0, Number.isFinite(giftCost) ? giftCost : 0);
            const costAccrued = callCost + safeGiftCost;
            const liveBalance = balance - costAccrued;
            const remainingSeconds = pricePerMinute > 0
                ? Math.max(0, Math.floor(((balance - safeGiftCost) / pricePerMinute) * 60))
                : 0;

            res.json({
                balance,
                billableMinutes,
                callCost,
                giftCost: safeGiftCost,
                costAccrued,
                liveBalance,
                remainingSeconds,
                timestamp: Date.now(),
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/:userId/has-completed-recharge", async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const recharges = await storage.getTransactionHistory(userId, {
                type: 'recharge',
                status: 'success',
                limit: 1,
            });
            res.json({ hasCompletedRecharge: recharges.length > 0 });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/:userId", async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            let wallet = await storage.getWallet(userId);
            if (!wallet) {
                wallet = await storage.createWallet(userId, 450);
            }
            res.json(wallet);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}
