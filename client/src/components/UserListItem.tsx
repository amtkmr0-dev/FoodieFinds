import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Ban } from "lucide-react";

interface UserListItemProps {
  id: string;
  name: string;
  phone: string;
  image?: string;
  balance: number;
  status?: "active" | "blocked";
  lastSeen?: string;
  onChat?: () => void;
  onBlock?: () => void;
}

export const UserListItem = memo(function UserListItem({
  name,
  phone,
  image,
  balance,
  status = "active",
  lastSeen,
  onChat,
  onBlock,
}: UserListItemProps) {
  const initials = (name || "")
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4 p-4 border-b hover-elevate" data-testid="item-user">
      <Avatar>
        <AvatarImage src={image} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold truncate">{name}</h4>
          {status === "blocked" && (
            <Badge variant="destructive" className="text-xs">Blocked</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{phone}</p>
        {lastSeen && (
          <p className="text-xs text-muted-foreground mt-1">Last seen: {lastSeen}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right mr-2">
          <p className="text-sm font-semibold">₹{balance}</p>
          <p className="text-xs text-muted-foreground">Balance</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onChat}
          data-testid="button-chat"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBlock}
          data-testid="button-block"
        >
          <Ban className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});
