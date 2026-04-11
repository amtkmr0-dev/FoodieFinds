import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BALANCE_THRESHOLDS } from "@/lib/config";

interface BalanceDisplayProps {
  balance: number;
  className?: string;
  onClick?: () => void;
}

export function BalanceDisplay({ balance, className = "", onClick }: BalanceDisplayProps) {
  // BUG-035 FIX: Use configuration constant for low balance threshold
  const isLow = balance < BALANCE_THRESHOLDS.LOW_BALANCE;

  return (
    <Badge
      variant={isLow ? "destructive" : "secondary"}
      className={`gap-1 mobile-m:gap-1.5 text-xs mobile-m:text-sm px-2 mobile-m:px-3 py-1 ${onClick ? 'cursor-pointer hover-elevate active-elevate-2' : ''} ${className}`}
      onClick={onClick}
      data-testid="badge-balance"
    >
      <Wallet className="w-3 h-3 mobile-m:w-3.5 mobile-m:h-3.5" />
      <span className="font-semibold">₹{balance.toFixed(2)}</span>
    </Badge>
  );
}
