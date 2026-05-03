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
            await storage.updateTransactionStatus(payload.transactionId, 'success');

            // Add bonus if applicable
            const transaction = await storage.getTransactionById(payload.transactionId);
            if (transaction && transaction.type === 'recharge') {
                const bonus = calculateBonus(transaction.amount, DEFAULT_BONUS_TIERS);
                if (bonus > 0) {
                    await storage.addToWallet(payload.data.userId, bonus);
                    console.log(`Bonus of ₹${bonus} added to wallet for user ${payload.data.userId}`);
                }
            }

            // Manus §4.1: push WS events instead of letting clients poll.
            publishRealtime(`payment:${payload.transactionId}`, {
                type: 'payment:status',
                status: 'success',
                transactionId: payload.transactionId,
            });
            if (payload.data?.userId) {
                const wallet = await storage.getWallet(payload.data.userId);
                publishRealtime(`wallet:${payload.data.userId}`, {
                    type: 'wallet:updated',
                    reason: 'recharge',
                    wallet,
                });
            }
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
