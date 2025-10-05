import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneOff, Gift, Wallet } from "lucide-react";
import { GiftSelectionModal } from "./GiftSelectionModal";
import { useWallet } from "@/hooks/useWallet";
import { useLocation } from "wouter";

interface CallInterfaceProps {
  creatorName: string;
  creatorImage?: string;
  creatorId: string;
  pricePerMinute: number;
  onEndCall?: () => void;
}

export function CallInterface({
  creatorName,
  creatorImage,
  creatorId,
  pricePerMinute,
  onEndCall,
}: CallInterfaceProps) {
  const [duration, setDuration] = useState(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const { balance } = useWallet();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cost = Math.ceil(duration / 60) * pricePerMinute;
  const remainingBalance = balance - cost;

  const initials = creatorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleEndCall = () => {
    localStorage.setItem("linky_first_call_completed", "true");
    onEndCall?.();
  };

  const handleRecharge = () => {
    setLocation("/user/recharge");
  };

  return (
    <>
      <GiftSelectionModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        creatorId={creatorId}
        creatorName={creatorName}
      />
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/20 via-background to-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Avatar className="w-32 h-32 mb-6 ring-4 ring-primary/20">
          <AvatarImage src={creatorImage} alt={creatorName} />
          <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
        </Avatar>

        <h2 className="text-2xl font-semibold mb-2">{creatorName}</h2>
        <Badge variant="secondary" className="mb-6">In Call</Badge>

        <div className="text-4xl font-bold mb-2 tabular-nums">{formatTime(duration)}</div>
        <p className="text-muted-foreground mb-8">
          ₹{pricePerMinute}/min • Cost: ₹{cost}
        </p>

        <div className="flex items-center gap-2 mb-8">
          <Wallet className="w-4 h-4" />
          <span className={remainingBalance < 135 ? "text-destructive font-semibold" : ""}>
            Balance: ₹{remainingBalance}
          </span>
        </div>
      </div>

      <div className="p-6 pb-8 space-y-3">
        <Button
          variant="destructive"
          className="w-full h-14 text-lg"
          onClick={handleEndCall}
          data-testid="button-end-call"
        >
          <PhoneOff className="w-6 h-6 mr-2" />
          End Call
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowGiftModal(true)}
            data-testid="button-send-gift"
          >
            <Gift className="w-5 h-5 mr-2" />
            Send Gift
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRecharge}
            data-testid="button-recharge"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Recharge
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
