import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Shield, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
  onSelectGateway: (gateway: string) => void;
}

export function PaymentGatewayModal({ isOpen, amount, onClose, onSelectGateway }: PaymentGatewayModalProps) {
  const gateways = [
    {
      id: "payu",
      name: "PayU",
      description: "Fast & secure payments",
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "cashfree",
      name: "Cashfree",
      description: "UPI, Cards, Wallets",
      icon: Shield,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "razorpay",
      name: "Razorpay",
      description: "Instant payment processing",
      icon: Zap,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="dialog-payment-gateway"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle data-testid="heading-payment-gateway">
            Select Payment Gateway
          </DialogTitle>
          <p className="text-sm text-muted-foreground" data-testid="text-payment-amount">
            Recharge amount: <span className="font-semibold text-foreground">{formatCurrency(amount, false)}</span>
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {gateways.map((gateway) => (
            <Card
              key={gateway.id}
              className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
              onClick={() => onSelectGateway(gateway.id)}
              data-testid={`card-gateway-${gateway.id}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${gateway.color}`}>
                  <gateway.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" data-testid={`text-gateway-name-${gateway.id}`}>
                    {gateway.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {gateway.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full mt-2"
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
