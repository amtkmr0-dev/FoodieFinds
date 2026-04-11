import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, X, Video, Phone as PhoneIcon } from "lucide-react";

interface IncomingCallModalProps {
  callerName: string;
  callerImage?: string;
  pricePerMinute: number;
  onAccept?: () => void;
  onReject?: () => void;
  callType?: "audio" | "video"; // "audio" or "video" call type
  isOutgoing?: boolean; // true for outgoing calls (Random Match), false for incoming calls
  showRejectConfirmation?: boolean; // true to show confirmation dialog on reject (for creators)
}

export function IncomingCallModal({
  callerName,
  callerImage,
  pricePerMinute,
  onAccept,
  onReject,
  callType = "audio",
  isOutgoing = false,
  showRejectConfirmation = false,
}: IncomingCallModalProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus accept button when modal opens
  useEffect(() => {
    if (!isOutgoing && acceptButtonRef.current) {
      acceptButtonRef.current.focus();
    } else if (isOutgoing && rejectButtonRef.current) {
      rejectButtonRef.current.focus();
    }
  }, [isOutgoing]);

  const initials = (callerName || "")
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleRejectClick = () => {
    if (showRejectConfirmation) {
      setShowRejectDialog(true);
    } else {
      onReject?.();
    }
  };

  const handleConfirmReject = () => {
    setShowRejectDialog(false);
    onReject?.();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 mobile-m:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-modal-title"
        aria-describedby="call-modal-description"
      >
        <div className="bg-card rounded-2xl mobile-m:rounded-3xl p-6 mobile-m:p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <Avatar className="w-20 h-20 mobile-m:w-24 mobile-m:h-24 mx-auto mb-3 mobile-m:mb-4 ring-4 ring-primary/20">
            <AvatarImage src={callerImage} alt={`${callerName}'s profile picture`} />
            <AvatarFallback className="text-xl mobile-m:text-2xl" aria-hidden="true">{initials}</AvatarFallback>
          </Avatar>

          <h3 id="call-modal-title" className="text-lg mobile-m:text-xl font-semibold mb-1">{callerName}</h3>
          <div className="flex items-center justify-center gap-2 mb-2">
            {callType === "video" ? (
              <Video className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <PhoneIcon className="w-4 h-4 text-primary" aria-hidden="true" />
            )}
            <p id="call-modal-description" className="text-sm mobile-m:text-base text-muted-foreground">
              {isOutgoing ? "Ringing..." : "Incoming call"}
            </p>
          </div>
          <p className="text-xs mobile-m:text-sm text-muted-foreground mb-6 mobile-m:mb-8" aria-live="polite">
            {callType === "video" ? "Video" : "Audio"} Call • ₹{pricePerMinute}/min
          </p>

          <div className="flex gap-3 mobile-m:gap-4 justify-center">
            {isOutgoing ? (
              // For outgoing calls (Random Match) - only show hang up button
              <Button
                ref={rejectButtonRef}
                variant="destructive"
                size="icon"
                className="w-14 h-14 mobile-m:w-16 mobile-m:h-16 rounded-full"
                onClick={onReject}
                data-testid="button-hang-up"
                aria-label="Hang up call"
              >
                <X className="w-5 h-5 mobile-m:w-6 mobile-m:h-6" aria-hidden="true" />
              </Button>
            ) : (
              // For incoming calls - show reject and accept buttons
              <>
                <Button
                  ref={rejectButtonRef}
                  variant="destructive"
                  size="icon"
                  className="w-14 h-14 mobile-m:w-16 mobile-m:h-16 rounded-full"
                  onClick={handleRejectClick}
                  data-testid="button-reject-call"
                  aria-label="Reject call"
                >
                  <X className="w-5 h-5 mobile-m:w-6 mobile-m:h-6" aria-hidden="true" />
                </Button>
                <Button
                  ref={acceptButtonRef}
                  className="w-14 h-14 mobile-m:w-16 mobile-m:h-16 rounded-full bg-success hover:bg-success/90"
                  onClick={onAccept}
                  data-testid="button-accept-call"
                  aria-label="Accept call"
                >
                  <Phone className="w-5 h-5 mobile-m:w-6 mobile-m:h-6" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {showRejectConfirmation && (
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Call?</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this {callType === "video" ? "video" : "audio"} call from {callerName}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmReject}>
                Reject Call
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
