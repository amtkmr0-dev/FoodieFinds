import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BalanceDisplayProps {
  balance: number;
  className?: string;
  onClick?: () => void;
}

export function BalanceDisplay({ balance, className = "", onClick }: BalanceDisplayProps) {
  const isLow = balance < 135;
  
  return (
    <Badge
      variant={isLow ? "destructive" : "secondary"}
      className={`gap-1.5 ${onClick ? 'cursor-pointer hover-elevate active-elevate-2' : ''} ${className}`}
      onClick={onClick}
      data-testid="badge-balance"
    >
      <Wallet className="w-3.5 h-3.5" />
      <span className="font-semibold">₹{balance.toFixed(2)}</span>
    </Badge>
  );
}
