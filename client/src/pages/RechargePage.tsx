import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Wallet, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

export default function RechargePage() {
  const [, setLocation] = useLocation();
  const [customAmount, setCustomAmount] = useState("");
  const [currentBalance] = useState(120);

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
          <h3 className="font-semibold mb-3">Quick Recharge</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="h-16 flex-col gap-1"
                onClick={() => console.log(`Recharge ₹${amount}`)}
                data-testid={`button-recharge-${amount}`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-semibold">₹{amount}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Custom Amount</h3>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1"
              data-testid="input-custom-amount"
            />
            <Button
              disabled={!customAmount || parseInt(customAmount) < 100}
              onClick={() => console.log(`Recharge ₹${customAmount}`)}
              data-testid="button-recharge-custom"
            >
              Recharge
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Minimum recharge: ₹100</p>
        </div>

        <Card className="p-4 bg-warning/10 border-warning/20">
          <p className="text-sm">
            <strong>Note:</strong> You need minimum ₹135 (3 minutes at ₹45/min) to initiate a call.
          </p>
        </Card>
      </main>
    </div>
  );
}
