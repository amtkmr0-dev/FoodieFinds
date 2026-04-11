import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertTriangle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for BalanceMonitor component
 */
export interface BalanceMonitorProps {
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
    /** Total cost of the call so far */
    totalCost: number;
    /** Call cost breakdown */
    callCost: number;
    /** Gift cost breakdown */
    giftCost: number;
    /** Whether to show compact version (for mobile) */
    compact?: boolean;
}

/**
 * Format seconds to MM:SS format
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * BalanceMonitor component
 * Displays real-time balance information, warnings, and countdown timer during calls
 */
export function BalanceMonitor({
    liveBalance,
    remainingSeconds,
    isLowBalance,
    isCriticalBalance,
    isCallEndingSoon,
    totalCost,
    callCost,
    giftCost,
    compact = false,
}: BalanceMonitorProps) {
    // Determine the severity level
    const severity = isCriticalBalance || liveBalance <= 0 ? "critical" : isLowBalance ? "warning" : "normal";

    // Get color classes based on severity
    const getColorClasses = () => {
        switch (severity) {
            case "critical":
                return {
                    text: "text-destructive",
                    bg: "bg-destructive/10",
                    border: "border-destructive/30",
                    icon: "text-destructive",
                };
            case "warning":
                return {
                    text: "text-yellow-600 dark:text-yellow-400",
                    bg: "bg-yellow-500/10",
                    border: "border-yellow-500/30",
                    icon: "text-yellow-600 dark:text-yellow-400",
                };
            default:
                return {
                    text: "text-foreground",
                    bg: "bg-muted/50",
                    border: "border-border",
                    icon: "text-muted-foreground",
                };
        }
    };

    const colors = getColorClasses();

    if (compact) {
        // Compact version for mobile/small screens
        return (
            <div className={cn("flex items-center gap-2", colors.text)}>
                <Wallet className={cn("w-3 h-3 sm:w-4 sm:h-4", colors.icon)} />
                <span className="text-xs sm:text-sm font-medium">
                    ₹{liveBalance.toFixed(2)}
                </span>
                {isCallEndingSoon && (
                    <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                        {remainingSeconds}s left
                    </Badge>
                )}
            </div>
        );
    }

    // Full version with detailed information
    return (
        <div className="space-y-3">
            {/* Balance Display */}
            <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                colors.bg,
                colors.border
            )}>
                <div className="flex items-center gap-2">
                    <Wallet className={cn("w-4 h-4", colors.icon)} />
                    <div>
                        <p className="text-xs text-muted-foreground">Live Balance</p>
                        <p className={cn("text-lg font-bold", colors.text)}>
                            ₹{liveBalance.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="text-sm font-medium">₹{totalCost.toFixed(2)}</p>
                </div>
            </div>

            {/* Cost Breakdown */}
            {(callCost > 0 || giftCost > 0) && (
                <div className="text-xs text-muted-foreground space-y-1">
                    {callCost > 0 && (
                        <div className="flex justify-between">
                            <span>Call Cost:</span>
                            <span>₹{callCost.toFixed(2)}</span>
                        </div>
                    )}
                    {giftCost > 0 && (
                        <div className="flex justify-between">
                            <span>Gifts Sent:</span>
                            <span>₹{giftCost.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Countdown Timer */}
            {remainingSeconds > 0 && (
                <div className={cn(
                    "flex items-center gap-2 p-2 rounded-md",
                    isCallEndingSoon ? "bg-destructive/10" : "bg-muted/50"
                )}>
                    <Clock className={cn(
                        "w-4 h-4",
                        isCallEndingSoon ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Remaining Time</p>
                        <p className={cn(
                            "text-sm font-medium",
                            isCallEndingSoon ? "text-destructive" : "text-foreground"
                        )}>
                            {formatTime(remainingSeconds)}
                        </p>
                    </div>
                </div>
            )}

            {/* Warning Alerts */}
            {isCriticalBalance && liveBalance > 0 && (
                <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Critical Balance</AlertTitle>
                    <AlertDescription className="text-xs">
                        Your balance is critically low (₹{liveBalance.toFixed(2)}). Call will end soon!
                    </AlertDescription>
                </Alert>
            )}

            {isLowBalance && !isCriticalBalance && (
                <Alert className={cn("py-2", colors.bg, colors.border)}>
                    <AlertTriangle className={cn("h-4 w-4", colors.icon)} />
                    <AlertTitle className={cn("text-xs font-semibold", colors.text)}>Low Balance</AlertTitle>
                    <AlertDescription className={cn("text-xs", colors.text)}>
                        Your balance is ₹{liveBalance.toFixed(2)}. Consider recharging to continue.
                    </AlertDescription>
                </Alert>
            )}

            {isCallEndingSoon && (
                <Alert variant="destructive" className="py-2 animate-pulse">
                    <Clock className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Call Ending Soon</AlertTitle>
                    <AlertDescription className="text-xs">
                        Call will end in {remainingSeconds} seconds due to low balance.
                    </AlertDescription>
                </Alert>
            )}

            {/* Insufficient Balance Alert */}
            {liveBalance <= 0 && (
                <Alert variant="destructive" className="py-2">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Insufficient Balance</AlertTitle>
                    <AlertDescription className="text-xs">
                        Your balance has been exhausted. Please recharge to make calls.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
