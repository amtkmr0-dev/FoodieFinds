import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface PrivacyWarningModalProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function PrivacyWarningModal({ onAccept, onCancel }: PrivacyWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-xl font-semibold">Privacy Notice</h3>
        </div>
        
        <div className="space-y-3 mb-6 text-muted-foreground">
          <p className="text-sm">
            ⚠️ <strong>Important:</strong> For your safety and privacy, please note:
          </p>
          <ul className="text-sm space-y-2 ml-4 list-disc">
            <li>Creators should NOT share personal details like phone numbers, addresses, or social media</li>
            <li>Keep all conversations within the platform</li>
            <li>Report any inappropriate behavior immediately</li>
            <li>This call is charged at the displayed per-minute rate</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-call">
            Cancel
          </Button>
          <Button className="flex-1" onClick={onAccept} data-testid="button-accept-privacy">
            I Understand, Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
