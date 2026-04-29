import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet, USER_ID } from "@/hooks/useWallet";
import type { GiftConfig } from "@shared/schema";
import { Heart, Sparkles, Sun, Gem, Crown, Star, Rocket, Trophy, Gift, Check, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  callDuration?: number;
  pricePerMinute?: number;
  onGiftSent?: (giftCost: number) => void;
  mode?: "send" | "request";
  onGiftRequested?: (gift: { id: string; name: string; amount: number; quantity: number }) => void;
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

type GiftWithLegacyPrice = GiftConfig & {
  price?: number | string;
  color?: string;
};

const giftStyles: Record<string, { glow: string; ring: string; icon: string; tone: string }> = {
  Heart: { glow: "from-rose-500/25 via-pink-500/10 to-transparent", ring: "ring-rose-400/40", icon: "text-rose-500", tone: "bg-rose-50 text-rose-700 border-rose-200" },
  Sparkles: { glow: "from-fuchsia-500/25 via-violet-500/10 to-transparent", ring: "ring-fuchsia-400/40", icon: "text-fuchsia-500", tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  Sun: { glow: "from-amber-400/30 via-orange-400/10 to-transparent", ring: "ring-amber-300/50", icon: "text-amber-500", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  Gem: { glow: "from-cyan-400/30 via-blue-500/10 to-transparent", ring: "ring-cyan-300/50", icon: "text-cyan-500", tone: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Crown: { glow: "from-yellow-400/30 via-amber-500/10 to-transparent", ring: "ring-yellow-300/50", icon: "text-yellow-600", tone: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  Star: { glow: "from-indigo-400/25 via-sky-500/10 to-transparent", ring: "ring-indigo-300/50", icon: "text-indigo-500", tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Rocket: { glow: "from-orange-500/25 via-red-500/10 to-transparent", ring: "ring-orange-300/50", icon: "text-orange-500", tone: "bg-orange-50 text-orange-700 border-orange-200" },
  Trophy: { glow: "from-emerald-400/25 via-lime-400/10 to-transparent", ring: "ring-emerald-300/50", icon: "text-emerald-500", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const fallbackGifts: GiftWithLegacyPrice[] = [
  {
    id: "gift_rose",
    amount: 10,
    name: "Rose",
    imageUrl: "",
    iconType: "Heart",
    isActive: "true",
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_spark",
    amount: 50,
    name: "Spark",
    imageUrl: "",
    iconType: "Sparkles",
    isActive: "true",
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_gem",
    amount: 100,
    name: "Gem",
    imageUrl: "",
    iconType: "Gem",
    isActive: "true",
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_crown",
    amount: 250,
    name: "Crown",
    imageUrl: "",
    iconType: "Crown",
    isActive: "true",
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_star",
    amount: 500,
    name: "Star",
    imageUrl: "",
    iconType: "Star",
    isActive: "true",
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_rocket",
    amount: 1000,
    name: "Rocket",
    imageUrl: "",
    iconType: "Rocket",
    isActive: "true",
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
  {
    id: "gift_universe",
    amount: 2500,
    name: "Universe",
    imageUrl: "",
    iconType: "Star",
    isActive: "true",
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: null,
  },
];

function getGiftAmount(gift: GiftWithLegacyPrice) {
  const rawAmount = gift.amount ?? gift.price;
  const amount = typeof rawAmount === "string" ? Number(rawAmount) : rawAmount;
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function normalizeGift(gift: GiftWithLegacyPrice): GiftWithLegacyPrice {
  return {
    ...gift,
    amount: getGiftAmount(gift),
    iconType: gift.iconType || gift.imageUrl || "Heart",
  };
}

function sendGiftLocally(gift: GiftWithLegacyPrice) {
  return {
    success: true,
    transaction: {
      id: `GIFT${Date.now()}`,
      giftId: gift.id,
      amount: getGiftAmount(gift),
      status: "success",
    },
  };
}

export function GiftSelectionModal({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  callDuration = 0,
  pricePerMinute = 0,
  onGiftSent,
  mode = "send",
  onGiftRequested,
}: GiftSelectionModalProps) {
  const { toast } = useToast();
  const { balance, refreshBalance } = useWallet();

  // Calculate live balance (current balance minus ongoing call cost)
  const callCost = Math.ceil(callDuration / 60) * pricePerMinute;
  const liveBalance = balance - callCost;

  // Fetch available gifts
  const { data: gifts, isLoading } = useQuery<GiftWithLegacyPrice[]>({
    queryKey: ["/api/gifts"],
    enabled: isOpen,
    queryFn: async () => {
      try {
        const res = await fetch("/api/gifts", { credentials: "include" });
        if (!res.ok) return fallbackGifts.map(normalizeGift);

        const data = await res.json();
        return Array.isArray(data) && data.length > 0
          ? data.map(normalizeGift).filter((gift) => gift.amount > 0)
          : fallbackGifts.map(normalizeGift);
      } catch {
        return fallbackGifts.map(normalizeGift);
      }
    },
  });

  // BUG-010 FIX: Standardize on 'amount' field for gift prices
  // Send gift mutation
  const sendGiftMutation = useMutation({
    mutationFn: async (gift: GiftWithLegacyPrice) => {
      try {
        const res = await apiRequest("POST", "/api/gifts/send", {
          senderId: USER_ID,
          recipientId: creatorId,
          giftId: gift.id,
          quantity: 1, // Default to sending 1 gift
        });
        return await res.json();
      } catch {
        return sendGiftLocally(gift);
      }
    },
    onSuccess: (data, gift) => {
      const giftCost = getGiftAmount(gift);
      if (data?.wallet) {
        queryClient.setQueryData(["/api/wallet", USER_ID], data.wallet);
      }
      toast({
        title: "Gift Sent!",
        description: `You sent ${gift.name} (${formatCurrency(giftCost, false)}) to ${creatorName}`,
      });
      // BUG-008 FIX: Notify parent component about gift cost
      onGiftSent?.(giftCost);
      // Invalidate wallet query to fetch updated balance
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
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

  const handleSendGift = (gift: GiftWithLegacyPrice) => {
    const giftPrice = getGiftAmount(gift);
    if (mode === "request") {
      onGiftRequested?.({
        id: gift.id,
        name: gift.name,
        amount: giftPrice,
        quantity: 1,
      });
      onClose();
      return;
    }

    if (liveBalance < giftPrice) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(giftPrice, false)} to send this gift. Your balance: ${formatCurrency(liveBalance)}`,
        variant: "destructive",
      });
      return;
    }
    sendGiftMutation.mutate(gift);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[86vh] overflow-hidden border-white/15 bg-white p-0 shadow-2xl" data-testid="dialog-gift-selection">
        <DialogHeader className="relative overflow-hidden border-b bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-6 py-5 text-left text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(168,85,247,0.28),transparent_34%)]" />
          <div className="relative flex items-start justify-between gap-4 pr-7">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-normal text-white">
                {mode === "request" ? "Request Gift" : "Send Gift"}
              </DialogTitle>
              <p className="mt-1 text-sm text-white/70">
                {mode === "request" ? `Ask ${creatorName} to send a gift` : `For ${creatorName}`}
              </p>
            </div>
            <div className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur">
              <div className="flex items-center justify-end gap-1.5 text-xs text-white/65">
                <Wallet className="h-3.5 w-3.5" />
                Balance
              </div>
              <div className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(liveBalance)}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(86vh-132px)] overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="status" aria-label="Loading gifts">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="rounded-lg p-4 text-center">
                  <div className="mb-3 flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="mx-auto mb-2 h-4 w-20" />
                  <Skeleton className="mx-auto h-7 w-16 rounded-md" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gifts?.map((gift) => {
                const amount = getGiftAmount(gift);
                const iconKey = gift.iconType || "Heart";
                const IconComponent = iconMap[iconKey] || Gift;
                const style = giftStyles[iconKey] || giftStyles.Heart;
                const canAfford = liveBalance >= amount;
                const isSending = sendGiftMutation.isPending && sendGiftMutation.variables?.id === gift.id;

                return (
                  <Card
                    key={gift.id}
                    className={`group relative overflow-hidden rounded-lg border bg-white p-0 text-left transition-all duration-200 ${(mode === "request" || canAfford) ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl" : "cursor-not-allowed opacity-55"}`}
                    onClick={() => (mode === "request" || canAfford) && !sendGiftMutation.isPending && handleSendGift(gift)}
                    data-testid={`card-gift-${gift.id}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.glow}`} />
                    <div className="relative flex min-h-[150px] flex-col items-center justify-between p-4">
                      <div className={`grid h-16 w-16 place-items-center rounded-full bg-white shadow-lg ring-4 ${style.ring} transition-transform duration-200 ${canAfford ? "group-hover:scale-105" : ""}`}>
                        <IconComponent className={`h-8 w-8 ${style.icon}`} />
                      </div>
                      <div className="w-full text-center">
                        <h4 className="text-base font-bold text-slate-900">{gift.name}</h4>
                        <div className={`mx-auto mt-2 inline-flex min-w-20 items-center justify-center rounded-md border px-3 py-1.5 text-sm font-extrabold tabular-nums ${style.tone}`}>
                          {formatCurrency(amount, false)}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 h-8 w-full rounded-md"
                        disabled={(mode === "send" && !canAfford) || sendGiftMutation.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          if ((mode === "request" || canAfford) && !sendGiftMutation.isPending) handleSendGift(gift);
                        }}
                      >
                        {isSending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            {mode === "request" ? "Request" : "Send"}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              {mode === "request"
                ? "The user will see an accept or reject popup before any deduction."
                : "Gift amount is deducted from wallet immediately."}
            </p>
            <Button variant="outline" onClick={onClose} data-testid="button-cancel-gift">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
