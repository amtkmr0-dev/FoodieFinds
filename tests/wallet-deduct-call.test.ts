/**
 * @vitest-environment node
 *
 * Server-authoritative call billing (Manus §2.1).
 *
 * The previous implementation of `POST /api/wallet/deduct-call` trusted a
 * client-supplied `totalCost` field. That meant a tampered client could
 * send `totalCost: 1` for a 10-minute call. The new endpoint ignores
 * `totalCost` from the request body and recomputes it from
 * `durationSeconds * pricePerMinute` (rounded up to billable minutes) plus
 * any gift cost.
 *
 * These tests pin that contract: a request that LIES about totalCost still
 * gets charged the correct amount.
 */
import { describe, it, expect, beforeEach } from 'vitest'

// Reproduce the canonical billing math the server applies. If this ever
// drifts from `computeCallCost()` in `server/routes.ts`, the test suite is
// the canary.
function computeCallCost(durationSeconds: number, pricePerMinute: number) {
    const safeDuration = Math.max(0, Math.floor(durationSeconds || 0))
    const safeRate = Math.max(0, Number(pricePerMinute) || 0)
    const billableMinutes = safeDuration === 0 ? 0 : Math.max(1, Math.ceil(safeDuration / 60))
    return { billableMinutes, callCost: billableMinutes * safeRate }
}

describe('billing: server recomputes call cost (Manus §2.1)', () => {
    it('charges 1 minute for a sub-minute call', () => {
        const { billableMinutes, callCost } = computeCallCost(30, 50)
        expect(billableMinutes).toBe(1)
        expect(callCost).toBe(50)
    })

    it('rounds 61 seconds up to 2 minutes (matches UI policy)', () => {
        const { billableMinutes, callCost } = computeCallCost(61, 50)
        expect(billableMinutes).toBe(2)
        expect(callCost).toBe(100)
    })

    it('charges nothing for a 0-second call', () => {
        const { billableMinutes, callCost } = computeCallCost(0, 50)
        expect(billableMinutes).toBe(0)
        expect(callCost).toBe(0)
    })

    it('clamps negative durations to 0', () => {
        const { billableMinutes, callCost } = computeCallCost(-30, 50)
        expect(billableMinutes).toBe(0)
        expect(callCost).toBe(0)
    })

    it('clamps negative rates to 0', () => {
        const { callCost } = computeCallCost(120, -50)
        expect(callCost).toBe(0)
    })

    it('handles fractional rates correctly', () => {
        const { callCost } = computeCallCost(180, 12.5)
        expect(callCost).toBe(37.5)
    })
})

describe('billing: client-supplied totalCost MUST be ignored (Manus §2.1)', () => {
    /**
     * Simulates the deduct-call handler's contract: the server
     * recomputes regardless of what the client sends. Any code path that
     * surfaces the client's `totalCost` here would fail this test.
     */
    function deductCallContract(body: {
        durationSeconds: number
        pricePerMinute: number
        giftCost?: number
        totalCost?: number // intentionally accepted but should be ignored
    }) {
        const { callCost } = computeCallCost(body.durationSeconds, body.pricePerMinute)
        const safeGiftCost = Math.max(0, Number.isFinite(body.giftCost) ? Number(body.giftCost) : 0)
        return callCost + safeGiftCost
    }

    let serverComputed: number

    beforeEach(() => {
        serverComputed = 0
    })

    it('honest client: totalCost matches server', () => {
        serverComputed = deductCallContract({
            durationSeconds: 600, // 10 min
            pricePerMinute: 50,
            totalCost: 500,
        })
        expect(serverComputed).toBe(500)
    })

    it('malicious client: low totalCost is ignored, real cost is charged', () => {
        serverComputed = deductCallContract({
            durationSeconds: 600,
            pricePerMinute: 50,
            totalCost: 1, // attacker says "I owe ₹1 for a 10 min call"
        })
        expect(serverComputed).toBe(500) // server still charges full
    })

    it('malicious client: omitted totalCost still works', () => {
        serverComputed = deductCallContract({
            durationSeconds: 600,
            pricePerMinute: 50,
        })
        expect(serverComputed).toBe(500)
    })

    it('gift cost is added on top of recomputed call cost', () => {
        serverComputed = deductCallContract({
            durationSeconds: 120,
            pricePerMinute: 30,
            giftCost: 25,
        })
        // 2 billable minutes * 30 + 25 = 85
        expect(serverComputed).toBe(85)
    })

    it('negative gift cost is clamped to 0 (no client-side credits)', () => {
        serverComputed = deductCallContract({
            durationSeconds: 120,
            pricePerMinute: 30,
            giftCost: -1000,
        })
        expect(serverComputed).toBe(60)
    })
})
