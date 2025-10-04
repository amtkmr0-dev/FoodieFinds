import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

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

export function CreatorCard({
  name,
  image,
  price,
  country,
  followers,
  isOnline = false,
  onClick,
}: CreatorCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all"
      onClick={onClick}
      data-testid="card-creator"
    >
      <div className="relative aspect-[3/4]">
        <Avatar className="w-full h-full rounded-none">
          <AvatarImage src={image} alt={name} className="object-cover" />
          <AvatarFallback className="rounded-none text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-3 right-3">
          <div
            className={`w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? "bg-status-online" : "bg-status-offline"
            }`}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-lg mb-1">{name}</h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span>{country}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{followers}</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              ₹{price}/min
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
