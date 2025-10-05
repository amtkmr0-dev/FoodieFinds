import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet, USER_ID } from "@/hooks/useWallet";
import type { GiftConfig } from "@shared/schema";
import { Heart, Sparkles, Sun, Gem, Crown, Star, Rocket, Trophy } from "lucide-react";

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
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
}: GiftSelectionModalProps) {
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();

  // Fetch available gifts
  const { data: gifts, isLoading } = useQuery<GiftConfig[]>({
    queryKey: ["/api/gifts"],
    enabled: isOpen,
  });

  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (gift: GiftConfig) => {
      const res = await apiRequest("POST", "/api/gifts/send", {
        senderId: USER_ID,
        recipientId: creatorId,
        giftId: gift.id,
        amount: gift.amount,
      });
      return await res.json();
    },
    onSuccess: (data, gift) => {
      toast({
        title: "Gift Sent!",
        description: `You sent ${gift.name} (₹${gift.amount}) to ${creatorName}`,
      });
      refreshBalance();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Gift",
        description: error.message || "Insufficient balance or something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleSendGift = (gift: GiftConfig) => {
    if (balance < gift.amount) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${gift.amount} to send this gift. Your balance: ₹${balance.toFixed(2)}`,
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
            Your Balance: <span className="font-semibold text-foreground">₹{balance.toFixed(2)}</span>
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading gifts...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {gifts?.map((gift) => {
              const IconComponent = iconMap[gift.iconType || "Heart"] || Heart;
              const canAfford = balance >= gift.amount;
              
              return (
                <Card
                  key={gift.id}
                  className={`p-4 text-center cursor-pointer transition-all ${
                    canAfford ? "hover-elevate active-elevate-2" : "opacity-50 cursor-not-allowed"
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
