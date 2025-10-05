import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, UserPlus, MapPin, Users, Languages, MessageCircle } from "lucide-react";

interface CreatorProfileHeaderProps {
  name: string;
  image?: string;
  country: string;
  followers: number;
  price: number;
  languages?: string[];
  isFollowing?: boolean;
  isOnline?: boolean;
  onTalkNow?: () => void;
  onFollow?: () => void;
  onChat?: () => void;
}

export function CreatorProfileHeader({
  name,
  image,
  country,
  followers,
  price,
  languages = ["English", "Hindi"],
  isFollowing = false,
  isOnline = false,
  onTalkNow,
  onFollow,
  onChat,
}: CreatorProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 border-b bg-gradient-to-b from-primary/5 to-background">
      <div className="flex gap-4 mb-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-background ${
              isOnline ? "bg-status-online" : "bg-status-offline"
            }`}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Badge 
              variant={isOnline ? "default" : "secondary"} 
              className={isOnline ? "bg-status-online hover:bg-status-online" : ""}
              data-testid="badge-status"
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="gap-1">
              <Languages className="w-3 h-3" />
              {languages.join(", ")}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              🇮🇳 {country}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {followers} followers
            </Badge>
          </div>
        </div>
      </div>

      <Button
        variant={isFollowing ? "secondary" : "default"}
        className={`w-full mb-3 ${!isFollowing ? "animate-pulse" : ""}`}
        onClick={onFollow}
        data-testid="button-follow"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {isFollowing ? "Following" : "Follow"}
      </Button>
      
      {!isFollowing && (
        <p className="text-xs text-center text-muted-foreground mb-4">
          Follow to get update when {name.split(" ")[0]} comes online
        </p>
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onChat}
          data-testid="button-chat"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Say Hello
        </Button>
        <Button
          className="flex-1"
          onClick={onTalkNow}
          disabled={!isOnline}
          data-testid="button-talk-now"
        >
          <Phone className="w-4 h-4 mr-2" />
          {isOnline ? `Talk Now - ₹${price}/min` : "Offline"}
        </Button>
      </div>
      {!isOnline && (
        <p className="text-xs text-center text-muted-foreground mt-3" data-testid="text-offline-notice">
          This creator is offline. You can send them a message and they'll respond when online.
        </p>
      )}
    </div>
  );
}
