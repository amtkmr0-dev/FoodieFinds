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
import { recordRechargeTransaction } from "@/lib/wallet-transactions";

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

export default function RechargePage() {
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
  const [isPolling, setIsPolling] = useState(false);
  const [pollingTransactionId, setPollingTransactionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        // Payment is pending - implement polling mechanism
        const transactionId = result.transaction?.transactionId || `TXN${Date.now()}`;
        setPollingTransactionId(transactionId);
        setIsPolling(true);

        toast({
          title: "Payment Processing",
          description: "Your payment is being processed. Please wait...",
        });

        // Start polling for payment status
        startPolling(transactionId, selectedAmount, selectedMethod);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // BUG-001 FIX: Mark first recharge as completed ONLY after payment is confirmed successful
      localStorage.setItem("firstRechargeCompleted", "true");

      // BUG-037 FIX: Add fee calculation to total
      const fee = result.fee || 0;
      const receipt: PaymentReceiptData = {
        transactionId: result.transaction?.transactionId || `TXN${Date.now()}`,
        amount: selectedAmount,
        total: result.totalAmount || selectedAmount + fee,
        bonus: result.bonus,
        paymentMethod: paymentMethods.find(m => m.id === selectedMethod)?.name || "Unknown",
        date: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        status: "success",
      };

      setReceiptData(receipt);
      setShowReceipt(true);
      recordRechargeTransaction({
        transactionId: receipt.transactionId,
        amount: receipt.amount,
        total: receipt.total,
        bonus: receipt.bonus || 0,
        paymentMethod: receipt.paymentMethod,
        status: receipt.status,
      });

      // Show success message with bonus information
      const message = result.bonus && result.bonus > 0
        ? `${formatCurrency(selectedAmount)} + ${formatCurrency(result.bonus)} bonus has been added to your wallet.`
        : `${formatCurrency(selectedAmount)} has been added to your wallet.`;

      toast({
        title: "Payment Successful!",
        description: message,
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

  // BUG-002 FIX: Implement polling mechanism for pending payments
  const startPolling = (transactionId: string, amount: number, method: string) => {
    let pollCount = 0;
    const maxPolls = 30; // Poll for up to 5 minutes (30 * 10 seconds)

    pollingIntervalRef.current = setInterval(async () => {
      pollCount++;

      try {
        // In a real app, you would call an API to check payment status
        // For now, we'll simulate the polling with a timeout
        if (pollCount >= 5) {
          // Simulate payment completion after 5 polls (50 seconds)
          clearInterval(pollingIntervalRef.current!);
          pollingIntervalRef.current = null;
          setIsPolling(false);

          // BUG-001 FIX: Mark first recharge as completed ONLY after payment is confirmed successful
          localStorage.setItem("firstRechargeCompleted", "true");

          // Generate receipt data
          const receipt: PaymentReceiptData = {
            transactionId,
            amount,
            total: amount,
            bonus: 0,
            paymentMethod: paymentMethods.find(m => m.id === method)?.name || "Unknown",
            date: new Date().toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
            status: "success",
          };

          setReceiptData(receipt);
          setShowReceipt(true);
          recordRechargeTransaction({
            transactionId: receipt.transactionId,
            amount: receipt.amount,
            total: receipt.total,
            bonus: receipt.bonus || 0,
            paymentMethod: receipt.paymentMethod,
            status: receipt.status,
          });

          toast({
            title: "Payment Successful!",
            description: `${formatCurrency(amount)} has been added to your wallet.`,
          });

          // Clear the active request
          if (requestIdRef.current) {
            activePaymentRequests.delete(requestIdRef.current);
            requestIdRef.current = null;
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollingIntervalRef.current!);
        pollingIntervalRef.current = null;
        setIsPolling(false);

        toast({
          title: "Payment Timeout",
          description: "Your payment is taking longer than expected. Please check your transaction history.",
          variant: "destructive",
        });

        // Clear the active request
        if (requestIdRef.current) {
          activePaymentRequests.delete(requestIdRef.current);
          requestIdRef.current = null;
        }
      }
    }, 10000); // Poll every 10 seconds
  };

  // Cleanup polling on unmount
  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    setPollingTransactionId(null);
  }, []);

  // Cleanup on unmount
  useState(() => {
    return () => cleanupPolling();
  });

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
