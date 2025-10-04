import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, UserPlus, MapPin, Users } from "lucide-react";

interface CreatorProfileHeaderProps {
  name: string;
  image?: string;
  country: string;
  followers: number;
  price: number;
  isFollowing?: boolean;
  isOnline?: boolean;
  onTalkNow?: () => void;
  onFollow?: () => void;
}

export function CreatorProfileHeader({
  name,
  image,
  country,
  followers,
  price,
  isFollowing = false,
  isOnline = false,
  onTalkNow,
  onFollow,
}: CreatorProfileHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 border-b">
      <div className="flex gap-4 mb-6">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
              isOnline ? "bg-status-online" : "bg-status-offline"
            }`}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{name}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="gap-1">
              <MapPin className="w-3 h-3" />
              {country}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {followers} followers
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onTalkNow}
          data-testid="button-talk-now"
        >
          <Phone className="w-4 h-4 mr-2" />
          Talk Now - ₹{price}/min
        </Button>
        <Button
          variant={isFollowing ? "secondary" : "outline"}
          onClick={onFollow}
          data-testid="button-follow"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
    </div>
  );
}
