import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    IndianRupee,
    CheckCircle2,
    Download,
    Share2,
    Receipt,
    Calendar,
    CreditCard,
    Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export interface PaymentReceiptData {
    transactionId: string;
    amount: number;
    bonus?: number;
    total: number;
    paymentMethod: string;
    date: string;
    status: "success" | "pending" | "failed";
}

interface PaymentReceiptProps {
    receipt: PaymentReceiptData;
    onDownload?: () => void;
    onShare?: () => void;
    onClose?: () => void;
}

export function PaymentReceipt({
    receipt,
    onDownload,
    onShare,
    onClose,
}: PaymentReceiptProps) {
    const handleCopyTransactionId = () => {
        // BUG-038 FIX: Add fallback for clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(receipt.transactionId)
                .catch(() => {
                    // Fallback to execCommand if clipboard API fails
                    fallbackCopyToClipboard(receipt.transactionId);
                });
        } else {
            // Fallback for older browsers
            fallbackCopyToClipboard(receipt.transactionId);
        }
    };

    const fallbackCopyToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    };

    // BUG-047 FIX: Use theme color variables from config
    const statusColors = {
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    const statusIcons = {
        success: <CheckCircle2 className="w-5 h-5" />,
        pending: <Receipt className="w-5 h-5" />,
        failed: <Receipt className="w-5 h-5" />,
    };

    return (
        <Card className="p-6 space-y-6" data-testid="payment-receipt">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${receipt.status === "success" ? "bg-green-100 dark:bg-green-900" : "bg-muted"
                    }`}>
                    {statusIcons[receipt.status]}
                </div>
                <h2 className="text-2xl font-bold">
                    {receipt.status === "success" ? "Payment Successful!" :
                        receipt.status === "pending" ? "Payment Processing" : "Payment Failed"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {receipt.status === "success"
                        ? "Your wallet has been credited successfully"
                        : receipt.status === "pending"
                            ? "Your payment is being processed"
                            : "Payment could not be completed"}
                </p>
            </div>

            {/* Amount Display */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Amount Credited</p>
                    <div className="flex items-center justify-center gap-1 text-4xl font-bold text-primary">
                        <IndianRupee className="w-8 h-8" />
                        {receipt.total}
                    </div>
                    {receipt.bonus && receipt.bonus > 0 && (
                        <Badge variant="secondary" className="mt-2">
                            +{formatCurrency(receipt.bonus)} bonus included
                        </Badge>
                    )}
                </div>
            </Card>

            {/* Transaction Details */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Transaction Details
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Receipt className="w-4 h-4" />
                            Transaction ID
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{receipt.transactionId}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCopyTransactionId}
                                data-testid="button-copy-transaction-id"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Date & Time
                        </div>
                        <span className="text-sm font-medium">{receipt.date}</span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="w-4 h-4" />
                            Payment Method
                        </div>
                        <span className="text-sm font-medium">{receipt.paymentMethod}</span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            Status
                        </div>
                        <Badge className={statusColors[receipt.status]}>
                            {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            {receipt.bonus && receipt.bonus > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Payment Breakdown
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Amount Paid</span>
                                <span className="font-medium">{formatCurrency(receipt.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Bonus Received</span>
                                <span className="font-medium text-success">+{formatCurrency(receipt.bonus)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t">
                                <span>Total Credited</span>
                                <span className="text-primary">{formatCurrency(receipt.total)}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                {onDownload && (
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onDownload}
                        data-testid="button-download-receipt"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                )}
                {onShare && (
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onShare}
                        data-testid="button-share-receipt"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                )}
                {onClose && (
                    <Button
                        className="flex-1"
                        onClick={onClose}
                        data-testid="button-close-receipt"
                    >
                        Done
                    </Button>
                )}
            </div>
        </Card>
    );
}
