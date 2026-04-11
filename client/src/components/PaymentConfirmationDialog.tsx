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
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, Shield, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { calculatePaymentFee } from "@/lib/config";
import { useEffect, useRef } from "react";

interface PaymentConfirmationDialogProps {
    isOpen: boolean;
    amount: number;
    paymentMethod: {
        id: string;
        name: string;
        description: string;
        processingTime?: string;
        fees?: string;
    };
    bonus?: number;
    onConfirm: () => void;
    onCancel: () => void;
    isProcessing?: boolean;
}

export function PaymentConfirmationDialog({
    isOpen,
    amount,
    paymentMethod,
    bonus = 0,
    onConfirm,
    onCancel,
    isProcessing = false,
}: PaymentConfirmationDialogProps) {
    // BUG-037 FIX: Add fee calculation to total
    const fee = calculatePaymentFee(amount, paymentMethod.id);
    const totalAmount = amount + bonus + fee;

    // BUG-041 FIX: Implement focus trapping for accessibility
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && dialogRef.current) {
            // Focus the confirm button when dialog opens
            confirmButtonRef.current?.focus();

            // Handle Tab key to trap focus within dialog
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                const focusableElements = dialogRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ) as NodeListOf<HTMLElement>;

                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            // Handle Escape key to close dialog
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !isProcessing) {
                    e.preventDefault();
                    onCancel();
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keydown', handleEscape);

            // Prevent body scroll when dialog is open
            document.body.style.overflow = 'hidden';

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                document.removeEventListener('keydown', handleEscape);
                document.body.style.overflow = '';
            };
        }
    }, [isOpen, isProcessing, onCancel]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onCancel()}>
            <DialogContent
                ref={dialogRef}
                className="sm:max-w-md"
                data-testid="dialog-payment-confirmation"
                onPointerDownOutside={(e) => {
                    if (isProcessing) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isProcessing) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Confirm Payment
                    </DialogTitle>
                    <DialogDescription>
                        Please review your payment details before proceeding
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Payment Summary Card */}
                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Payment Amount</span>
                                <div className="flex items-center gap-1 font-bold text-lg">
                                    <IndianRupee className="w-4 h-4" />
                                    {amount}
                                </div>
                            </div>

                            {bonus > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Bonus</span>
                                    <div className="flex items-center gap-1 text-success font-semibold">
                                        <IndianRupee className="w-3 h-3" />
                                        {bonus}
                                    </div>
                                </div>
                            )}

                            {fee > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Processing Fee</span>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <IndianRupee className="w-3 h-3" />
                                        {fee.toFixed(2)}
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Total You'll Receive</span>
                                    <div className="flex items-center gap-1 font-bold text-xl text-primary">
                                        <IndianRupee className="w-5 h-5" />
                                        {totalAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Method Details */}
                    <Card className="p-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Payment Method</span>
                                <span className="font-semibold">{paymentMethod.name}</span>
                            </div>

                            {paymentMethod.processingTime && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Processing Time
                                    </span>
                                    <span className="text-sm">{paymentMethod.processingTime}</span>
                                </div>
                            )}

                            {paymentMethod.fees && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Fees</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {paymentMethod.fees}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Security Notice */}
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            Your payment is secured with industry-standard encryption.
                            You will receive a confirmation once the payment is processed.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2 mt-6">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        onClick={onCancel}
                        disabled={isProcessing}
                        data-testid="button-cancel-payment"
                    >
                        Cancel
                    </Button>
                    <Button
                        ref={confirmButtonRef}
                        onClick={onConfirm}
                        disabled={isProcessing}
                        data-testid="button-confirm-payment"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            `Pay ${formatCurrency(amount)}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
