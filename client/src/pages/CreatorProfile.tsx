import { useState } from "react";
import { CreatorProfileHeader } from "@/components/CreatorProfileHeader";
import { PrivacyWarningModal } from "@/components/PrivacyWarningModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, Play } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CreatorProfile() {
  const [, setLocation] = useLocation();
  const { id: creatorId } = useParams<{ id: string }>();
  const [isFollowing, setIsFollowing] = useState(() => {
    const followedCreators = JSON.parse(localStorage.getItem("followedCreators") || "[]");
    return followedCreators.includes(creatorId);
  });
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const { toast } = useToast();
  const currentBalance = 450;
  const pricePerMinute = 45;
  const minBalance = pricePerMinute * 3;

  const handleTalkNow = () => {
    if (currentBalance < minBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need minimum ₹${minBalance} (3 minutes) to initiate a call. Please recharge.`,
        variant: "destructive",
      });
      setLocation("/user/recharge");
      return;
    }
    setShowPrivacyWarning(true);
  };

  const handleAcceptPrivacy = () => {
    setShowPrivacyWarning(false);
    setLocation("/user/call");
  };

  const handleChat = () => {
    setLocation("/user/support");
  };

  const handleFollow = () => {
    if (!creatorId) return;
    
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);
    
    // Update localStorage directly
    const followedCreators = JSON.parse(localStorage.getItem("followedCreators") || "[]");
    if (newFollowState) {
      if (!followedCreators.includes(creatorId)) {
        followedCreators.push(creatorId);
      }
    } else {
      const index = followedCreators.indexOf(creatorId);
      if (index > -1) {
        followedCreators.splice(index, 1);
      }
    }
    localStorage.setItem("followedCreators", JSON.stringify(followedCreators));
  };

  const profileMedia = {
    images: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    ],
    video: "https://storage.coverr.co/videos/coverr-woman-smiling-at-camera-8031/preview"
  };

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
          languages={["English", "Hindi", "Tamil"]}
          isOnline={true}
          isFollowing={isFollowing}
          onTalkNow={handleTalkNow}
          onFollow={handleFollow}
          onChat={handleChat}
        />

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Photos & Videos</h3>
            <div className="grid grid-cols-3 gap-2">
              {profileMedia.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedMedia({ type: 'image', url: img })}
                  data-testid={`media-image-${idx}`}
                >
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <div 
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative bg-black"
                onClick={() => setSelectedMedia({ type: 'video', url: profileMedia.video })}
                data-testid="media-video"
              >
                <video src={profileMedia.video} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-12 h-12 text-white" fill="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showPrivacyWarning && (
        <PrivacyWarningModal
          onAccept={handleAcceptPrivacy}
          onCancel={() => setShowPrivacyWarning(false)}
        />
      )}

      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl p-0">
            {selectedMedia.type === 'image' ? (
              <img 
                src={selectedMedia.url} 
                alt="Full size" 
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay
                className="w-full h-auto rounded-lg"
                data-testid="video-player"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
