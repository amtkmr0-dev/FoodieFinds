import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface ApprovalItemProps {
  id: string;
  creatorName: string;
  creatorImage?: string;
  type: "profile" | "kyc" | "bank" | "price";
  status: "pending" | "approved" | "rejected";
  details: string;
  timestamp: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ApprovalItem({
  creatorName,
  creatorImage,
  type,
  status,
  details,
  timestamp,
  onApprove,
  onReject,
}: ApprovalItemProps) {
  const initials = creatorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const typeLabels = {
    profile: "Profile Update",
    kyc: "KYC Verification",
    bank: "Bank Details",
    price: "Price Change",
  };

  const statusColors = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  } as const;

  return (
    <div className="flex items-center gap-4 p-4 border-b hover-elevate" data-testid="item-approval">
      <Avatar>
        <AvatarImage src={creatorImage} alt={creatorName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold truncate">{creatorName}</h4>
          <Badge variant="secondary" className="text-xs">
            {typeLabels[type]}
          </Badge>
          <Badge
            variant={statusColors[status] === "warning" ? "outline" : statusColors[status] as any}
            className="text-xs"
          >
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate">{details}</p>
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      </div>

      {status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-success hover:bg-success/90"
            onClick={onApprove}
            data-testid="button-approve"
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onReject}
            data-testid="button-reject"
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
