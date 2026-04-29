import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneOff, Gift, Wallet, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { GiftSelectionModal } from "./GiftSelectionModal";
import { GiftRequestDialog } from "./GiftRequestDialog";
import { RechargeWalletModal } from "./RechargeWalletModal";
import { BalanceMonitor } from "./BalanceMonitor";
import { useWallet, USER_ID } from "@/hooks/useWallet";
import { useCallBalanceMonitor } from "@/hooks/useCallBalanceMonitor";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/lib/auth";
import { recordCallLog } from "@/lib/call-logs";
import { recordCallWalletTransaction } from "@/lib/wallet-transactions";
import { publishCallSignal, subscribeToCallSignals } from "@/lib/call-signaling";
import { publishGiftRequestSignal, subscribeToGiftRequestSignals, type GiftRequestSignal } from "@/lib/gift-requests";
import {
  createZegoRoomId,
  createZegoStreamId,
  fetchZegoToken,
  getZegoUserId,
  getZegoUserName,
} from "@/lib/zego";
import { updateCreatorStatus } from "@/lib/creator-status";
import type { ZegoExpressEngine } from "zego-express-engine-webrtc";

interface CallInterfaceProps {
  creatorName: string;
  creatorImage?: string;
  creatorId: string;
  pricePerMinute: number;
  callType?: "audio" | "video";
  onEndCall?: () => void;
  suppressOutgoingSignal?: boolean;
  callerName?: string;
  zegoUserIdOverride?: string;
  billingEnabled?: boolean;
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
  suppressOutgoingSignal = false,
  callerName,
  zegoUserIdOverride,
  billingEnabled = true,
}: CallInterfaceProps) {
  const [duration, setDuration] = useState(0);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [pendingGiftRequest, setPendingGiftRequest] = useState<GiftRequestSignal | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true); // BUG-028 FIX: Track call active state
  const [callEndedReason, setCallEndedReason] = useState<'user' | 'insufficient_balance' | 'negative_balance' | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isZegoConnected, setIsZegoConnected] = useState(false);
  const isCallBillable = connectionStatus === "Connected";
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const isEndingCallRef = useRef(false);
  const isRemoteEndRef = useRef(false);
  const zegoEngineRef = useRef<ZegoExpressEngine | null>(null);
  const zegoLocalStreamRef = useRef<MediaStream | null>(null);
  const zegoLocalStreamIsSdkRef = useRef(false);
  const zegoRemoteStreamIdsRef = useRef<Set<string>>(new Set());
  const zegoRoomIdRef = useRef(createZegoRoomId(creatorId));
  const zegoStreamIdRef = useRef("");
  const handledGiftRequestIdsRef = useRef<Set<string>>(new Set());
  const { balance } = useWallet();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // BUG-008 FIX: Track gift costs during the call
  const [totalGiftCost, setTotalGiftCost] = useState(0);

  // BALANCE MONITORING: Real-time balance monitoring with automatic disconnection
  const balanceMonitor = useCallBalanceMonitor(pricePerMinute, billingEnabled && isCallActive && isCallBillable, {
    warningThreshold: 50,
    criticalThreshold: 20,
    pollInterval: 2000,
    autoDisconnect: true,
    onDisconnect: (reason: 'insufficient_balance' | 'negative_balance') => {
      setCallEndedReason(reason);
      handleEndCall();
    },
  });
  const {
    updateDuration,
    updateGiftCost,
    resetMonitoring,
    liveBalance,
    remainingSeconds,
    isLowBalance,
    isCriticalBalance,
    isCallEndingSoon,
  } = balanceMonitor;
  const isCreatorSide = !billingEnabled;

  useEffect(() => {
    if (billingEnabled) return;

    updateCreatorStatus(creatorId, "on_call");
    return () => {
      updateCreatorStatus(creatorId, "available");
    };
  }, [billingEnabled, creatorId]);

  useEffect(() => {
    if (!billingEnabled || !isCallBillable) return;
    updateCreatorStatus(creatorId, "on_call");
  }, [billingEnabled, creatorId, isCallBillable]);

  // Only bill after the creator's remote stream is connected.
  useEffect(() => {
    if (!isCallActive || !isCallBillable) return;

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCallActive, isCallBillable]);

  // BALANCE MONITORING: Update duration in balance monitor
  useEffect(() => {
    if (isCallActive && isCallBillable) {
      updateDuration(duration);
    }
  }, [duration, isCallActive, isCallBillable, updateDuration]);

  useEffect(() => {
    if (!isCallActive) return;

    let disposed = false;

    const requestCallMedia = async () => {
      if (!window.isSecureContext) {
        throw new Error("Camera and microphone require HTTPS. Use localhost for testing or open the deployed app over HTTPS.");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera and microphone are not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      stream.getVideoTracks().forEach(track => {
        track.enabled = callType === "video" && isVideoEnabled;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicEnabled;
      });

      zegoLocalStreamRef.current = stream;
      zegoLocalStreamIsSdkRef.current = false;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    };

    const initializeZegoCall = async () => {
      let localStream: MediaStream | null = null;

      try {
        localStream = await requestCallMedia();
        if (disposed) return;

        const userId = (zegoUserIdOverride || getZegoUserId()).replace(/[^a-zA-Z0-9_-]/g, "_");
        const roomId = zegoRoomIdRef.current;
        const streamId = createZegoStreamId(roomId, userId);
        zegoStreamIdRef.current = streamId;

        if (!suppressOutgoingSignal) {
          publishCallSignal({
            id: `CALL_SIGNAL_${Date.now()}`,
            creatorId,
            creatorName,
            callerId: userId,
            callerName: callerName || getZegoUserName(),
            roomId,
            callType,
            pricePerMinute,
            createdAt: Date.now(),
            status: "ringing",
          });
        }

        const zegoConfig = await fetchZegoToken(roomId, userId);
        if (disposed) return;

        const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
        const engine = new ZegoExpressEngine(zegoConfig.appId, zegoConfig.serverUrl, { scenario: 0 });
        zegoEngineRef.current = engine;

        engine.on("roomStreamUpdate", async (_roomID, updateType, streamList) => {
          if (disposed || updateType !== "ADD") return;

          for (const stream of streamList) {
            if (stream.streamID === streamId || zegoRemoteStreamIdsRef.current.has(stream.streamID)) {
              continue;
            }

            try {
              const remoteStream = await engine.startPlayingStream(stream.streamID);
              zegoRemoteStreamIdsRef.current.add(stream.streamID);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setConnectionStatus("Connected");
            } catch (error) {
              console.error("ZEGOCLOUD remote stream error:", error);
            }
          }
        });

        await engine.loginRoom(roomId, zegoConfig.token, {
          userID: userId,
          userName: getZegoUserName(),
        });

        if (disposed) {
          return;
        }

        localStream.getTracks().forEach((track) => track.stop());
        if (localVideoRef.current?.srcObject === localStream) {
          localVideoRef.current.srcObject = null;
        }

        const zegoStream = await engine.createStream({
          camera: {
            video: callType === "video",
            audio: true,
            videoQuality: 2,
            facingMode: "user",
          },
        });

        if (disposed) {
          engine.destroyStream(zegoStream);
          return;
        }

        localStream = zegoStream;
        zegoLocalStreamRef.current = zegoStream;
        zegoLocalStreamIsSdkRef.current = true;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = zegoStream;
        }

        zegoStream.getVideoTracks().forEach(track => {
          track.enabled = callType === "video" && isVideoEnabled;
        });
        zegoStream.getAudioTracks().forEach(track => {
          track.enabled = isMicEnabled;
        });

        engine.startPublishingStream(streamId, zegoStream, { roomID: roomId });
        setIsZegoConnected(true);
        setConnectionStatus("Waiting for creator...");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "ZEGOCLOUD is not available yet.";
        const isProviderRateLimit = /too many requests|rate.?limit|429/i.test(errorMessage);
        console.warn("ZEGOCLOUD initialization fell back to demo mode:", error);
        setIsZegoConnected(false);
        setConnectionStatus("Demo call mode");
        if (!isProviderRateLimit) {
          toast({
            title: "Call connected in demo mode",
            description: errorMessage,
          });
        }

        const hasLiveLocalStream = localStream?.getTracks().some((track) => track.readyState === "live");
        if (!hasLiveLocalStream && callType === "video") {
          try {
            await requestCallMedia();
          } catch (mediaError) {
            toast({
              title: "Camera/Mic Access",
              description: mediaError instanceof Error ? mediaError.message : "Please allow camera and microphone access for calls.",
              variant: "destructive",
            });
          }
        }
      }
    };

    initializeZegoCall();

    return () => {
      disposed = true;
      cleanupZegoCall();
    };
  }, []);

  useEffect(() => {
    return subscribeToCallSignals((call) => {
      if (call.status !== "ended") return;
      if (call.roomId !== zegoRoomIdRef.current) return;
      if (isEndingCallRef.current) return;

      isRemoteEndRef.current = true;
      handleEndCall();
    });
  }, []);

  useEffect(() => {
    return subscribeToGiftRequestSignals((request) => {
      if (request.roomId !== zegoRoomIdRef.current) return;

      if (request.status === "requested" && billingEnabled) {
        if (handledGiftRequestIdsRef.current.has(request.id)) return;
        handledGiftRequestIdsRef.current.add(request.id);
        setPendingGiftRequest(request);
        return;
      }

      if (request.status === "accepted" && isCreatorSide) {
        if (handledGiftRequestIdsRef.current.has(`${request.id}:accepted`)) return;
        handledGiftRequestIdsRef.current.add(`${request.id}:accepted`);
        setTotalGiftCost((previous) => previous + request.giftAmount * request.quantity);
        toast({
          title: "Gift Accepted",
          description: `${request.giftName} accepted. User balance: ₹${Number(request.walletBalance ?? 0).toFixed(2)}`,
        });
      }

      if (request.status === "rejected" && isCreatorSide) {
        if (handledGiftRequestIdsRef.current.has(`${request.id}:rejected`)) return;
        handledGiftRequestIdsRef.current.add(`${request.id}:rejected`);
        toast({
          title: "Gift Rejected",
          description: `${request.giftName} was rejected by the user.`,
          variant: "destructive",
        });
      }
    });
  }, [billingEnabled, isCreatorSide, toast]);

  useEffect(() => {
    if (!isCallActive) return;

    const pollGiftRequests = async () => {
      try {
        const response = await fetch(`/api/gift-requests/room/${zegoRoomIdRef.current}`, {
          credentials: "include",
        });
        if (!response.ok) return;

        const requests = (await response.json()) as GiftRequestSignal[];
        for (const request of requests) {
          if (request.status === "requested" && billingEnabled && !handledGiftRequestIdsRef.current.has(request.id)) {
            handledGiftRequestIdsRef.current.add(request.id);
            setPendingGiftRequest(request);
            break;
          }

          if (request.status === "accepted" && isCreatorSide && !handledGiftRequestIdsRef.current.has(`${request.id}:accepted`)) {
            handledGiftRequestIdsRef.current.add(`${request.id}:accepted`);
            setTotalGiftCost((previous) => previous + request.giftAmount * request.quantity);
            toast({
              title: "Gift Accepted",
              description: `${request.giftName} accepted. User balance: ₹${Number(request.walletBalance ?? 0).toFixed(2)}`,
            });
          }

          if (request.status === "rejected" && isCreatorSide && !handledGiftRequestIdsRef.current.has(`${request.id}:rejected`)) {
            handledGiftRequestIdsRef.current.add(`${request.id}:rejected`);
            toast({
              title: "Gift Rejected",
              description: `${request.giftName} was rejected by the user.`,
              variant: "destructive",
            });
          }
        }
      } catch {
        // Local BroadcastChannel still handles same-browser testing if polling misses.
      }
    };

    pollGiftRequests();
    const timer = window.setInterval(pollGiftRequests, 2500);
    return () => window.clearInterval(timer);
  }, [billingEnabled, isCallActive, isCreatorSide, toast]);

  const cleanupZegoCall = useCallback(() => {
    const engine = zegoEngineRef.current;
    const streamId = zegoStreamIdRef.current;
    const roomId = zegoRoomIdRef.current;

    if (engine) {
      try {
        if (streamId) {
          engine.stopPublishingStream(streamId);
        }
        zegoRemoteStreamIdsRef.current.forEach((remoteStreamId) => {
          engine.stopPlayingStream(remoteStreamId);
        });
        if (zegoLocalStreamRef.current) {
          if (zegoLocalStreamIsSdkRef.current) {
            engine.destroyStream(zegoLocalStreamRef.current);
          } else {
            zegoLocalStreamRef.current.getTracks().forEach((track) => track.stop());
          }
        }
        engine.logoutRoom(roomId);
        engine.destroyEngine();
      } catch (error) {
        console.warn("ZEGOCLOUD cleanup failed:", error);
      }
    }

    zegoEngineRef.current = null;
    zegoLocalStreamRef.current = null;
    zegoLocalStreamIsSdkRef.current = false;
    zegoRemoteStreamIdsRef.current.clear();

    [localVideoRef.current, remoteVideoRef.current].forEach((videoElement) => {
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    });
  }, []);

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
  const meteredCallCost = billableMinutes * pricePerMinute;
  const callCost = billingEnabled ? meteredCallCost : 0;

  // Gifts are charged immediately by the gift API. Call end only deducts call minutes.
  const totalCost = callCost;
  const displayedSessionCost = callCost + totalGiftCost;
  const creatorViewLiveBalance = Math.max(0, balance - meteredCallCost - totalGiftCost);
  const displayLiveBalance = isCreatorSide ? creatorViewLiveBalance : liveBalance;
  const displayCallCost = isCreatorSide ? meteredCallCost : callCost;
  const displaySessionCost = displayCallCost + totalGiftCost;

  // BUG-008 FIX: Handler for when a gift is sent during a call
  const handleGiftSent = useCallback((giftCost: number) => {
    setTotalGiftCost(prev => prev + giftCost);
    updateGiftCost(giftCost);
    toast({
      title: "Gift Sent!",
      description: `₹${giftCost} has been deducted from your wallet.`,
    });
  }, [toast, updateGiftCost]);

  const handleGiftRequested = useCallback(async (gift: { id: string; name: string; amount: number; quantity: number }) => {
    try {
      const response = await apiRequest("POST", "/api/gift-requests", {
        roomId: zegoRoomIdRef.current,
        creatorId,
        creatorName,
        requesterId: zegoUserIdOverride || `creator_${creatorId}`,
        requesterName: creatorName,
        userId: USER_ID,
        giftId: gift.id,
        quantity: gift.quantity,
      });
      const request = await response.json();
      publishGiftRequestSignal(request);

      toast({
        title: "Gift Request Sent",
        description: `${request.giftName || gift.name} request sent to user for ₹${Number(request.totalAmount || gift.amount).toFixed(2)}.`,
      });
    } catch (error: any) {
      toast({
        title: "Gift Request Failed",
        description: error.message || "Unable to request this gift.",
        variant: "destructive",
      });
    }
  }, [creatorId, creatorName, creatorViewLiveBalance, toast, zegoUserIdOverride]);

  const initials = (creatorName || "")
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const endCallMutation = useMutation({
    mutationFn: async (callData: { userId: string; userName: string; creatorId: string; creatorName: string; callType: string; durationSeconds: number; pricePerMinute: number; callCost: number; giftCost: number; totalCost: number }) => {
      const response = await apiRequest("POST", "/api/wallet/deduct-call", callData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      localStorage.setItem("linky_first_call_completed", "true");
    },
  });

  const finishCallLocally = useCallback((deductLocally: boolean) => {
    const transactionId = `CALL${Date.now()}`;
    updateCreatorStatus(creatorId, "available");

    // Do not locally debit after a server failure. The server wallet is the
    // source of truth, and local fallback debits caused negative balances.

    const userId = localStorage.getItem("linky_device_id") || "user_001";
    const storedUser = localStorage.getItem("auth_user");
    let userName = "User";
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        userName = parsedUser.username || parsedUser.phone || parsedUser.userId || userName;
      } catch {
        userName = localStorage.getItem("linky_username") || userName;
      }
    } else {
      userName = localStorage.getItem("linky_username") || userName;
    }

    recordCallLog({
      id: transactionId,
      userId,
      userName,
      creatorId,
      creatorName,
      callType,
      durationSeconds: duration,
      pricePerMinute,
      callCost,
      giftCost: totalGiftCost,
      totalCost: displayedSessionCost,
      creatorEarnings: displayedSessionCost,
    });

    if (billingEnabled && totalCost > 0) {
      recordCallWalletTransaction({
        transactionId,
        amount: totalCost,
        creatorName,
        callType,
      });
    }

    if (billingEnabled) {
      localStorage.setItem("linky_first_call_completed", "true");
    }

    let description: string;

    if (callEndedReason === 'negative_balance') {
      description = `Call ended due to insufficient balance. Cost: ₹${totalCost.toFixed(2)}`;
    } else if (callEndedReason === 'insufficient_balance') {
      description = `Call ended as balance reached zero. Cost: ₹${totalCost.toFixed(2)}`;
    } else {
      const costBreakdown = totalGiftCost > 0
        ? `Call: ₹${callCost} + Gifts: ₹${totalGiftCost} = ₹${displayedSessionCost}`
        : `₹${totalCost}`;
      description = billingEnabled
        ? `${costBreakdown} has been deducted from your wallet.`
        : "Call ended. User-side billing is handled from the user app.";
    }

    toast({
      title: "Call Ended",
      description,
      variant: callEndedReason ? "destructive" : "default",
    });

    onEndCall?.();
    if (!onEndCall) {
      setLocation("/user");
    }
  }, [billingEnabled, callCost, callEndedReason, callType, creatorId, creatorName, displayedSessionCost, duration, onEndCall, pricePerMinute, setLocation, toast, totalCost, totalGiftCost]);

  const handleEndCall = () => {
    if (isEndingCallRef.current) return;
    isEndingCallRef.current = true;

    // BUG-028 FIX: Stop the timer when call ends
    setIsCallActive(false);
    cleanupZegoCall();

    if (!isRemoteEndRef.current) {
      publishCallSignal({
        id: `CALL_SIGNAL_END_${Date.now()}`,
        creatorId,
        creatorName,
        callerId: zegoUserIdOverride || getZegoUserId(),
        callerName: callerName || getZegoUserName(),
        roomId: zegoRoomIdRef.current,
        callType,
        pricePerMinute,
        createdAt: Date.now(),
        status: "ended",
      });
    }

    let userId = localStorage.getItem("linky_device_id");
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem("linky_device_id", userId);
    }

    // BALANCE MONITORING: Reset monitoring state
    resetMonitoring();

    // BUG-008 FIX: Include both call cost and gift cost in the total
    if (!billingEnabled) {
      finishCallLocally(false);
      return;
    }

    const storedUser = localStorage.getItem("auth_user");
    let userName = localStorage.getItem("linky_username") || "User";
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        userName = parsedUser.username || parsedUser.phone || parsedUser.userId || userName;
      } catch {
        // Keep local fallback.
      }
    }

    endCallMutation.mutate(
      {
        userId: userId || generateUUID(), // Fallback to generated UUID if null
        userName,
        creatorId,
        creatorName,
        callType,
        durationSeconds: duration,
        pricePerMinute,
        callCost,
        giftCost: totalGiftCost,
        totalCost,
      },
      {
        onSuccess: () => {
          finishCallLocally(false);
        },
        onError: () => {
          finishCallLocally(false);
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
        mode={isCreatorSide ? "request" : "send"}
        onGiftRequested={handleGiftRequested}
      />
      <GiftRequestDialog
        request={pendingGiftRequest}
        liveBalance={displayLiveBalance}
        onClose={() => setPendingGiftRequest(null)}
        onAccepted={handleGiftSent}
        onRechargeRequired={() => setShowRechargeModal(true)}
      />
      <RechargeWalletModal open={showRechargeModal} onOpenChange={setShowRechargeModal} />
      {/* FIX: Add safe area insets for Android to prevent UI overlapping with system status bar */}
      <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-primary/20 via-background to-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Video Call Layout */}
        {callType === "video" ? (
          <>
            {/* BUG-040 FIX: Add accessibility attributes to video elements */}
            {/* BUG-049 FIX: Make video layout responsive */}
            {/* Remote video (creator) - Full screen */}
            <div className="flex-1 min-h-0 relative bg-black">
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
                    <Badge variant="secondary" className={`border-white/30 text-xs sm:text-sm ${isCallBillable ? "bg-green-500/20 text-green-100" : "bg-amber-500/20 text-amber-100"}`}>
                      {connectionStatus}
                    </Badge>
                    <span className="text-xl sm:text-2xl font-bold tabular-nums">{formatTime(duration)}</span>
                    <span className="text-xs sm:text-sm">₹{pricePerMinute}/min</span>
                  </div>
                  {/* BUG-006 FIX: Display billing policy */}
                  <div className="text-[10px] sm:text-xs text-white/70 mt-1">
                    {isCallBillable ? BILLING_POLICY.description : "Billing starts only after the creator connects."}
                  </div>
                  {isCreatorSide && (
                    <div className="mt-2 flex items-center justify-between rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white">
                      <span className="text-xs text-white/70">User live balance</span>
                      <span className="text-sm font-bold tabular-nums">₹{displayLiveBalance.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BUG-040 FIX: Add accessibility attributes to video controls */}
            {/* BUG-049 FIX: Make video controls responsive */}
            {/* FIX: Video controls with safe area handling for bottom navigation bar */}
            <div className="relative z-[70] shrink-0 bg-black/80 backdrop-blur-sm p-3 sm:p-4 pb-6 sm:pb-8" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 16px)' }}>
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
                  <span className="hidden sm:inline">{isCreatorSide ? "Request Gift" : "Send Gift"}</span>
                  <span className="sm:hidden">{isCreatorSide ? "Request" : "Gift"}</span>
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
                  liveBalance={displayLiveBalance}
                  remainingSeconds={remainingSeconds}
                  isLowBalance={isLowBalance}
                  isCriticalBalance={isCriticalBalance}
                  isCallEndingSoon={isCallEndingSoon}
                  totalCost={displaySessionCost}
                  callCost={displayCallCost}
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
              <div className="mb-6 flex items-center gap-2">
                <Badge variant="secondary">Audio Call</Badge>
                <Badge variant={isCallBillable ? "default" : "outline"}>{connectionStatus}</Badge>
              </div>

              <div className="text-4xl font-bold mb-2 tabular-nums">{formatTime(duration)}</div>
              <p className="text-muted-foreground mb-8">
                ₹{pricePerMinute}/min • Cost: ₹{displaySessionCost}
              </p>

              {/* BUG-006 FIX: Display billing policy */}
              <div className="text-xs text-muted-foreground mb-4">
                {isCallBillable ? BILLING_POLICY.description : "Billing starts only after the creator connects."}
              </div>

              {/* BUG-008 FIX: Show cost breakdown when gifts are sent */}
              {totalGiftCost > 0 && (
                <div className="text-sm text-muted-foreground mb-4">
                  Call: ₹{displayCallCost} + Gifts: ₹{totalGiftCost}
                </div>
              )}

              {/* BALANCE MONITORING: Enhanced balance display with warnings */}
              <div className="mb-8">
                <BalanceMonitor
                  liveBalance={displayLiveBalance}
                  remainingSeconds={remainingSeconds}
                  isLowBalance={isLowBalance}
                  isCriticalBalance={isCriticalBalance}
                  isCallEndingSoon={isCallEndingSoon}
                  totalCost={displaySessionCost}
                  callCost={displayCallCost}
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
                  {isCreatorSide ? "Request Gift" : "Send Gift"}
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
