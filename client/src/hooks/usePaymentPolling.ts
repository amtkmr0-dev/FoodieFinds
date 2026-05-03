import { useCallback, useEffect, useRef, useState } from "react";
import { realtime } from "@/lib/realtime";

/**
 * Wait for a payment to leave the `pending` state.
 *
 * Manus review §4.1: this used to be a 3-second polling loop hitting
 * `GET /api/payments/:id/status`. We now subscribe to a server-pushed
 * `payment:{transactionId}` event and only fall back to HTTP polling at a
 * very low cadence (every 30s) as a safety net for environments where
 * the WebSocket can't connect (corporate proxies, etc.).
 *
 * The hook keeps its old name to avoid breaking the two pages that use it.
 *
 * Behavior:
 *   - On `start(transactionId)`, subscribes to the realtime channel.
 *   - Resolves with the payment's terminal status the moment the server
 *     publishes it.
 *   - If no event arrives within `timeoutMs`, resolves with `{ status: "timeout" }`.
 *   - Falls back to a slow HTTP probe every `httpFallbackMs` so we still
 *     catch the success even on a degraded link.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "";

export type PaymentStatus = "pending" | "success" | "failed" | "cancelled" | "refunded";

export interface PaymentStatusResult {
    status: PaymentStatus | "timeout";
    transactionId: string;
    amount?: number;
    bonus?: number;
    totalAmount?: number;
    error?: string;
    raw?: unknown;
}

export interface UsePaymentPollingOptions {
    /** Total wait before giving up. Default: 5 minutes. */
    timeoutMs?: number;
    /** HTTP fallback cadence used only when the WebSocket is unavailable.
     *  Default: 30s. */
    httpFallbackMs?: number;
}

export function usePaymentPolling(opts: UsePaymentPollingOptions = {}) {
    const { timeoutMs = 5 * 60 * 1000, httpFallbackMs = 30_000 } = opts;

    const [isPolling, setIsPolling] = useState(false);
    const [transactionId, setTransactionId] = useState<string | null>(null);

    const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unsubRef = useRef<(() => void) | null>(null);
    const resolveRef = useRef<((r: PaymentStatusResult) => void) | null>(null);

    const cleanup = useCallback(() => {
        if (fallbackRef.current) {
            clearInterval(fallbackRef.current);
            fallbackRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
        }
        setIsPolling(false);
        setTransactionId(null);
    }, []);

    const start = useCallback(
        (txnId: string): Promise<PaymentStatusResult> => {
            cleanup();
            setTransactionId(txnId);
            setIsPolling(true);

            return new Promise<PaymentStatusResult>((resolve) => {
                resolveRef.current = resolve;

                const finish = (result: PaymentStatusResult) => {
                    cleanup();
                    resolveRef.current = null;
                    resolve(result);
                };

                const handleStatusPayload = (data: any) => {
                    const status = (data?.status ?? "pending") as PaymentStatus;
                    if (status === "pending") return;
                    finish({
                        status,
                        transactionId: txnId,
                        amount: data?.amount ?? data?.metadata?.originalAmount,
                        bonus: data?.metadata?.bonusAmount ?? data?.bonus,
                        totalAmount: data?.totalAmount,
                        error: data?.error?.message ?? data?.error,
                        raw: data,
                    });
                };

                // Realtime path - the server pushes when status changes.
                unsubRef.current = realtime.subscribe(`payment:${txnId}`, (event: any) => {
                    if (event?.type === 'payment:status') handleStatusPayload(event);
                });

                // Slow HTTP fallback in case the WebSocket can't connect or
                // missed the event because we subscribed late.
                const probe = async () => {
                    try {
                        const res = await fetch(
                            `${API_BASE}/api/payments/${encodeURIComponent(txnId)}/status`,
                            { credentials: "include" },
                        );
                        if (!res.ok) return;
                        const data: any = await res.json();
                        handleStatusPayload(data);
                    } catch {
                        // ignore - keep waiting for the event
                    }
                };

                // Probe once now (covers the race where status flipped
                // between server-side publish and our subscribe), then
                // again every httpFallbackMs.
                void probe();
                fallbackRef.current = setInterval(probe, httpFallbackMs);

                timeoutRef.current = setTimeout(() => {
                    finish({ status: "timeout", transactionId: txnId });
                }, timeoutMs);
            });
        },
        [cleanup, httpFallbackMs, timeoutMs],
    );

    const cancel = useCallback(() => {
        if (resolveRef.current) {
            resolveRef.current({
                status: "cancelled",
                transactionId: transactionId ?? "",
            });
            resolveRef.current = null;
        }
        cleanup();
    }, [cleanup, transactionId]);

    useEffect(() => cleanup, [cleanup]);

    return { isPolling, transactionId, start, cancel };
}
