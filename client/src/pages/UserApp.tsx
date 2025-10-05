import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreatorCard } from "@/components/CreatorCard";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { Home, Heart, Shuffle, MessageSquare, User } from "lucide-react";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";

export default function UserApp() {
  const [, setLocation] = useLocation();
  const { balance } = useWallet();
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [randomMatchedCreator, setRandomMatchedCreator] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("explore");
  const [showRandomMatch, setShowRandomMatch] = useState(false);
  const [followedCreators, setFollowedCreators] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedCreators");
    return saved ? JSON.parse(saved) : [];
  });
  const [shuffledCreators, setShuffledCreators] = useState<any[]>([]);

  const creators = [
    {
      id: "1",
      name: "Sarah Johnson",
      price: 45,
      country: "India",
      followers: 1250,
      languages: ["English", "Hindi", "Tamil"],
      isOnline: true,
      randomMatchEnabled: true,
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
      randomMatchEnabled: false,
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
      randomMatchEnabled: true,
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
      randomMatchEnabled: false,
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
      randomMatchEnabled: true,
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
      randomMatchEnabled: false,
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
      randomMatchEnabled: true,
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
      randomMatchEnabled: false,
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
      randomMatchEnabled: false,
      aboutMe: "Classical dancer and arts enthusiast sharing insights on Indian culture and performing arts.",
      talksAbout: ["Dance", "Indian culture", "Arts", "Music", "Traditions"],
      hobbies: ["Dancing", "Teaching", "Traveling", "Cooking"],
      foodPreferences: ["Vegetarian", "South Indian", "Traditional sweets"],
      sportsInterests: ["Badminton", "Swimming", "Yoga"],
    },
  ];

  // Shuffle creators on component mount
  useEffect(() => {
    const shuffled = [...creators].sort(() => Math.random() - 0.5);
    setShuffledCreators(shuffled);
  }, []);

  // Refresh followed creators from localStorage when tab changes to Follow
  useEffect(() => {
    if (activeTab === "follow") {
      const saved = localStorage.getItem("followedCreators");
      setFollowedCreators(saved ? JSON.parse(saved) : []);
    }
  }, [activeTab]);

  // Slow popup animation for Random Match button - appears after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRandomMatch(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handle Random Match - select from online creators with randomMatchEnabled
  const handleRandomMatch = () => {
    const eligibleCreators = creators.filter(
      (creator) => creator.isOnline && creator.randomMatchEnabled
    );
    
    if (eligibleCreators.length === 0) {
      // No creators available for random match
      return;
    }
    
    // Pick a random creator from eligible ones
    const randomCreator = eligibleCreators[Math.floor(Math.random() * eligibleCreators.length)];
    setRandomMatchedCreator(randomCreator);
    setShowIncomingCall(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">LINKY</h1>
          <div className="flex items-center gap-3">
            <BalanceDisplay 
              balance={balance} 
              onClick={() => setLocation("/user/recharge")}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="explore" data-testid="tab-explore">
              Explore
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new">
              New
            </TabsTrigger>
            <TabsTrigger value="follow" data-testid="tab-follow">
              Follow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explore" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shuffledCreators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  {...creator}
                  onClick={() => setLocation(`/user/creator/${creator.id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shuffledCreators.slice().reverse().map((creator) => (
                <CreatorCard
                  key={creator.id}
                  {...creator}
                  onClick={() => setLocation(`/user/creator/${creator.id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="follow" className="mt-6">
            {followedCreators.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No followed creators</h3>
                <p className="text-muted-foreground mb-4">
                  Follow creators to see them here
                </p>
                <Button onClick={() => setActiveTab("explore")} data-testid="button-explore">
                  Explore Creators
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {creators.filter((c) => followedCreators.includes(c.id)).map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => setLocation(`/user/creator/${creator.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation with Random Match Button */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 9999 }}>
        {/* Random Match Button - Above nav bar */}
        <div className="flex justify-center pb-3">
          <Button
            size="lg"
            className={`shadow-2xl transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 ${
              showRandomMatch 
                ? 'opacity-100 scale-100 animate-pulse' 
                : 'opacity-0 scale-90 pointer-events-none'
            }`}
            style={{ animationDuration: '2s' }}
            onClick={handleRandomMatch}
            data-testid="button-random-match"
          >
            <Shuffle className="w-5 h-5 mr-2" />
            Random Match
          </Button>
        </div>

        {/* Navigation Bar */}
        <nav className="bg-card border-t px-4 py-3">
          <div className="flex justify-around max-w-md mx-auto">
            <Button variant="ghost" size="icon" data-testid="button-nav-home">
              <Home className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/user/support")}
              data-testid="button-nav-messages"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/user/account")}
              data-testid="button-nav-profile"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </nav>
      </div>

      {showIncomingCall && randomMatchedCreator && (
        <IncomingCallModal
          callerName={randomMatchedCreator.name}
          pricePerMinute={25}
          onAccept={() => {
            setShowIncomingCall(false);
            setLocation(`/user/call/${randomMatchedCreator.id}`);
          }}
          onReject={() => {
            setShowIncomingCall(false);
            setRandomMatchedCreator(null);
          }}
        />
      )}
    </div>
  );
}
