import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneOff, Gift, Wallet, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { GiftSelectionModal } from "./GiftSelectionModal";
import { useWallet } from "@/hooks/useWallet";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CallInterfaceProps {
  creatorName: string;
  creatorImage?: string;
  creatorId: string;
  pricePerMinute: number;
  callType?: "audio" | "video";
  onEndCall?: () => void;
}

export function CallInterface({
  creatorName,
  creatorImage,
  creatorId,
  pricePerMinute,
  callType = "audio",
  onEndCall,
}: CallInterfaceProps) {
  const [duration, setDuration] = useState(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { balance } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  // Show live wallet balance (current balance minus ongoing call cost)
  const liveBalance = balance - cost;

  // Calculate remaining time with current balance
  const remainingMinutes = Math.floor(liveBalance / pricePerMinute);
  const remainingSeconds = remainingMinutes * 60;

  // Check if call will end soon (less than 20 seconds remaining)
  const isCallEndingSoon = remainingSeconds <= 20 && remainingSeconds > 0;

  const initials = creatorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const endCallMutation = useMutation({
    mutationFn: async (callData: { userId: string; creatorId: string; callType: string; durationSeconds: number; pricePerMinute: number; totalCost: string }) => {
      const response = await apiRequest("POST", "/api/wallet/deduct-call", callData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      localStorage.setItem("linky_first_call_completed", "true");
    },
  });

  const handleEndCall = () => {
    const userId = localStorage.getItem("linky_device_id") || "user_001";

    endCallMutation.mutate(
      {
        userId,
        creatorId,
        callType,
        durationSeconds: duration,
        pricePerMinute,
        totalCost: cost.toFixed(2),
      },
      {
        onSuccess: () => {
          toast({
            title: "Call Ended",
            description: `₹${cost} has been deducted from your wallet.`,
          });
          onEndCall?.();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to process call charges.",
            variant: "destructive",
          });
          onEndCall?.();
        },
      }
    );
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
        callDuration={duration}
        pricePerMinute={pricePerMinute}
      />
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/20 via-background to-background flex flex-col">
        {/* Video Call Layout */}
        {callType === "video" ? (
          <>
            {/* Remote video (creator) - Full screen */}
            <div className="flex-1 relative bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local video (user) - Picture in picture */}
              <div className="absolute top-4 right-4 w-28 h-40 bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Call info overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-white mb-1">{creatorName}</h2>
                  <div className="flex items-center gap-3 text-white/90">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {callType === "video" ? "Video Call" : "Audio Call"}
                    </Badge>
                    <span className="text-2xl font-bold tabular-nums">{formatTime(duration)}</span>
                    <span className="text-sm">₹{pricePerMinute}/min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video controls */}
            <div className="bg-black/80 backdrop-blur-sm p-4 pb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-14 h-14 ${!isVideoEnabled ? 'bg-destructive/20 border-destructive' : 'bg-white/10 border-white/20 text-white'}`}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-14 h-14 ${!isMicEnabled ? 'bg-destructive/20 border-destructive' : 'bg-white/10 border-white/20 text-white'}`}
                  onClick={() => setIsMicEnabled(!isMicEnabled)}
                >
                  {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 h-14 text-lg rounded-full"
                  onClick={handleEndCall}
                  data-testid="button-end-call"
                >
                  <PhoneOff className="w-6 h-6 mr-2" />
                  End Call
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-full bg-white/10 border-white/20 text-white"
                  onClick={() => setShowGiftModal(true)}
                  data-testid="button-send-gift"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Send Gift
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 h-14 rounded-full bg-white/10 border-white/20 text-white ${isCallEndingSoon ? 'ring-2 ring-destructive bg-destructive/20 border-destructive animate-pulse' : ''}`}
                  onClick={handleRecharge}
                  data-testid="button-recharge"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {isCallEndingSoon ? 'Recharge!' : 'Recharge'}
                </Button>
              </div>

              {/* Balance info */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <Wallet className="w-4 h-4" />
                  <span className={liveBalance < 135 ? "text-destructive font-semibold" : ""}>
                    Balance: ₹{liveBalance.toFixed(2)} • Cost: ₹{cost}
                  </span>
                </div>
                {isCallEndingSoon && (
                  <p className="text-destructive font-semibold text-sm mt-2">
                    ⚠️ Call ending in {remainingSeconds}s - Low balance!
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Audio Call Layout */
          <>
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Avatar className="w-32 h-32 mb-6 ring-4 ring-primary/20">
                <AvatarImage src={creatorImage} alt={creatorName} />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-semibold mb-2">{creatorName}</h2>
              <Badge variant="secondary" className="mb-6">Audio Call</Badge>

              <div className="text-4xl font-bold mb-2 tabular-nums">{formatTime(duration)}</div>
              <p className="text-muted-foreground mb-8">
                ₹{pricePerMinute}/min • Cost: ₹{cost}
              </p>

              {/* Call ending soon warning */}
              {isCallEndingSoon && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 text-center">
                  <p className="text-destructive font-semibold text-sm">
                    ⚠️ Call ending in {remainingSeconds}s - Low balance!
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-8">
                <Wallet className="w-4 h-4" />
                <span className={liveBalance < 135 ? "text-destructive font-semibold" : ""}>
                  Balance: ₹{liveBalance.toFixed(2)}
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
                  className={`flex-1 ${isCallEndingSoon ? 'ring-2 ring-destructive bg-destructive/5 border-destructive animate-pulse' : ''}`}
                  onClick={handleRecharge}
                  data-testid="button-recharge"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {isCallEndingSoon ? 'Recharge Now!' : 'Recharge'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
