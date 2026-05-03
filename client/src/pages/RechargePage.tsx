import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Wallet, CreditCard, Smartphone, Building2, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS_CONFIG } from "@/lib/payment-methods";
import { PaymentConfirmationDialog } from "@/components/PaymentConfirmationDialog";
import { PaymentErrorDialog, PaymentErrorType } from "@/components/PaymentErrorDialog";
import { PaymentReceipt, PaymentReceiptData } from "@/components/PaymentReceipt";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QUICK_RECHARGE_AMOUNTS } from "@/lib/config";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { useRequireAuth } from "@/hooks/useRequireAuth";

// Payment request deduplication - track active payment requests
const activePaymentRequests = new Map<string, boolean>();

// BUG-023 FIX: Retry configuration with exponential backoff
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Calculate delay with exponential backoff
const calculateRetryDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

// Inner component holds all the existing hooks. The default export below
// wraps it with `useRequireAuth` so unauthenticated visitors redirect to
// /signup BEFORE any hooks here mount and fire 401-bound API calls.
function RechargePageContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { balance, recharge } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<PaymentErrorType>("generic");
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  // Manus §2.1: real server polling instead of the previous stub that
  // returned success after 5 ticks regardless of actual status.
  const paymentPolling = usePaymentPolling({ intervalMs: 3000, timeoutMs: 5 * 60 * 1000 });
  const isPolling = paymentPolling.isPolling;
  const requestIdRef = useRef<string | null>(null);

  // BUG-023 FIX: Retry state
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
  };

  const paymentMethods = PAYMENT_METHODS_CONFIG.map((method) => ({
    ...method,
    icon: method.id === "upi" ? Smartphone : method.id === "card" ? CreditCard : Building2,
  }));

  const handleSelectMethod = useCallback((methodId: string) => {
    if (!selectedAmount || isProcessing) return;

    // Prevent multiple simultaneous payment requests
    const requestId = `recharge_${selectedAmount}_${methodId}_${Date.now()}`;
    if (activePaymentRequests.has(requestId)) {
      toast({
        title: "Payment in Progress",
        description: "Please wait for the current payment to complete.",
        variant: "destructive",
      });
      return;
    }

    requestIdRef.current = requestId;
    setSelectedMethod(methodId);
    setShowConfirmation(true);
  }, [selectedAmount, isProcessing, toast]);

  // BUG-023 FIX: Retry function with exponential backoff
  const retryPayment = useCallback(async (attempt: number = 1): Promise<any> => {
    if (attempt > DEFAULT_RETRY_CONFIG.maxRetries) {
      throw new Error(`Payment failed after ${DEFAULT_RETRY_CONFIG.maxRetries} attempts`);
    }

    try {
      const result = await recharge(selectedAmount!, selectedMethod!);
      return result;
    } catch (error: any) {
      const errorMessage = error.message?.toLowerCase() || "";

      // Only retry on network or timeout errors
      const isRetryableError = errorMessage.includes("network") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("timeout");

      if (!isRetryableError) {
        throw error; // Don't retry non-retryable errors
      }

      if (attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const delay = calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG);

        toast({
          title: "Retrying Payment",
          description: `Network issue detected. Retrying in ${delay / 1000} seconds... (Attempt ${attempt}/${DEFAULT_RETRY_CONFIG.maxRetries})`,
          variant: "default",
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return retryPayment(attempt + 1);
      }

      throw error;
    }
  }, [selectedAmount, selectedMethod, recharge, toast]);

  const handleConfirmPayment = async () => {
    if (!selectedAmount || !selectedMethod || !requestIdRef.current) return;

    // Mark this request as active
    activePaymentRequests.set(requestIdRef.current, true);

    setShowConfirmation(false);
    setIsProcessing(true);
    setRetryCount(0);
    setIsRetrying(false);

    try {
      // BUG-023 FIX: Use retry mechanism with exponential backoff
      const result = await retryPayment(1);

      // Handle different payment statuses
      if (result.status === 'pending') {
        const transactionId = result.transaction?.transactionId || result.transactionId;
        if (!transactionId) {
          throw new Error('Server returned pending status without a transactionId');
        }
        toast({
          title: "Payment Processing",
          description: "Your payment is being processed. Please wait...",
        });

        const final = await paymentPolling.start(transactionId);

        if (final.status === 'success') {
          finalizeSuccessfulPayment({
            transactionId: final.transactionId,
            amount: selectedAmount,
            total: final.totalAmount ?? selectedAmount,
            bonus: final.bonus,
            method: selectedMethod,
          });
          return;
        }
        if (final.status === 'timeout') {
          toast({
            title: "Payment Timeout",
            description: "Your payment is taking longer than expected. Check your transaction history.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(final.error || `Payment ${final.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Synchronous success: server already confirmed.
      const fee = result.fee || 0;
      finalizeSuccessfulPayment({
        transactionId: result.transaction?.transactionId,
        amount: selectedAmount,
        total: result.totalAmount ?? selectedAmount + fee,
        bonus: result.bonus,
        method: selectedMethod,
      });
    } catch (error: any) {
      // Determine error type based on error message
      let errorType: PaymentErrorType = "generic";
      const errorMessage = error.message?.toLowerCase() || "";

      if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        errorType = "network";
      } else if (errorMessage.includes("timeout")) {
        errorType = "timeout";
      } else if (errorMessage.includes("declined") || errorMessage.includes("card")) {
        errorType = "card_declined";
      } else if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
        errorType = "insufficient_funds";
      }

      setErrorType(errorType);
      setShowError(true);
    } finally {
      setIsProcessing(false);
      setIsRetrying(false);
      // Clear the active request
      if (requestIdRef.current) {
        activePaymentRequests.delete(requestIdRef.current);
        requestIdRef.current = null;
      }
    }
  };

  /**
   * Build the receipt + show success toast once the SERVER has confirmed
   * the payment. Manus §2.1: never derive success client-side.
   */
  const finalizeSuccessfulPayment = (args: {
    transactionId?: string;
    amount: number;
    total: number;
    bonus?: number;
    method: string;
  }) => {
    const receipt: PaymentReceiptData = {
      transactionId: args.transactionId ?? `TXN${Date.now()}`,
      amount: args.amount,
      total: args.total,
      bonus: args.bonus,
      paymentMethod: paymentMethods.find(m => m.id === args.method)?.name || "Unknown",
      date: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      status: "success",
    };

    setReceiptData(receipt);
    setShowReceipt(true);

    const message = args.bonus && args.bonus > 0
      ? `${formatCurrency(args.amount)} + ${formatCurrency(args.bonus)} bonus has been added to your wallet.`
      : `${formatCurrency(args.amount)} has been added to your wallet.`;

    toast({ title: "Payment Successful!", description: message });

    if (requestIdRef.current) {
      activePaymentRequests.delete(requestIdRef.current);
      requestIdRef.current = null;
    }
  };

  // BUG-023 FIX: Enhanced retry handler with retry count tracking
  const handleRetryPayment = () => {
    setRetryCount(prev => prev + 1);
    setIsRetrying(true);
    setShowError(false);
    setShowConfirmation(true);
  };

  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    const receiptText = `
Payment Receipt
===============
Transaction ID: ${receiptData.transactionId}
Date: ${receiptData.date}
Amount: ${formatCurrency(receiptData.amount)}
Payment Method: ${receiptData.paymentMethod}
Status: ${receiptData.status}
    `.trim();

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Your receipt has been saved to your device.",
    });
  };

  const handleShareReceipt = async () => {
    if (!receiptData) return;
    const shareText = `Payment of ${formatCurrency(receiptData.amount)} successful! Transaction ID: ${receiptData.transactionId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Receipt",
          text: shareText,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Receipt details copied to clipboard.",
      });
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptData(null);
    setSelectedAmount(null);
    setSelectedMethod(null);
    setLocation("/user");
  };

  // BUG-036 FIX: Use configuration constant for quick recharge amounts
  const quickAmounts = QUICK_RECHARGE_AMOUNTS;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/user")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Recharge</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Current Balance</span>
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="text-4xl font-bold mb-2">{formatCurrency(balance)}</div>
          <Badge variant={balance < 135 ? "destructive" : "secondary"}>
            {balance < 135 ? "Low Balance - Minimum ₹135 needed" : "Sufficient for calls"}
          </Badge>
        </Card>

        {!selectedAmount ? (
          <div>
            <h3 className="font-semibold mb-3">Select Recharge Pack</h3>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={() => handleSelectAmount(amount)}
                  data-testid={`button-recharge-${amount}`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-semibold">{formatCurrency(amount, false)}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Recharge Amount</p>
                <div className="text-4xl font-bold text-primary">{formatCurrency(selectedAmount, false)}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedAmount(null)}
                  data-testid="button-change-amount"
                >
                  Change Amount
                </Button>
              </div>
            </Card>

            <div>
              <h3 className="font-semibold mb-3">Select Payment Method</h3>
              <div className="space-y-3">
                {paymentMethods.map((method: any) => (
                  <Card
                    key={method.id}
                    className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${isProcessing || isPolling ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    onClick={() => !isProcessing && !isPolling && handleSelectMethod(method.id)}
                    data-testid={`card-payment-${method.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${method.color}`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`text-payment-name-${method.id}`}>
                          {method.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                      {(isProcessing || isPolling) && selectedMethod === method.id && (
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showConfirmation}
        amount={selectedAmount || 0}
        paymentMethod={paymentMethods.find((m: any) => m.id === selectedMethod) || paymentMethods[0]}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowConfirmation(false)}
        isProcessing={isProcessing || isPolling}
      />

      {/* Payment Error Dialog */}
      <PaymentErrorDialog
        isOpen={showError}
        errorType={errorType}
        amount={selectedAmount || undefined}
        onRetry={handleRetryPayment}
        onCancel={() => setShowError(false)}
        isRetrying={isProcessing || isPolling}
      />

      {/* Payment Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={handleCloseReceipt}>
        <DialogContent className="sm:max-w-md p-0">
          {receiptData && (
            <PaymentReceipt
              receipt={receiptData}
              onDownload={handleDownloadReceipt}
              onShare={handleShareReceipt}
              onClose={handleCloseReceipt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RechargePage() {
  const user = useRequireAuth();
  if (!user) return null;
  return <RechargePageContent />;
}
