import { useState } from "react";
import { CreatorProfileHeader } from "@/components/CreatorProfileHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatorProfile() {
  const [, setLocation] = useLocation();
  const [isFollowing, setIsFollowing] = useState(false);

  const profileImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/user")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <CreatorProfileHeader
          name="Sarah Johnson"
          country="India"
          followers={1250}
          price={45}
          isOnline={true}
          isFollowing={isFollowing}
          onTalkNow={() => setLocation("/user/call")}
          onFollow={() => setIsFollowing(!isFollowing)}
        />

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-3">About Me</h3>
            <p className="text-muted-foreground">
              I love connecting with people and having meaningful conversations. 
              Whether you want to discuss life, share experiences, or just chat about your day, I'm here to listen.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Talks About</h3>
            <div className="flex flex-wrap gap-2">
              {["Life Advice", "Career", "Relationships", "Mental Health"].map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Hobbies</h3>
            <div className="flex flex-wrap gap-2">
              {["Reading", "Yoga", "Traveling", "Cooking"].map((hobby) => (
                <span
                  key={hobby}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Food Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {["Vegetarian", "Indian Cuisine", "Italian"].map((food) => (
                <span
                  key={food}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Sports Interests</h3>
            <div className="flex flex-wrap gap-2">
              {["Cricket", "Badminton", "Swimming"].map((sport) => (
                <span
                  key={sport}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm"
                >
                  {sport}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              {profileImages.map((img, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                  <img src={img} alt={`Profile ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/user/blocked")}
            data-testid="button-blocked-list"
          >
            <Lock className="w-4 h-4 mr-2" />
            View Blocked List
          </Button>
        </div>
      </main>
    </div>
  );
}
