import { useState } from "react";
import { Gift, IndianRupee, Wallet, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet, USER_ID } from "@/hooks/useWallet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { publishGiftRequestSignal, type GiftRequestSignal } from "@/lib/gift-requests";

interface GiftRequestDialogProps {
  request: GiftRequestSignal | null;
  liveBalance: number;
  onClose: () => void;
  onAccepted?: (amount: number) => void;
  onRechargeRequired?: () => void;
}

export function GiftRequestDialog({
  request,
  liveBalance,
  onClose,
  onAccepted,
  onRechargeRequired,
}: GiftRequestDialogProps) {
  const { toast } = useToast();
  const { refreshBalance } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const totalAmount = request.giftAmount * request.quantity;
  const canAfford = liveBalance >= totalAmount;

  const publishResponse = (status: "accepted" | "rejected", walletBalance?: number) => {
    publishGiftRequestSignal({
      ...request,
      status,
      responderId: USER_ID,
      responderName: "User",
      walletBalance,
      createdAt: Date.now(),
    });
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/gift-requests/${request.id}/respond`, {
        action: "rejected",
        responderId: USER_ID,
        responderName: "User",
      });
      const data = await response.json();
      publishGiftRequestSignal(data.request || { ...request, status: "rejected" });
      toast({
        title: "Gift Request Rejected",
        description: `You rejected ${request.giftName}.`,
      });
      onClose();
    } catch {
      publishResponse("rejected");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = async () => {
    if (!canAfford) {
      toast({
        title: "Recharge Required",
        description: `You need ${formatCurrency(totalAmount, false)} to accept this gift request.`,
        variant: "destructive",
      });
      onClose();
      onRechargeRequired?.();
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", `/api/gift-requests/${request.id}/respond`, {
        action: "accepted",
        responderId: USER_ID,
        responderName: "User",
      });
      const data = await response.json();
      const nextBalance = Number(data.wallet?.balance ?? liveBalance - totalAmount);

      if (data.wallet) {
        queryClient.setQueryData(["/api/wallet", USER_ID], data.wallet);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      refreshBalance();

      publishGiftRequestSignal(data.request || {
        ...request,
        status: "accepted",
        responderId: USER_ID,
        responderName: "User",
        walletBalance: nextBalance,
        createdAt: Date.now(),
      });
      onAccepted?.(totalAmount);
      toast({
        title: "Gift Sent",
        description: `${request.giftName} sent to ${request.creatorName} for ${formatCurrency(totalAmount, false)}.`,
      });
      onClose();
    } catch (error: any) {
      const message = error.message || "Unable to send gift.";
      if (/insufficient|INSUFFICIENT_FUNDS/i.test(message)) {
        toast({
          title: "Recharge Required",
          description: `You need ${formatCurrency(totalAmount, false)} to accept this gift request.`,
          variant: "destructive",
        });
        onClose();
        onRechargeRequired?.();
        return;
      }

      toast({
        title: "Gift Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-xl border-white/20 p-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-5 py-5 text-left text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl text-white">
                <Gift className="h-5 w-5 text-violet-200" />
                Gift Request
              </DialogTitle>
              <DialogDescription className="mt-1 text-white/70">
                {request.creatorName} is requesting a gift during this call.
              </DialogDescription>
            </div>
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Live</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Requested Gift</div>
                <div className="text-2xl font-bold">{request.giftName}</div>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <Gift className="h-7 w-7" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="flex items-center text-lg font-extrabold tabular-nums">
                <IndianRupee className="h-4 w-4" />
                {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className={`rounded-lg border px-4 py-3 ${canAfford ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4" />
                Live Balance
              </div>
              <div className="text-lg font-bold tabular-nums">{formatCurrency(liveBalance)}</div>
            </div>
            {!canAfford && (
              <p className="mt-2 text-xs">Recharge your wallet to accept this request.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReject} disabled={isProcessing}>
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button className="flex-1" onClick={handleAccept} disabled={isProcessing}>
              {canAfford ? "Accept & Send" : "Recharge"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
