import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RandomMatchButton } from "@/components/RandomMatchButton";
import { ChevronLeft, Wallet, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

export default function RechargePage() {
  const [, setLocation] = useLocation();
  const [currentBalance] = useState(120);

  const handleSelectAmount = (amount: number) => {
    setLocation(`/user/payment/${amount}`);
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
      </main>

      <RandomMatchButton />
    </div>
  );
}
