import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";
import { RandomMatchButton } from "@/components/RandomMatchButton";
import { ChevronLeft, Wallet, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RechargePage() {
  const [, setLocation] = useLocation();
  const [currentBalance] = useState(120);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const { toast } = useToast();

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setShowPaymentModal(true);
  };

  const handleSelectGateway = (gateway: string) => {
    setShowPaymentModal(false);
    toast({
      title: "Processing Payment",
      description: `Redirecting to ${gateway.toUpperCase()} payment gateway for ₹${selectedAmount}...`,
    });
    // In real app, redirect to payment gateway
    setTimeout(() => {
      toast({
        title: "Payment Successful!",
        description: `₹${selectedAmount} has been added to your wallet.`,
      });
      // Delay redirect to ensure toast is visible
      setTimeout(() => {
        setLocation("/user/account");
      }, 1500);
    }, 1500);
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

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
          <div className="text-4xl font-bold mb-2">₹{currentBalance}</div>
          <Badge variant={currentBalance < 135 ? "destructive" : "secondary"}>
            {currentBalance < 135 ? "Low Balance - Minimum ₹135 needed" : "Sufficient for calls"}
          </Badge>
        </Card>

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
                <span className="font-semibold">₹{amount}</span>
              </Button>
            ))}
          </div>
        </div>

        <Card className="p-4 bg-warning/10 border-warning/20">
          <p className="text-sm">
            <strong>Note:</strong> You need minimum ₹135 (3 minutes at ₹45/min) to initiate a call.
          </p>
        </Card>
      </main>

      <PaymentGatewayModal
        isOpen={showPaymentModal}
        amount={selectedAmount}
        onClose={() => setShowPaymentModal(false)}
        onSelectGateway={handleSelectGateway}
      />

      <RandomMatchButton />
    </div>
  );
}
