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

    const [duration, setDuration] = useState(0);

    // Track which notifications have been shown to avoid duplicates
    const warningShownRef = useRef(false);
    const criticalShownRef = useRef(false);
    const disconnectTriggeredRef = useRef(false);
    const onDisconnectRef = useRef(onDisconnect);

    useEffect(() => {
        onDisconnectRef.current = onDisconnect;
    }, [onDisconnect]);

    // Calculate live balance and remaining time
    const calculateStatus = useCallback((currentBalance: number, currentDuration: number) => {
        const billableMinutes = Math.ceil(currentDuration / 60);
        const callCost = billableMinutes * pricePerMinute;
        const liveBalance = currentBalance - callCost;
        const remainingSeconds = Math.max(0, Math.floor((liveBalance / pricePerMinute) * 60));
        const canAffordNextMinute = liveBalance >= pricePerMinute;
        const isBelowOneMinuteCredit = liveBalance > 0 && !canAffordNextMinute;
        const isOneMinuteOrLessRemaining = liveBalance <= pricePerMinute && liveBalance > 0;

        return {
            liveBalance,
            remainingSeconds,
            isLowBalance: (liveBalance < warningThreshold || isOneMinuteOrLessRemaining) && liveBalance > 0,
            isCriticalBalance: (liveBalance < criticalThreshold || isBelowOneMinuteCredit) && liveBalance > 0,
            isCallEndingSoon: (remainingSeconds <= 20 || isBelowOneMinuteCredit) && remainingSeconds > 0,
            shouldDisconnect: liveBalance <= 0 || isBelowOneMinuteCredit,
        };
    }, [pricePerMinute, warningThreshold, criticalThreshold]);

    const evaluateBalanceRules = useCallback((newStatus: ReturnType<typeof calculateStatus>) => {
        // Show warning notification (only once)
        if (newStatus.isLowBalance && !warningShownRef.current) {
            warningShownRef.current = true;
            toast({
                title: "Low Balance Warning",
                description: newStatus.liveBalance <= pricePerMinute
                    ? `Only ₹${newStatus.liveBalance.toFixed(2)} is available. Recharge now to continue beyond this minute.`
                    : `Your balance is ₹${newStatus.liveBalance.toFixed(2)}. Consider recharging to continue the call.`,
                variant: "default",
            });
        }

        // Show critical notification (only once)
        if (newStatus.isCriticalBalance && !criticalShownRef.current) {
            criticalShownRef.current = true;
            toast({
                title: "Critical Balance",
                description: newStatus.liveBalance < pricePerMinute && newStatus.liveBalance > 0
                    ? `Your balance is below the ₹${pricePerMinute}/min call charge. The call will be disconnected.`
                    : `Your balance is critically low (₹${newStatus.liveBalance.toFixed(2)}). Call will end soon!`,
                variant: "destructive",
            });
        }

        // Auto-disconnect before the next minute can create negative balance
        if (autoDisconnect && newStatus.shouldDisconnect && !disconnectTriggeredRef.current) {
            disconnectTriggeredRef.current = true;
            const reason = newStatus.liveBalance < 0 ? 'negative_balance' : 'insufficient_balance';

            toast({
                title: "Call Ended",
                description: newStatus.liveBalance > 0 && newStatus.liveBalance < pricePerMinute
                    ? `Balance is below one minute charge of ₹${pricePerMinute}. Please recharge to continue calling.`
                    : "Insufficient balance to continue the call.",
                variant: "destructive",
            });

            onDisconnectRef.current?.(reason);
        }
    }, [autoDisconnect, pricePerMinute, toast]);

    // Update gift cost (called when gifts are sent during call)
    const updateGiftCost = useCallback((_giftCost: number) => {
        // Gifts are debited immediately by the gift API. Do not subtract them
        // again from the live call balance or the call can end early/negative.
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
        const initialStatus = calculateStatus(balance, duration);
        evaluateBalanceRules(initialStatus);
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
                    const newStatus = calculateStatus(balance, duration);
                    const updatedStatus = {
                        ...prev,
                        ...newStatus,
                        lastCheckTime: new Date(),
                        checkCount: prev.checkCount + 1,
                    };

                    evaluateBalanceRules(newStatus);

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
    }, [isCallActive, balance, duration, pricePerMinute, pollInterval, refreshBalance, calculateStatus, evaluateBalanceRules]);

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
            setDuration(0);
        },
    };
}
