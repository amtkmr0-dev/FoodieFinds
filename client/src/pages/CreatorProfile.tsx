import { useState, useEffect } from "react";
import { CreatorProfileHeader } from "@/components/CreatorProfileHeader";
import { PrivacyWarningModal } from "@/components/PrivacyWarningModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, Play, Phone, Video, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { creatorsData, type Creator } from "@/lib/creatorsData";

function CreatorProfileContent() {
  const [, setLocation] = useLocation();
  const { id: creatorId } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // BUG-014 FIX: Import from shared creatorsData instead of duplicating
  // BUG-015 FIX: Proper error handling for non-existent creators
  useEffect(() => {
    const foundCreator = creatorsData.find(c => c.id === creatorId);
    if (foundCreator) {
      setCreator(foundCreator);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setIsLoading(false);
  }, [creatorId]);

  // BUG-031 FIX: Use state management with localStorage persistence instead of direct manipulation
  const [isFollowing, setIsFollowing] = useState(() => {
    try {
      const followedCreators = JSON.parse(localStorage.getItem("followedCreators") || "[]");
      return followedCreators.includes(creatorId || "");
    } catch (error) {
      console.error("Error reading followed creators from localStorage:", error);
      return false;
    }
  });

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "followedCreators" && e.newValue) {
        try {
          const followedCreators = JSON.parse(e.newValue);
          setIsFollowing(followedCreators.includes(creatorId || ""));
        } catch (error) {
          console.error("Error parsing followed creators:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [creatorId]);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [showCallTypeSelection, setShowCallTypeSelection] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<"audio" | "video">("video");
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const { toast } = useToast();
  const { balance } = useWallet();
  const pricePerMinute = creator?.price || 0;
  const minBalance = pricePerMinute * 3;

  // BUG-015 FIX: Show error state if creator not found
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Creator Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The creator profile you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/user")}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleTalkNow = () => {
    if (balance < minBalance) {
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

    // If creator has only one call type enabled, directly initiate call
    if (creator.allowedCallTypes === "audio") {
      setSelectedCallType("audio");
      setLocation(`/user/call/${creator.id}?callType=audio`);
    } else if (creator.allowedCallTypes === "video") {
      setSelectedCallType("video");
      setLocation(`/user/call/${creator.id}?callType=video`);
    } else {
      // Creator has both enabled - show selection screen
      setShowCallTypeSelection(true);
    }
  };

  const handleCallTypeSelect = (type: "audio" | "video") => {
    setSelectedCallType(type);
    setShowCallTypeSelection(false);
    setLocation(`/user/call/${creator.id}?callType=${type}`);
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
          name={creator.name}
          country={creator.country}
          followers={creator.followers}
          price={creator.price}
          languages={creator.languages}
          isOnline={creator.isOnline}
          isFollowing={isFollowing}
          allowedCallTypes={creator.allowedCallTypes}
          onTalkNow={handleTalkNow}
          onFollow={handleFollow}
          onChat={handleChat}
        />

        <div className="p-6 space-y-6">
          {/* About Section */}
          <div data-testid="section-about">
            <h3 className="text-lg font-semibold mb-4" data-testid="heading-about">About</h3>
            <Card className="p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid="subheading-aboutme">About Me</h4>
                <p className="text-sm" data-testid="text-aboutme">{creator.aboutMe}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid="subheading-talksabout">Talks About</h4>
                <div className="flex flex-wrap gap-2" data-testid="container-topics">
                  {creator.talksAbout.map((topic) => (
                    <Badge key={topic} variant="secondary" data-testid={`badge-topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}>
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid="subheading-hobbies">Hobbies</h4>
                <div className="flex flex-wrap gap-2" data-testid="container-hobbies">
                  {creator.hobbies.map((hobby) => (
                    <Badge key={hobby} variant="outline" data-testid={`badge-hobby-${hobby.toLowerCase().replace(/\s+/g, '-')}`}>
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid="subheading-food">Food Preferences</h4>
                <div className="flex flex-wrap gap-2" data-testid="container-food">
                  {creator.foodPreferences.map((food) => (
                    <Badge key={food} variant="outline" data-testid={`badge-food-${food.toLowerCase().replace(/\s+/g, '-')}`}>
                      {food}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2" data-testid="subheading-sports">Sports Interests</h4>
                <div className="flex flex-wrap gap-2" data-testid="container-sports">
                  {creator.sportsInterests.map((sport) => (
                    <Badge key={sport} variant="outline" data-testid={`badge-sport-${sport.toLowerCase().replace(/\s+/g, '-')}`}>
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* BUG-045 FIX: Add empty state for creator media */}
          {/* BUG-048 FIX: Use responsive grid with breakpoints */}
          {/* Photos & Videos Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Photos & Videos</h3>
            {profileMedia.images.length === 0 && !profileMedia.video ? (
              <div className="text-center py-8" role="status" aria-live="polite">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">No media available</h4>
                <p className="text-sm text-muted-foreground">
                  {creator.name} hasn't shared any photos or videos yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
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
            )}
          </div>
        </div>
      </main>

      {showPrivacyWarning && (
        <PrivacyWarningModal
          onAccept={handleAcceptPrivacy}
          onCancel={() => setShowPrivacyWarning(false)}
        />
      )}

      {showCallTypeSelection && (
        <Dialog open={showCallTypeSelection} onOpenChange={setShowCallTypeSelection}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Call Type</DialogTitle>
              <DialogDescription>
                Select how you'd like to connect with {creator.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant={selectedCallType === "audio" ? "default" : "outline"}
                className="h-32 flex flex-col gap-3"
                onClick={() => handleCallTypeSelect("audio")}
                data-testid="button-select-audio"
              >
                <Phone className="w-8 h-8" />
                <span className="font-medium">Audio Call</span>
                <span className="text-xs text-muted-foreground">₹{creator.price}/min</span>
              </Button>
              <Button
                variant={selectedCallType === "video" ? "default" : "outline"}
                className="h-32 flex flex-col gap-3"
                onClick={() => handleCallTypeSelect("video")}
                data-testid="button-select-video"
              >
                <Video className="w-8 h-8" />
                <span className="font-medium">Video Call</span>
                <span className="text-xs text-muted-foreground">₹{creator.price}/min</span>
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCallTypeSelection(false)}
                data-testid="button-cancel-call-type"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

export default function CreatorProfile() {
  const user = useRequireAuth();
  if (!user) return null;
  return <CreatorProfileContent />;
}
