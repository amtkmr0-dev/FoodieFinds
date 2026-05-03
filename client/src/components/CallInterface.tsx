import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneOff, Gift, Wallet, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { GiftSelectionModal } from "./GiftSelectionModal";
import { BalanceMonitor } from "./BalanceMonitor";
import { useWallet } from "@/hooks/useWallet";
import { useCallBalanceMonitor } from "@/hooks/useCallBalanceMonitor";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/lib/auth";

interface CallInterfaceProps {
  creatorName: string;
  creatorImage?: string;
  creatorId: string;
  pricePerMinute: number;
  callType?: "audio" | "video";
  onEndCall?: () => void;
}

// BUG-006 FIX: Billing policy - calls are charged per minute with partial minutes rounded up
// This is clearly communicated to users in the UI
const BILLING_POLICY = {
  type: "per-minute",
  description: "Calls are charged per minute. Partial minutes are rounded up.",
  example: "A 61-second call is charged as 2 minutes."
};

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
  const [isCallActive, setIsCallActive] = useState(true); // BUG-028 FIX: Track call active state
  const [callEndedReason, setCallEndedReason] = useState<'user' | 'insufficient_balance' | 'negative_balance' | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { balance } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // BUG-008 FIX: Track gift costs during the call
  const [totalGiftCost, setTotalGiftCost] = useState(0);

  // BALANCE MONITORING: Real-time balance monitoring with automatic disconnection
  const balanceMonitor = useCallBalanceMonitor(pricePerMinute, isCallActive, {
    warningThreshold: 50,
    criticalThreshold: 20,
    pollInterval: 2000,
    autoDisconnect: true,
    onDisconnect: (reason: 'insufficient_balance' | 'negative_balance') => {
      setCallEndedReason(reason);
      handleEndCall();
    },
  });

  // BUG-028 FIX: Only run timer when call is active
  useEffect(() => {
    if (!isCallActive) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCallActive]);

  // BALANCE MONITORING: Update duration in balance monitor
  useEffect(() => {
    if (isCallActive) {
      balanceMonitor.updateDuration(duration);
    }
  }, [duration, isCallActive, balanceMonitor]);

  // BUG-027 FIX: Implement WebRTC video/audio stream handling (mock implementation)
  // Browser compatibility helper for getUserMedia
  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    // Try modern API first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return await navigator.mediaDevices.getUserMedia(constraints);
    }

    // Fallback for older browsers (Safari < 11, etc.)
    const getUserMediaLegacy = (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia;

    if (getUserMediaLegacy) {
      return new Promise((resolve, reject) => {
        getUserMediaLegacy.call(navigator, constraints, resolve, reject);
      });
    }

    throw new Error('getUserMedia is not supported in this browser');
  }, []);

  useEffect(() => {
    if (callType === "video" && isCallActive) {
      // Mock WebRTC implementation - in production, this would use actual WebRTC
      const initializeStreams = async () => {
        try {
          // Get local stream (user's camera/mic) with browser compatibility
          const localStream = await getUserMedia({
            video: isVideoEnabled,
            audio: isMicEnabled,
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }

          // In production, you would establish a WebRTC connection here
          // and set the remote stream to remoteVideoRef.current.srcObject
        } catch (error) {
          console.error('Error accessing media devices:', error);
          toast({
            title: "Camera/Mic Access",
            description: "Please allow camera and microphone access for video calls. Your browser may not be supported.",
            variant: "destructive",
          });
        }
      };

      initializeStreams();
    }

    // Cleanup function
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
    };
  }, [callType, isCallActive, isVideoEnabled, isMicEnabled, toast]);

  // Update stream when video/mic state changes
  useEffect(() => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicEnabled;
      });
    }
  }, [isVideoEnabled, isMicEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // BUG-006 FIX: Call cost calculation with clear per-minute billing policy
  // Partial minutes are rounded up (e.g., 61 seconds = 2 minutes)
  const billableMinutes = Math.ceil(duration / 60);
  const callCost = billableMinutes * pricePerMinute;

  // BUG-008 FIX: Live balance now includes both call cost AND gift costs
  const totalCost = callCost + totalGiftCost;

  // BALANCE MONITORING: Use balance monitor for live balance and remaining time
  const liveBalance = balanceMonitor.liveBalance;
  const remainingSeconds = balanceMonitor.remainingSeconds;
  const isLowBalance = balanceMonitor.isLowBalance;
  const isCriticalBalance = balanceMonitor.isCriticalBalance;
  const isCallEndingSoon = balanceMonitor.isCallEndingSoon;

  // BUG-008 FIX: Handler for when a gift is sent during a call
  const handleGiftSent = useCallback((giftCost: number) => {
    setTotalGiftCost(prev => prev + giftCost);
    balanceMonitor.updateGiftCost(giftCost);
    toast({
      title: "Gift Sent!",
      description: `₹${giftCost} has been deducted from your wallet.`,
    });
  }, [toast, balanceMonitor]);

  const initials = (creatorName || "")
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Manus §2.1: the client used to send `callCost`, `giftCost`, `totalCost`
  // and the server trusted the math. Now the client only sends the raw
  // observations (duration, rate, gift cost) and the server is the SOLE
  // authority on what to charge. The first-call flag also moves to the
  // server (was `localStorage.setItem("linky_first_call_completed", ...)`).
  const endCallMutation = useMutation({
    mutationFn: async (callData: {
      userId: string;
      creatorId: string;
      callType: string;
      durationSeconds: number;
      pricePerMinute: number;
      giftCost: number;
    }) => {
      const response = await apiRequest("POST", "/api/wallet/deduct-call", callData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
  });

  const handleEndCall = () => {
    // BUG-028 FIX: Stop the timer when call ends
    setIsCallActive(false);

    let userId = localStorage.getItem("linky_device_id");
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem("linky_device_id", userId);
    }

    // BALANCE MONITORING: Reset monitoring state
    balanceMonitor.resetMonitoring();

    endCallMutation.mutate(
      {
        userId: userId || generateUUID(),
        creatorId,
        callType,
        durationSeconds: duration,
        pricePerMinute,
        giftCost: totalGiftCost,
      },
      {
        onSuccess: (data: any) => {
          // Trust the server's computed totals, not the local estimates.
          const serverTotal = typeof data?.totalCost === "number" ? data.totalCost : totalCost;
          const serverCallCost = typeof data?.callCost === "number" ? data.callCost : callCost;
          const serverGiftCost = typeof data?.giftCost === "number" ? data.giftCost : totalGiftCost;

          let description: string;
          if (callEndedReason === 'negative_balance') {
            description = `Call ended due to insufficient balance. Cost: ₹${serverTotal.toFixed(2)}`;
          } else if (callEndedReason === 'insufficient_balance') {
            description = `Call ended as balance reached zero. Cost: ₹${serverTotal.toFixed(2)}`;
          } else {
            const costBreakdown = serverGiftCost > 0
              ? `Call: ₹${serverCallCost} + Gifts: ₹${serverGiftCost} = ₹${serverTotal}`
              : `₹${serverTotal}`;
            description = `${costBreakdown} has been deducted from your wallet.`;
          }

          toast({
            title: "Call Ended",
            description,
            variant: callEndedReason ? "destructive" : "default",
          });
          onEndCall?.();
        },
        onError: (error) => {
          // BUG-022 FIX: Show error dialog on failure instead of navigating away
          toast({
            title: "Call Processing Error",
            description: error.message || "Failed to process call charges. Please try again or contact support.",
            variant: "destructive",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Retry the call end operation
                  handleEndCall();
                }}
              >
                Retry
              </Button>
            ),
          });
          // BUG-022 FIX: Don't call onEndCall() on error - keep user on call screen
          // This allows them to retry or contact support
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
        onGiftSent={handleGiftSent}
      />
      {/* FIX: Add safe area insets for Android to prevent UI overlapping with system status bar */}
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/20 via-background to-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Video Call Layout */}
        {callType === "video" ? (
          <>
            {/* BUG-040 FIX: Add accessibility attributes to video elements */}
            {/* BUG-049 FIX: Make video layout responsive */}
            {/* Remote video (creator) - Full screen */}
            <div className="flex-1 relative bg-black">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                aria-label={`Video call with ${creatorName}`}
                role="video"
              />

              {/* FIX: Local video (user) - Picture in picture with safe area handling to prevent status bar overlap */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-24 h-32 sm:w-28 sm:h-40 md:w-32 md:h-44 lg:w-36 lg:h-48 bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-white/20" style={{ top: 'max(12px, env(safe-area-inset-top) + 8px)' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  aria-label="Your camera feed"
                  role="video"
                />
              </div>

              {/* FIX: Call info overlay - responsive padding with safe area handling for bottom navigation bar */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4" style={{ bottom: 'max(12px, env(safe-area-inset-bottom) + 8px)' }}>
                <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">{creatorName}</h2>
                  <div className="flex items-center gap-2 sm:gap-3 text-white/90 flex-wrap">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                      {callType === "video" ? "Video Call" : "Audio Call"}
                    </Badge>
                    <span className="text-xl sm:text-2xl font-bold tabular-nums">{formatTime(duration)}</span>
                    <span className="text-xs sm:text-sm">₹{pricePerMinute}/min</span>
                  </div>
                  {/* BUG-006 FIX: Display billing policy */}
                  <div className="text-[10px] sm:text-xs text-white/70 mt-1">
                    {BILLING_POLICY.description}
                  </div>
                </div>
              </div>
            </div>

            {/* BUG-040 FIX: Add accessibility attributes to video controls */}
            {/* BUG-049 FIX: Make video controls responsive */}
            {/* FIX: Video controls with safe area handling for bottom navigation bar */}
            <div className="bg-black/80 backdrop-blur-sm p-3 sm:p-4 pb-6 sm:pb-8" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 16px)' }}>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${!isVideoEnabled ? 'bg-destructive/20 border-destructive' : 'bg-white/10 border-white/20 text-white'}`}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                  aria-pressed={!isVideoEnabled}
                >
                  <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${!isMicEnabled ? 'bg-destructive/20 border-destructive' : 'bg-white/10 border-white/20 text-white'}`}
                  onClick={() => setIsMicEnabled(!isMicEnabled)}
                  aria-label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
                  aria-pressed={!isMicEnabled}
                >
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg rounded-full"
                  onClick={handleEndCall}
                  data-testid="button-end-call"
                  aria-label="End call"
                >
                  <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">End Call</span>
                  <span className="sm:hidden">End</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 rounded-full bg-white/10 border-white/20 text-white"
                  onClick={() => setShowGiftModal(true)}
                  data-testid="button-send-gift"
                  aria-label="Send gift"
                >
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Send Gift</span>
                  <span className="sm:hidden">Gift</span>
                </Button>
                <Button
                  variant="outline"
                  className={`flex-1 h-12 sm:h-14 rounded-full bg-white/10 border-white/20 text-white ${(isCallEndingSoon || isCriticalBalance) ? 'ring-2 ring-destructive bg-destructive/20 border-destructive animate-pulse' : ''}`}
                  onClick={handleRecharge}
                  data-testid="button-recharge"
                  aria-label={(isCallEndingSoon || isCriticalBalance) ? "Recharge now - low balance" : "Recharge wallet"}
                >
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  {(isCallEndingSoon || isCriticalBalance) ? (
                    <>
                      <span className="hidden sm:inline">Recharge!</span>
                      <span className="sm:hidden">Now!</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Recharge</span>
                      <span className="sm:hidden">Top Up</span>
                    </>
                  )}
                </Button>
              </div>

              {/* BALANCE MONITORING: Enhanced balance display with warnings */}
              <div className="mt-3 sm:mt-4">
                <BalanceMonitor
                  liveBalance={liveBalance}
                  remainingSeconds={remainingSeconds}
                  isLowBalance={isLowBalance}
                  isCriticalBalance={isCriticalBalance}
                  isCallEndingSoon={isCallEndingSoon}
                  totalCost={totalCost}
                  callCost={callCost}
                  giftCost={totalGiftCost}
                  compact={true}
                />
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
                ₹{pricePerMinute}/min • Cost: ₹{totalCost}
              </p>

              {/* BUG-006 FIX: Display billing policy */}
              <div className="text-xs text-muted-foreground mb-4">
                {BILLING_POLICY.description}
              </div>

              {/* BUG-008 FIX: Show cost breakdown when gifts are sent */}
              {totalGiftCost > 0 && (
                <div className="text-sm text-muted-foreground mb-4">
                  Call: ₹{callCost} + Gifts: ₹{totalGiftCost}
                </div>
              )}

              {/* BALANCE MONITORING: Enhanced balance display with warnings */}
              <div className="mb-8">
                <BalanceMonitor
                  liveBalance={liveBalance}
                  remainingSeconds={remainingSeconds}
                  isLowBalance={isLowBalance}
                  isCriticalBalance={isCriticalBalance}
                  isCallEndingSoon={isCallEndingSoon}
                  totalCost={totalCost}
                  callCost={callCost}
                  giftCost={totalGiftCost}
                  compact={false}
                />
              </div>
            </div>

            {/* FIX: Audio call controls with safe area handling for bottom navigation bar */}
            <div className="p-6 pb-8 space-y-3" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom) + 24px)' }}>
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
                  className={`flex-1 ${(isCallEndingSoon || isCriticalBalance) ? 'ring-2 ring-destructive bg-destructive/5 border-destructive animate-pulse' : ''}`}
                  onClick={handleRecharge}
                  data-testid="button-recharge"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {(isCallEndingSoon || isCriticalBalance) ? 'Recharge Now!' : 'Recharge'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
