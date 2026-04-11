import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, XCircle, CreditCard, Wifi, Clock } from "lucide-react";

export type PaymentErrorType =
    | "network"
    | "insufficient_funds"
    | "card_declined"
    | "timeout"
    | "generic";

interface PaymentErrorDialogProps {
    isOpen: boolean;
    errorType: PaymentErrorType;
    amount?: number;
    onRetry: () => void;
    onCancel: () => void;
    isRetrying?: boolean;
}

const ERROR_CONFIG: Record<
    PaymentErrorType,
    {
        title: string;
        description: string;
        icon: typeof AlertTriangle;
        suggestions: string[];
        showRetry: boolean;
    }
> = {
    network: {
        title: "Network Error",
        description: "Unable to connect to the payment server. Please check your internet connection.",
        icon: Wifi,
        suggestions: [
            "Check your internet connection",
            "Try switching between Wi-Fi and mobile data",
            "Wait a moment and try again",
        ],
        showRetry: true,
    },
    insufficient_funds: {
        title: "Insufficient Funds",
        description: "Your payment method doesn't have enough balance to complete this transaction.",
        icon: XCircle,
        suggestions: [
            "Check your account balance",
            "Use a different payment method",
            "Add funds to your account",
        ],
        showRetry: false,
    },
    card_declined: {
        title: "Payment Declined",
        description: "Your card was declined by the bank. Please check with your bank or try another card.",
        icon: CreditCard,
        suggestions: [
            "Verify your card details are correct",
            "Check if your card is active",
            "Contact your bank for more information",
            "Try a different payment method",
        ],
        showRetry: true,
    },
    timeout: {
        title: "Payment Timeout",
        description: "The payment request took too long to process. Please try again.",
        icon: Clock,
        suggestions: [
            "The payment might still be processing",
            "Check your transaction history before retrying",
            "Try again after a few minutes",
        ],
        showRetry: true,
    },
    generic: {
        title: "Payment Failed",
        description: "An unexpected error occurred while processing your payment.",
        icon: AlertTriangle,
        suggestions: [
            "Please try again",
            "If the problem persists, contact support",
            "Check your payment method details",
        ],
        showRetry: true,
    },
};

export function PaymentErrorDialog({
    isOpen,
    errorType,
    amount,
    onRetry,
    onCancel,
    isRetrying = false,
}: PaymentErrorDialogProps) {
    const config = ERROR_CONFIG[errorType];
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isRetrying && onCancel()}>
            <DialogContent className="sm:max-w-md" data-testid="dialog-payment-error">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <Icon className="w-6 h-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-xl">{config.title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        {config.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Suggestions */}
                    <Card className="p-4 bg-muted/50">
                        <h4 className="font-semibold text-sm mb-3">What you can do:</h4>
                        <ul className="space-y-2">
                            {config.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Transaction Amount (if provided) */}
                    {amount && (
                        <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground">Transaction Amount</p>
                            <p className="text-2xl font-bold">₹{amount}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isRetrying}
                        data-testid="button-cancel-error"
                    >
                        Cancel
                    </Button>
                    {config.showRetry && (
                        <Button
                            onClick={onRetry}
                            disabled={isRetrying}
                            data-testid="button-retry-payment"
                        >
                            {isRetrying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Retrying...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
