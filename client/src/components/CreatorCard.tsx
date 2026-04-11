import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { STATUS_COLORS } from "@/lib/config";

interface CreatorCardProps {
  id: string;
  name: string;
  image?: string;
  price: number;
  country: string;
  followers: number;
  isOnline?: boolean;
  onClick?: () => void;
}

export const CreatorCard = memo(function CreatorCard({
  name,
  image,
  price,
  country,
  followers,
  isOnline = false,
  onClick,
}: CreatorCardProps) {
  const initials = (name || "")
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all"
      onClick={onClick}
      data-testid="card-creator"
      role="button"
      tabIndex={0}
      aria-label={`View ${name}'s profile`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="relative aspect-[3/4]">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage src={image} alt={name} className="object-cover" />
          <AvatarFallback className="rounded-none text-lg mobile-m:text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-2 mobile-m:top-3 right-2 mobile-m:right-3">
          {/* BUG-034 FIX: Use CSS variables for status colors */}
          <div
            className={`w-2.5 h-2.5 mobile-m:w-3 mobile-m:h-3 rounded-full border-2 border-white ${isOnline ? STATUS_COLORS.ONLINE : STATUS_COLORS.OFFLINE
              }`}
            aria-label={isOnline ? "Online" : "Offline"}
            role="status"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 mobile-m:p-3 mobile-l:p-4 text-white">
          <h3 className="font-semibold text-sm mobile-m:text-base mobile-l:text-lg mb-1">{name}</h3>
          <div className="flex items-center justify-between gap-1 mobile-m:gap-2">
            <div className="flex items-center gap-1 mobile-m:gap-2 text-xs mobile-m:text-sm text-white/90">
              <span className="truncate" aria-label={`Country: ${country}`}>{country}</span>
              <span className="hidden mobile-m:inline" aria-hidden="true">•</span>
              <div className="flex items-center gap-0.5 mobile-m:gap-1" aria-label={`${followers} followers`}>
                <Users className="w-2.5 h-2.5 mobile-m:w-3 mobile-m:h-3" aria-hidden="true" />
                <span className="text-xs mobile-m:text-sm">{followers}</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs mobile-m:text-sm px-1.5 mobile-m:px-2 py-0.5" aria-label={`Price: ₹${price} per minute`}>
              ₹{price}/min
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
});
