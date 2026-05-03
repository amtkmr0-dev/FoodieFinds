/**
 * Shared building blocks for the per-feature route modules.
 *
 * The mock payment processor is a singleton because it holds in-memory
 * webhook listeners and transaction state - splitting it per-router would
 * mean different routers see different transactions.
 *
 * `computeCallCost` is the canonical billing helper from Manus §2.1; it
 * lives here so the wallet and (future) call-session routers can share it
 * without re-importing each other.
 */

import { storage } from "../storage";
import { getMockPaymentProcessor } from "@foodiefinds/api-client";
import { calculateBonus, DEFAULT_BONUS_TIERS } from "@foodiefinds/shared";
import { publishRealtime } from "../realtime";

// ---- payment processor singleton ----

export const mockPaymentProcessor = getMockPaymentProcessor({
    config: {
        enableSimulation: true,
        successRate: 0.95,
        minDelay: 500,
        maxDelay: 3000,
        enableWebhooks: true,
        webhookDelay: 1000,
    },
    onWebhook: async (payload) => {
        console.log('Payment webhook received:', payload);

        if (payload.eventType === 'payment.success') {
            // Look up the transaction record so we know who owns it and
            // whether we've already credited the wallet (idempotency).
            //
            // FIX (post-merge audit): the previous version of this handler
            //   1. ONLY credited the bonus, never the principal. With
            //      simulation defaulting to async-pending, the synchronous
            //      success branch in wallet.routes.ts never fires, so the
            //      principal was silently lost.
            //   2. Derived the userId from `payload.data.userId`, which the
            //      mock processor computed as `txnId.split('_')[0]` - but
            //      generateTransactionId emits `TXN<...>` with no underscore,
            //      so credits went to a phantom wallet keyed by the full
            //      transaction id.
            // Both bugs are fixed below by reading the user from the stored
            // transaction record and crediting `transaction.amount` (which
            // was already set to `principal + bonus` in wallet.routes.ts).
            const transaction = await storage.getTransactionById(payload.transactionId);
            if (!transaction) {
                console.warn(`Webhook for unknown transaction: ${payload.transactionId}`);
                return;
            }

            const wasAlreadySuccess = transaction.status === 'success';
            await storage.updateTransactionStatus(payload.transactionId, 'success');

            let wallet;
            if (!wasAlreadySuccess && transaction.type === 'recharge') {
                // transaction.amount = principal + bonus (set when the
                // pending recharge transaction was created). Credit it once.
                wallet = await storage.addToWallet(transaction.userId, transaction.amount);
                console.log(`Recharge credited: user=${transaction.userId} amount=₹${transaction.amount} txn=${payload.transactionId}`);
            } else {
                wallet = await storage.getWallet(transaction.userId);
            }

            // Manus §4.1: push WS events instead of letting clients poll.
            publishRealtime(`payment:${payload.transactionId}`, {
                type: 'payment:status',
                status: 'success',
                transactionId: payload.transactionId,
            });
            publishRealtime(`wallet:${transaction.userId}`, {
                type: 'wallet:updated',
                reason: 'recharge',
                wallet,
            });
        } else if (payload.eventType === 'payment.failed') {
            await storage.updateTransactionStatus(payload.transactionId, 'failed');
            publishRealtime(`payment:${payload.transactionId}`, {
                type: 'payment:status',
                status: 'failed',
                transactionId: payload.transactionId,
            });
        }
    },
});

// ---- shared helpers ----

/**
 * Generate a friendly placeholder username from a phone number.
 * Used by signup-via-OTP when the user hasn't picked a name yet.
 */
export function generateUsername(_phone: string): string {
    const adjectives = ["Swift", "Bright", "Cool", "Calm", "Bold", "Quick", "Happy", "Lucky", "Keen", "Wise"];
    const nouns = ["Hawk", "Star", "Wave", "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Raven"];
    const randomNum = Math.floor(Math.random() * 9999);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${randomNum}`;
}

/**
 * Canonical call-cost calculation (Manus §2.1).
 * Per-minute billing with partial minutes rounded up; matches the policy
 * advertised in the call UI ("a 30s call is charged as 1 minute").
 *
 * Negative inputs are clamped to 0 so a tampered client can't underpay.
 */
export function computeCallCost(durationSeconds: number, pricePerMinute: number): {
    billableMinutes: number;
    callCost: number;
} {
    const safeDuration = Math.max(0, Math.floor(durationSeconds || 0));
    const safeRate = Math.max(0, Number(pricePerMinute) || 0);
    const billableMinutes = safeDuration === 0 ? 0 : Math.max(1, Math.ceil(safeDuration / 60));
    return { billableMinutes, callCost: billableMinutes * safeRate };
}
