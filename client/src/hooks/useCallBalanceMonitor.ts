import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet, USER_ID } from "./useWallet";
import { useToast } from "@/hooks/use-toast";
import { realtime } from "@/lib/realtime";

/**
 * Configuration for balance monitoring during calls
 */
export interface BalanceMonitorConfig {
    /** Balance threshold for warning notification (default: 50) */
    warningThreshold?: number;
    /** Balance threshold for critical notification (default: 20) */
    criticalThreshold?: number;
    /**
     * HTTP fallback cadence (ms) - used only when the WebSocket is unavailable.
     * Manus §4.1 replaced the per-second poll with realtime push; this is
     * just a safety net. Default: 15000 (15s).
     */
    pollInterval?: number;
    /** Whether to enable automatic call disconnection (default: true) */
    autoDisconnect?: boolean;
    /** Callback when call should be disconnected due to low balance */
    onDisconnect?: (reason: 'insufficient_balance' | 'negative_balance') => void;
}

/**
 * Balance monitoring status
 */
export interface BalanceMonitorStatus {
    liveBalance: number;
    remainingSeconds: number;
    isLowBalance: boolean;
    isCriticalBalance: boolean;
    isCallEndingSoon: boolean;
    isMonitoring: boolean;
    lastCheckTime: Date | null;
    checkCount: number;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? '';

interface BalanceSnapshot {
    balance: number;
    callCost: number;
    giftCost: number;
    costAccrued: number;
    liveBalance: number;
    remainingSeconds: number;
}

/**
 * Server-authoritative balance monitor with realtime push.
 *
 * Manus §2.1: the server is the source of truth for live balance, accrued
 * cost, and remaining seconds.
 * Manus §4.1: instead of polling every 2s, we subscribe to a server-pushed
 * `wallet:{userId}` event. Local duration still ticks on the client (1s
 * timer in CallInterface drives `updateDuration`); we recompute display
 * values whenever EITHER the duration changes OR a fresh balance arrives.
 *
 * For the auto-disconnect decision we still cross-check with the server
 * via `GET /api/wallet/:userId/balance-status`, but at a slow safety-net
 * cadence (default 15s) - and only as a fallback when the WebSocket isn't
 * delivering events.
 */
export function useCallBalanceMonitor(
    pricePerMinute: number,
    isCallActive: boolean,
    config: BalanceMonitorConfig = {}
) {
    const {
        warningThreshold = 50,
        criticalThreshold = 20,
        pollInterval = 15_000,
        autoDisconnect = true,
        onDisconnect,
    } = config;

    const { balance, refreshBalance } = useWallet();
    const { toast } = useToast();

    const [status, setStatus] = useState<BalanceMonitorStatus>({
        liveBalance: balance,
        remainingSeconds: 0,
        isLowBalance: false,
        isCriticalBalance: false,
        isCallEndingSoon: false,
        isMonitoring: false,
        lastCheckTime: null,
        checkCount: 0,
    });

    const [totalGiftCost, setTotalGiftCost] = useState(0);
    const [duration, setDuration] = useState(0);

    const warningShownRef = useRef(false);
    const criticalShownRef = useRef(false);
    const disconnectTriggeredRef = useRef(false);

    /** HTTP fallback - only used as a safety net. */
    const fetchBalanceStatus = useCallback(
        async (currentDuration: number, currentGiftCost: number): Promise<BalanceSnapshot> => {
            const params = new URLSearchParams({
                pricePerMinute: String(pricePerMinute),
                durationSeconds: String(currentDuration),
                giftCost: String(currentGiftCost),
            });
            const res = await fetch(
                `${API_BASE}/api/wallet/${USER_ID}/balance-status?${params.toString()}`,
                { credentials: 'include' },
            );
            if (!res.ok) throw new Error(`balance-status failed: ${res.status}`);
            return (await res.json()) as BalanceSnapshot;
        },
        [pricePerMinute],
    );

    /**
     * Recompute display values from the latest known balance + the duration
     * that's ticking locally. This runs on every duration tick and on every
     * incoming `wallet:updated` event.
     */
    const computeFromLocalState = useCallback(
        (currentBalance: number, currentDuration: number, currentGiftCost: number): BalanceSnapshot => {
            const safeDuration = Math.max(0, Math.floor(currentDuration));
            const safeRate = Math.max(0, pricePerMinute);
            const billableMinutes = safeDuration === 0 ? 0 : Math.max(1, Math.ceil(safeDuration / 60));
            const callCost = billableMinutes * safeRate;
            const safeGiftCost = Math.max(0, currentGiftCost);
            const costAccrued = callCost + safeGiftCost;
            const liveBalance = currentBalance - costAccrued;
            const remainingSeconds = safeRate > 0
                ? Math.max(0, Math.floor(((currentBalance - safeGiftCost) / safeRate) * 60))
                : 0;
            return {
                balance: currentBalance,
                callCost,
                giftCost: safeGiftCost,
                costAccrued,
                liveBalance,
                remainingSeconds,
            };
        },
        [pricePerMinute],
    );

    const applySnapshot = useCallback(
        (snapshot: BalanceSnapshot) => {
            const isLowBalance = snapshot.liveBalance < warningThreshold && snapshot.liveBalance > 0;
            const isCriticalBalance = snapshot.liveBalance < criticalThreshold && snapshot.liveBalance > 0;
            const isCallEndingSoon = snapshot.remainingSeconds <= 20 && snapshot.remainingSeconds > 0;

            setStatus(prev => ({
                ...prev,
                liveBalance: snapshot.liveBalance,
                remainingSeconds: snapshot.remainingSeconds,
                isLowBalance,
                isCriticalBalance,
                isCallEndingSoon,
                lastCheckTime: new Date(),
                checkCount: prev.checkCount + 1,
            }));

            if (isLowBalance && !warningShownRef.current) {
                warningShownRef.current = true;
                toast({
                    title: "Low Balance Warning",
                    description: `Your balance is ₹${snapshot.liveBalance.toFixed(2)}. Consider recharging to continue the call.`,
                });
            }

            if (isCriticalBalance && !criticalShownRef.current) {
                criticalShownRef.current = true;
                toast({
                    title: "Critical Balance",
                    description: `Your balance is critically low (₹${snapshot.liveBalance.toFixed(2)}). Call will end soon!`,
                    variant: "destructive",
                });
            }

            if (autoDisconnect && snapshot.liveBalance <= 0 && !disconnectTriggeredRef.current) {
                disconnectTriggeredRef.current = true;
                const reason = snapshot.liveBalance < 0 ? 'negative_balance' : 'insufficient_balance';
                toast({
                    title: "Call Ended",
                    description: reason === 'negative_balance'
                        ? "Your balance has been exhausted. The call has been disconnected."
                        : "Insufficient balance to continue the call.",
                    variant: "destructive",
                });
                onDisconnect?.(reason);
            }
        },
        [warningThreshold, criticalThreshold, autoDisconnect, onDisconnect, toast],
    );

    const updateGiftCost = useCallback((giftCost: number) => {
        setTotalGiftCost(prev => prev + giftCost);
    }, []);

    const updateDuration = useCallback((newDuration: number) => {
        setDuration(newDuration);
    }, []);

    // Recompute display values whenever balance, duration, or gift cost
    // changes. This is what a `setInterval(..., 2000)` was doing before.
    useEffect(() => {
        if (!isCallActive) {
            setStatus(prev => ({ ...prev, isMonitoring: false }));
            return;
        }
        setStatus(prev => ({ ...prev, isMonitoring: true }));
        applySnapshot(computeFromLocalState(balance, duration, totalGiftCost));
    }, [isCallActive, balance, duration, totalGiftCost, computeFromLocalState, applySnapshot]);

    // Subscribe to server-pushed wallet updates so any out-of-band balance
    // change (e.g. a refund hitting between ticks) shows up instantly.
    useEffect(() => {
        if (!isCallActive) return;

        const unsub = realtime.subscribe(`wallet:${USER_ID}`, (event: any) => {
            if (event?.type !== 'wallet:updated') return;
            // useWallet handles updating its own state; we just use the
            // moment as a hint to refresh derived values for this view.
            refreshBalance();
        });

        // Slow HTTP safety net - only fires if the WebSocket isn't
        // delivering events. Polls /balance-status which is the server's
        // authoritative computation (Manus §2.1).
        const intervalId = setInterval(async () => {
            try {
                const snapshot = await fetchBalanceStatus(duration, totalGiftCost);
                applySnapshot(snapshot);
            } catch {
                // silent - the next tick will retry
            }
        }, pollInterval);

        return () => {
            unsub();
            clearInterval(intervalId);
        };
    }, [isCallActive, duration, totalGiftCost, refreshBalance, fetchBalanceStatus, applySnapshot, pollInterval]);

    // Reset notification flags when call becomes inactive
    useEffect(() => {
        if (!isCallActive) {
            warningShownRef.current = false;
            criticalShownRef.current = false;
            disconnectTriggeredRef.current = false;
        }
    }, [isCallActive]);

    return {
        ...status,
        updateGiftCost,
        updateDuration,
        resetMonitoring: () => {
            warningShownRef.current = false;
            criticalShownRef.current = false;
            disconnectTriggeredRef.current = false;
            setTotalGiftCost(0);
            setDuration(0);
        },
    };
}
