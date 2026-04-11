import { useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "./useWallet";
import { useToast } from "@/hooks/use-toast";

/**
 * Configuration for balance monitoring during calls
 */
export interface BalanceMonitorConfig {
    /** Balance threshold for warning notification (default: 50) */
    warningThreshold?: number;
    /** Balance threshold for critical notification (default: 20) */
    criticalThreshold?: number;
    /** Polling interval in milliseconds (default: 2000) */
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
    /** Current live balance (balance - call cost) */
    liveBalance: number;
    /** Remaining call time in seconds */
    remainingSeconds: number;
    /** Whether balance is below warning threshold */
    isLowBalance: boolean;
    /** Whether balance is below critical threshold */
    isCriticalBalance: boolean;
    /** Whether call is about to end (less than 20 seconds) */
    isCallEndingSoon: boolean;
    /** Whether balance monitoring is active */
    isMonitoring: boolean;
    /** Last balance check timestamp */
    lastCheckTime: Date | null;
    /** Number of balance checks performed */
    checkCount: number;
}

/**
 * Hook for monitoring wallet balance during calls
 * Provides real-time balance updates, notifications, and automatic call disconnection
 */
export function useCallBalanceMonitor(
    pricePerMinute: number,
    isCallActive: boolean,
    config: BalanceMonitorConfig = {}
) {
    const {
        warningThreshold = 50,
        criticalThreshold = 20,
        pollInterval = 2000,
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

    // Track which notifications have been shown to avoid duplicates
    const warningShownRef = useRef(false);
    const criticalShownRef = useRef(false);
    const disconnectTriggeredRef = useRef(false);

    // Calculate live balance and remaining time
    const calculateStatus = useCallback((currentBalance: number, currentDuration: number, giftCost: number) => {
        const billableMinutes = Math.ceil(currentDuration / 60);
        const callCost = billableMinutes * pricePerMinute;
        const totalCost = callCost + giftCost;
        const liveBalance = currentBalance - totalCost;
        const remainingSeconds = Math.floor(((currentBalance - giftCost) / pricePerMinute) * 60);

        return {
            liveBalance,
            remainingSeconds,
            isLowBalance: liveBalance < warningThreshold && liveBalance > 0,
            isCriticalBalance: liveBalance < criticalThreshold && liveBalance > 0,
            isCallEndingSoon: remainingSeconds <= 20 && remainingSeconds > 0,
        };
    }, [pricePerMinute, warningThreshold, criticalThreshold]);

    // Update gift cost (called when gifts are sent during call)
    const updateGiftCost = useCallback((giftCost: number) => {
        setTotalGiftCost(prev => prev + giftCost);
    }, []);

    // Update call duration
    const updateDuration = useCallback((newDuration: number) => {
        setDuration(newDuration);
    }, []);

    // Main balance monitoring effect
    useEffect(() => {
        if (!isCallActive) {
            setStatus(prev => ({ ...prev, isMonitoring: false }));
            return;
        }

        setStatus(prev => ({ ...prev, isMonitoring: true }));

        // Initial calculation
        const initialStatus = calculateStatus(balance, duration, totalGiftCost);
        setStatus(prev => ({
            ...prev,
            ...initialStatus,
            lastCheckTime: new Date(),
            checkCount: prev.checkCount + 1,
        }));

        // Set up polling interval
        const intervalId = setInterval(async () => {
            try {
                // Refresh balance from server
                await refreshBalance();

                setStatus(prev => {
                    const newStatus = calculateStatus(balance, duration, totalGiftCost);
                    const updatedStatus = {
                        ...prev,
                        ...newStatus,
                        lastCheckTime: new Date(),
                        checkCount: prev.checkCount + 1,
                    };

                    // Show warning notification (only once)
                    if (newStatus.isLowBalance && !warningShownRef.current) {
                        warningShownRef.current = true;
                        toast({
                            title: "Low Balance Warning",
                            description: `Your balance is ₹${newStatus.liveBalance.toFixed(2)}. Consider recharging to continue the call.`,
                            variant: "default",
                        });
                    }

                    // Show critical notification (only once)
                    if (newStatus.isCriticalBalance && !criticalShownRef.current) {
                        criticalShownRef.current = true;
                        toast({
                            title: "Critical Balance",
                            description: `Your balance is critically low (₹${newStatus.liveBalance.toFixed(2)}). Call will end soon!`,
                            variant: "destructive",
                        });
                    }

                    // Auto-disconnect when balance is zero or negative
                    if (autoDisconnect && newStatus.liveBalance <= 0 && !disconnectTriggeredRef.current) {
                        disconnectTriggeredRef.current = true;
                        const reason = newStatus.liveBalance < 0 ? 'negative_balance' : 'insufficient_balance';

                        toast({
                            title: "Call Ended",
                            description: reason === 'negative_balance'
                                ? "Your balance has been exhausted. The call has been disconnected."
                                : "Insufficient balance to continue the call.",
                            variant: "destructive",
                        });

                        if (onDisconnect) {
                            onDisconnect(reason);
                        }
                    }

                    return updatedStatus;
                });
            } catch (error) {
                console.error("Error monitoring balance:", error);
                // Continue monitoring even if there's an error
            }
        }, pollInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [isCallActive, balance, duration, totalGiftCost, pricePerMinute, pollInterval, autoDisconnect, onDisconnect, toast, refreshBalance, calculateStatus]);

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
