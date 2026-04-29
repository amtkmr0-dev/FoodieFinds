import { useState } from "react";
import { Building2, CreditCard, IndianRupee, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { USER_ID } from "@/hooks/useWallet";
import { recordRechargeTransaction } from "@/lib/wallet-transactions";
import { startRazorpayRecharge } from "@/lib/razorpay";

interface RechargeWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rechargePacks = [
  { pay: 100, get: 110, bonus: 10, emoji: "🌟", color: "from-blue-500 to-cyan-500", label: "Starter" },
  { pay: 500, get: 550, bonus: 50, emoji: "💎", color: "from-purple-500 to-pink-500", label: "Popular" },
  { pay: 1000, get: 1150, bonus: 150, emoji: "🚀", color: "from-orange-500 to-red-500", label: "Best Value" },
  { pay: 2000, get: 2350, bonus: 350, emoji: "👑", color: "from-yellow-500 to-orange-500", label: "Premium" },
  { pay: 5000, get: 6000, bonus: 1000, emoji: "💰", color: "from-green-500 to-emerald-500", label: "Ultimate" },
];

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

export function RechargeWalletModal({ open, onOpenChange }: RechargeWalletModalProps) {
  const { toast } = useToast();
  const [selectedPack, setSelectedPack] = useState<typeof rechargePacks[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSelectedPack(null);
      setIsProcessing(false);
    }
  };

  const handleSelectPayment = async (methodId: string) => {
    if (!selectedPack || isProcessing) return;

    const paymentMethod = paymentMethods.find((method) => method.id === methodId)?.name || methodId;
    setIsProcessing(true);

    try {
      const result = await startRazorpayRecharge({
        userId: USER_ID,
        amount: selectedPack.pay,
        paymentMethod: methodId,
      });

      recordRechargeTransaction({
        transactionId: result.transactionId || result.transaction?.transactionId || `RZP${Date.now()}`,
        amount: selectedPack.pay,
        bonus: result.bonus ?? selectedPack.bonus,
        total: result.totalAmount ?? selectedPack.get,
        paymentMethod,
        status: "success",
      });

      toast({
        title: "Payment Successful!",
        description: `₹${(result.totalAmount ?? selectedPack.get).toFixed(2)} has been added to your wallet.`,
      });

      handleClose(false);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to complete Razorpay payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {!selectedPack ? "Select Recharge Pack" : "Select Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {!selectedPack
              ? "Choose a recharge pack to add balance to your wallet"
              : `Complete payment of ₹${selectedPack.pay} to get ₹${selectedPack.get}`
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedPack ? (
          <div className="space-y-3">
            {rechargePacks.map((pack) => (
              <div
                key={pack.pay}
                className={`relative cursor-pointer rounded-xl p-1 bg-gradient-to-r ${pack.color} hover:scale-[1.02] transition-transform duration-200`}
                onClick={() => setSelectedPack(pack)}
                data-testid={`home-recharge-pack-${pack.pay}`}
              >
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{pack.emoji}</span>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase">
                          {pack.label}
                        </div>
                        <div className="font-bold text-lg flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {pack.pay.toFixed(2)}
                        </div>
                        <div className="text-sm text-success font-medium">
                          +₹{pack.bonus.toFixed(2)} bonus
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">You Get</div>
                      <div className="text-2xl font-bold flex items-center justify-end gap-1 text-primary">
                        <IndianRupee className="w-6 h-6" />
                        {pack.get.toFixed(2)}
                      </div>
                      <div className="text-xs font-semibold text-success">
                        {Math.round((pack.bonus / pack.pay) * 100)}% extra
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Recharge Amount</p>
                <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                  <IndianRupee className="w-7 h-7" />
                  {selectedPack.pay.toFixed(2)}
                </div>
                <div className="text-sm text-success font-medium mt-1">
                  You'll get ₹{selectedPack.get.toFixed(2)} (includes ₹{selectedPack.bonus.toFixed(2)} bonus)
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedPack(null)}
                  data-testid="home-button-change-pack"
                >
                  Change Pack
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${isProcessing ? "opacity-60 pointer-events-none" : ""}`}
                  onClick={() => handleSelectPayment(method.id)}
                  data-testid={`home-card-payment-${method.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${method.color}`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
