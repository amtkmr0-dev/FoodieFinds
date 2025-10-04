import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, X } from "lucide-react";

interface IncomingCallModalProps {
  callerName: string;
  callerImage?: string;
  pricePerMinute: number;
  onAccept?: () => void;
  onReject?: () => void;
}

export function IncomingCallModal({
  callerName,
  callerImage,
  pricePerMinute,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const initials = callerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
        <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/20">
          <AvatarImage src={callerImage} alt={callerName} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <h3 className="text-xl font-semibold mb-1">{callerName}</h3>
        <p className="text-muted-foreground mb-6">Incoming call</p>
        <p className="text-sm text-muted-foreground mb-8">₹{pricePerMinute}/min</p>

        <div className="flex gap-4 justify-center">
          <Button
            variant="destructive"
            size="icon"
            className="w-16 h-16 rounded-full"
            onClick={onReject}
            data-testid="button-reject-call"
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            className="w-16 h-16 rounded-full bg-success hover:bg-success/90"
            onClick={onAccept}
            data-testid="button-accept-call"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
