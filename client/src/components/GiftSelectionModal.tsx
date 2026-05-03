import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet, getCurrentUserId } from "@/hooks/useWallet";
import type { GiftConfig } from "@shared/schema";
import { Heart, Sparkles, Sun, Gem, Crown, Star, Rocket, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  callDuration?: number;
  pricePerMinute?: number;
  onGiftSent?: (giftCost: number) => void;
}

// Map icon types to actual Lucide icons
const iconMap: Record<string, any> = {
  Heart,
  Sparkles,
  Sun,
  Gem,
  Crown,
  Star,
  Rocket,
  Trophy,
};

export function GiftSelectionModal({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  callDuration = 0,
  pricePerMinute = 0,
  onGiftSent,
}: GiftSelectionModalProps) {
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();

  // Calculate live balance (current balance minus ongoing call cost)
  const callCost = Math.ceil(callDuration / 60) * pricePerMinute;
  const liveBalance = balance - callCost;

  // Fetch available gifts
  const { data: gifts, isLoading } = useQuery<GiftConfig[]>({
    queryKey: ["/api/gifts"],
    enabled: isOpen,
  });

  // BUG-010 FIX: Standardize on 'amount' field for gift prices
  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (gift: GiftConfig) => {
      // senderId is derived server-side from the JWT (post-audit fix);
      // sending it from the client would just be ignored.
      const res = await apiRequest("POST", "/api/gifts/send", {
        recipientId: creatorId,
        giftId: gift.id,
        quantity: 1,
      });
      return await res.json();
    },
    onSuccess: (data, gift) => {
      const giftCost = gift.amount; // BUG-010 FIX: Use consistent 'amount' field
      toast({
        title: "Gift Sent!",
        description: `You sent ${gift.name} (₹${giftCost}) to ${creatorName}`,
      });
      // BUG-008 FIX: Notify parent component about gift cost
      onGiftSent?.(giftCost);
      // Invalidate wallet query to fetch updated balance
      const uid = getCurrentUserId();
      if (uid) queryClient.invalidateQueries({ queryKey: ["/api/wallet", uid] });
      refreshBalance();
      onClose();
    },
    onError: (error: Error | { message?: string }) => {
      toast({
        title: "Failed to Send Gift",
        description: error.message || "Insufficient balance or something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleSendGift = (gift: GiftConfig) => {
    const giftPrice = gift.amount; // BUG-010 FIX: Use consistent 'amount' field
    if (liveBalance < giftPrice) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${giftPrice} to send this gift. Your balance: ₹${liveBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    sendGiftMutation.mutate(gift);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-gift-selection">
        <DialogHeader>
          <DialogTitle>Send Gift to {creatorName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Your Balance: <span className="font-semibold text-foreground">₹{liveBalance.toFixed(2)}</span>
          </p>
        </DialogHeader>

        {isLoading ? (
          // BUG-042 FIX: Show skeleton loading UI instead of text
          <div className="grid grid-cols-3 gap-3 mt-4" role="status" aria-label="Loading gifts">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4 text-center">
                <div className="mb-2 flex justify-center">
                  <Skeleton className="w-12 h-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-20 mx-auto mb-1" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {gifts?.map((gift) => {
              const IconComponent = iconMap[gift.iconType || "Heart"] || Heart;
              const canAfford = liveBalance >= gift.amount;

              return (
                <Card
                  key={gift.id}
                  className={`p-4 text-center cursor-pointer transition-all ${canAfford ? "hover-elevate active-elevate-2" : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={() => canAfford && handleSendGift(gift)}
                  data-testid={`card-gift-${gift.id}`}
                >
                  <div className="mb-2 flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{gift.name}</h4>
                  <p className="text-xs font-bold text-primary">₹{gift.amount}</p>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-gift">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
