import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Wallet, CreditCard, Smartphone, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function RechargePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentBalance] = useState(120);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
  };

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI App",
      description: "Pay using any UPI app",
      icon: Smartphone,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "card",
      name: "Card",
      description: "Debit/Credit card payment",
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "Pay via your bank account",
      icon: Building2,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  const handleSelectMethod = (method: string) => {
    toast({
      title: "Processing Payment",
      description: `Redirecting to ${paymentMethods.find(m => m.id === method)?.name} for ₹${selectedAmount}...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Payment Successful!",
        description: `₹${selectedAmount} has been added to your wallet.`,
      });
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
                  <span className="font-semibold">₹{amount}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Recharge Amount</p>
                <div className="text-4xl font-bold text-primary">₹{selectedAmount}</div>
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
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handleSelectMethod(method.id)}
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
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
