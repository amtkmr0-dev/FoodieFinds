import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { Shuffle } from "lucide-react";
import { useLocation } from "wouter";
import { creatorsData, type Creator } from "@/lib/creatorsData";

export function RandomMatchButton() {
  const [, setLocation] = useLocation();
  const [showButton, setShowButton] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [matchedCreator, setMatchedCreator] = useState<Creator | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRandomMatch = () => {
    // BUG-013 FIX: Select a random creator with randomMatchEnabled
    const eligibleCreators = creatorsData.filter(
      (creator) => creator.isOnline && creator.randomMatchEnabled
    );

    if (eligibleCreators.length === 0) {
      // No creators available - show toast or handle gracefully
      return;
    }

    const randomCreator = eligibleCreators[Math.floor(Math.random() * eligibleCreators.length)];
    setMatchedCreator(randomCreator);
    setShowIncomingCall(true);
  };

  return (
    <>
      <Button
        size="lg"
        className={`fixed left-1/2 z-40 -translate-x-1/2 shadow-2xl transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 ${showButton
          ? 'bottom-6 opacity-100 scale-100'
          : '-bottom-20 opacity-0 scale-90 pointer-events-none'
          }`}
        onClick={handleRandomMatch}
        data-testid="button-random-match"
      >
        <Shuffle className="w-5 h-5 mr-2" />
        Random Match
      </Button>

      {showIncomingCall && matchedCreator && (
        <IncomingCallModal
          callerName={matchedCreator.name}
          pricePerMinute={matchedCreator.price}
          callType={matchedCreator.allowedCallTypes === "audio" ? "audio" : "video"}
          isOutgoing={true}
          onAccept={() => {
            setShowIncomingCall(false);
            // BUG-013 FIX: Navigate to call page instead of recharge
            const callType = matchedCreator.allowedCallTypes === "audio" ? "audio" : "video";
            setLocation(`/user/call/${matchedCreator.id}?randomMatch=true&callType=${callType}`);
          }}
          onReject={() => {
            setShowIncomingCall(false);
            setMatchedCreator(null);
          }}
        />
      )}
    </>
  );
}
