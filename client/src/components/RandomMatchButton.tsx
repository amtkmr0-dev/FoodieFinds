import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { Shuffle } from "lucide-react";
import { useLocation } from "wouter";

export function RandomMatchButton() {
  const [, setLocation] = useLocation();
  const [showButton, setShowButton] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRandomMatch = () => {
    setShowIncomingCall(true);
  };

  return (
    <>
      <Button
        size="lg"
        className={`fixed left-1/2 -translate-x-1/2 shadow-2xl transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 ${
          showButton 
            ? 'bottom-6 opacity-100 scale-100' 
            : '-bottom-20 opacity-0 scale-90 pointer-events-none'
        }`}
        style={{ zIndex: 9999 }}
        onClick={handleRandomMatch}
        data-testid="button-random-match"
      >
        <Shuffle className="w-5 h-5 mr-2" />
        Random Match
      </Button>

      {showIncomingCall && (
        <IncomingCallModal
          callerName="Random Match"
          pricePerMinute={45}
          onAccept={() => {
            setShowIncomingCall(false);
            setLocation("/user/recharge");
          }}
          onReject={() => setShowIncomingCall(false)}
        />
      )}
    </>
  );
}
