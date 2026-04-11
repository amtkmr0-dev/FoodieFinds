import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/currency";
import { PAYMENT_METHODS_CONFIG } from "@/lib/payment-methods";
import { PaymentConfirmationDialog } from "@/components/PaymentConfirmationDialog";
import { PaymentErrorDialog, PaymentErrorType } from "@/components/PaymentErrorDialog";
import { PaymentReceipt, PaymentReceiptData } from "@/components/PaymentReceipt";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Payment request deduplication - track active payment requests
const activePaymentRequests = new Map<string, boolean>();

export default function PaymentGatewayPage() {
  const [, setLocation] = useLocation();
  const { amount } = useParams<{ amount: string }>();
  const { toast } = useToast();
  const { recharge } = useWallet();
  const rechargeAmount = parseInt(amount || "0");
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

  const paymentMethods = PAYMENT_METHODS_CONFIG.map((method) => ({
    ...method,
    icon: method.id === "upi" ? Smartphone : method.id === "card" ? CreditCard : Building2,
  }));

  const handleSelectMethod = useCallback((methodId: string) => {
    if (isProcessing) return;

    // Prevent multiple simultaneous payment requests
    const requestId = `gateway_${rechargeAmount}_${methodId}_${Date.now()}`;
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
  }, [isProcessing, rechargeAmount, toast]);

  const handleConfirmPayment = async () => {
    if (!selectedMethod || !requestIdRef.current) return;

    // Mark this request as active
    activePaymentRequests.set(requestIdRef.current, true);

    setShowConfirmation(false);
    setIsProcessing(true);

    try {
      // Process payment using mock payment processor
      const result = await recharge(rechargeAmount, selectedMethod);

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
        startPolling(transactionId, rechargeAmount, selectedMethod);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // BUG-001 FIX: Mark first recharge as completed ONLY after payment is confirmed successful
      localStorage.setItem("firstRechargeCompleted", "true");

      // Generate receipt data with bonus information
      const receipt: PaymentReceiptData = {
        transactionId: result.transaction?.transactionId || `TXN${Date.now()}`,
        amount: rechargeAmount,
        total: result.totalAmount || rechargeAmount,
        bonus: result.bonus,
        paymentMethod: paymentMethods.find((m: any) => m.id === selectedMethod)?.name || "Unknown",
        date: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        status: "success",
      };

      setReceiptData(receipt);
      setShowReceipt(true);

      // Show success message with bonus information
      const message = result.bonus && result.bonus > 0
        ? `${formatCurrency(rechargeAmount)} + ${formatCurrency(result.bonus)} bonus has been added to your wallet.`
        : `${formatCurrency(rechargeAmount)} has been added to your wallet.`;

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
            paymentMethod: paymentMethods.find((m: any) => m.id === method)?.name || "Unknown",
            date: new Date().toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
            status: "success",
          };

          setReceiptData(receipt);
          setShowReceipt(true);

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

  const handleRetryPayment = () => {
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
    setLocation("/user/account");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/user/recharge")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Payment Gateway</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Recharge Amount</p>
            <div className="text-4xl font-bold text-primary">{formatCurrency(rechargeAmount, false)}</div>
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
      </main>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showConfirmation}
        amount={rechargeAmount}
        paymentMethod={paymentMethods.find((m: any) => m.id === selectedMethod) || paymentMethods[0]}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowConfirmation(false)}
        isProcessing={isProcessing || isPolling}
      />

      {/* Payment Error Dialog */}
      <PaymentErrorDialog
        isOpen={showError}
        errorType={errorType}
        amount={rechargeAmount}
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
