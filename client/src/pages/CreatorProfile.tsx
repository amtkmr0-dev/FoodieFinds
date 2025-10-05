import { useState } from "react";
import { CreatorProfileHeader } from "@/components/CreatorProfileHeader";
import { PrivacyWarningModal } from "@/components/PrivacyWarningModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, Play } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Mock creator data - in real app this would come from API
const creatorsData = [
  {
    id: "1",
    name: "Sarah Johnson",
    price: 45,
    country: "India",
    followers: 1250,
    languages: ["English", "Hindi", "Tamil"],
    isOnline: true,
    aboutMe: "Friendly conversationalist who loves discussing life experiences and offering advice on personal growth.",
    talksAbout: ["Life coaching", "Relationships", "Career guidance", "Mental wellness"],
    hobbies: ["Reading", "Yoga", "Traveling", "Cooking"],
    foodPreferences: ["Vegetarian", "Italian cuisine", "Indian sweets"],
    sportsInterests: ["Cricket", "Badminton", "Running"],
  },
  {
    id: "2",
    name: "Rahul Verma",
    price: 38,
    country: "India",
    followers: 890,
    languages: ["Hindi", "English"],
    isOnline: false,
    aboutMe: "Tech enthusiast and startup mentor with 10 years of experience in software development.",
    talksAbout: ["Technology", "Startups", "Programming", "Career advice"],
    hobbies: ["Gaming", "Photography", "Blogging"],
    foodPreferences: ["Non-vegetarian", "North Indian", "Chinese"],
    sportsInterests: ["Football", "Chess", "Table tennis"],
  },
  {
    id: "3",
    name: "Priya Sharma",
    price: 52,
    country: "India",
    followers: 2100,
    languages: ["English", "Hindi", "Marathi"],
    isOnline: true,
    aboutMe: "Business consultant and motivational speaker passionate about empowering entrepreneurs.",
    talksAbout: ["Business strategy", "Entrepreneurship", "Marketing", "Leadership"],
    hobbies: ["Public speaking", "Writing", "Gardening"],
    foodPreferences: ["Vegetarian", "South Indian", "Continental"],
    sportsInterests: ["Tennis", "Swimming", "Cycling"],
  },
  {
    id: "4",
    name: "Amit Patel",
    price: 40,
    country: "India",
    followers: 1500,
    languages: ["Gujarati", "Hindi", "English"],
    isOnline: true,
    aboutMe: "Finance expert helping people make smart investment decisions and achieve financial freedom.",
    talksAbout: ["Investment", "Stock market", "Personal finance", "Real estate"],
    hobbies: ["Reading", "Playing guitar", "Hiking"],
    foodPreferences: ["Vegetarian", "Gujarati cuisine", "Street food"],
    sportsInterests: ["Cricket", "Volleyball", "Jogging"],
  },
  {
    id: "5",
    name: "Neha Kapoor",
    price: 48,
    country: "India",
    followers: 1780,
    languages: ["English", "Hindi", "Punjabi"],
    isOnline: true,
    aboutMe: "Fashion designer and lifestyle blogger who loves sharing creative ideas and style tips.",
    talksAbout: ["Fashion", "Lifestyle", "Beauty", "Social media"],
    hobbies: ["Sketching", "Shopping", "Dancing", "Photography"],
    foodPreferences: ["Vegetarian", "Punjabi cuisine", "Fusion food"],
    sportsInterests: ["Zumba", "Yoga", "Badminton"],
  },
  {
    id: "6",
    name: "Vikram Singh",
    price: 35,
    country: "India",
    followers: 750,
    languages: ["Hindi", "English"],
    isOnline: false,
    aboutMe: "Fitness trainer and nutrition coach dedicated to helping people achieve their health goals.",
    talksAbout: ["Fitness", "Nutrition", "Weight loss", "Muscle building"],
    hobbies: ["Gym training", "Sports", "Cooking healthy meals"],
    foodPreferences: ["High protein", "Salads", "Smoothies"],
    sportsInterests: ["Bodybuilding", "Boxing", "Running", "Basketball"],
  },
  {
    id: "7",
    name: "Anjali Mehta",
    price: 42,
    country: "India",
    followers: 1320,
    languages: ["English", "Hindi", "Bengali"],
    isOnline: true,
    aboutMe: "Psychologist and counselor specializing in stress management and emotional well-being.",
    talksAbout: ["Mental health", "Stress management", "Relationships", "Self-care"],
    hobbies: ["Meditation", "Reading", "Painting", "Listening to music"],
    foodPreferences: ["Vegetarian", "Bengali cuisine", "Organic food"],
    sportsInterests: ["Walking", "Swimming", "Yoga"],
  },
  {
    id: "8",
    name: "Karan Malhotra",
    price: 50,
    country: "India",
    followers: 1950,
    languages: ["Hindi", "English", "Urdu"],
    isOnline: true,
    aboutMe: "Digital marketing expert helping brands grow their online presence and reach their audience.",
    talksAbout: ["Digital marketing", "SEO", "Content creation", "Brand building"],
    hobbies: ["Traveling", "Photography", "Blogging", "Music"],
    foodPreferences: ["Non-vegetarian", "Mughlai", "Italian"],
    sportsInterests: ["Cricket", "Football", "Snooker"],
  },
  {
    id: "9",
    name: "Kavya Iyer",
    price: 46,
    country: "India",
    followers: 1650,
    languages: ["English", "Tamil", "Hindi"],
    isOnline: false,
    aboutMe: "Classical dancer and arts enthusiast sharing insights on Indian culture and performing arts.",
    talksAbout: ["Dance", "Indian culture", "Arts", "Music", "Traditions"],
    hobbies: ["Dancing", "Teaching", "Traveling", "Cooking"],
    foodPreferences: ["Vegetarian", "South Indian", "Traditional sweets"],
    sportsInterests: ["Badminton", "Swimming", "Yoga"],
  },
];

export default function CreatorProfile() {
  const [, setLocation] = useLocation();
  const { id: creatorId } = useParams<{ id: string }>();
  const creator = creatorsData.find(c => c.id === creatorId) || creatorsData[0];
  
  const [isFollowing, setIsFollowing] = useState(() => {
    const followedCreators = JSON.parse(localStorage.getItem("followedCreators") || "[]");
    return followedCreators.includes(creatorId);
  });
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const { toast } = useToast();
  const currentBalance = 450;
  const pricePerMinute = creator.price;
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
          name={creator.name}
          country={creator.country}
          followers={creator.followers}
          price={creator.price}
          languages={creator.languages}
          isOnline={creator.isOnline}
          isFollowing={isFollowing}
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

          {/* Photos & Videos Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Photos & Videos</h3>
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
