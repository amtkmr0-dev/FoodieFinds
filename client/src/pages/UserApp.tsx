import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreatorCard } from "@/components/CreatorCard";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { Home, Heart, Shuffle, MessageSquare, User } from "lucide-react";
import { useLocation } from "wouter";

export default function UserApp() {
  const [, setLocation] = useLocation();
  const [balance] = useState(450);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [activeTab, setActiveTab] = useState("explore");
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
      isOnline: true,
    },
    {
      id: "2",
      name: "Rahul Verma",
      price: 38,
      country: "India",
      followers: 890,
      isOnline: false,
    },
    {
      id: "3",
      name: "Priya Sharma",
      price: 52,
      country: "India",
      followers: 2100,
      isOnline: true,
    },
    {
      id: "4",
      name: "Amit Patel",
      price: 40,
      country: "India",
      followers: 1500,
      isOnline: true,
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Talkin</h1>
          <div className="flex items-center gap-3">
            <BalanceDisplay balance={balance} />
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

      {/* Floating Random Match Button */}
      <Button
        size="lg"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 shadow-lg hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 animate-pulse"
        onClick={() => setShowIncomingCall(true)}
        data-testid="button-random-match"
      >
        <Shuffle className="w-5 h-5 mr-2" />
        Random Match
      </Button>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
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

      {showIncomingCall && (
        <IncomingCallModal
          callerName="System Call"
          pricePerMinute={45}
          onAccept={() => {
            setShowIncomingCall(false);
            setLocation("/user/recharge");
          }}
          onReject={() => setShowIncomingCall(false)}
        />
      )}
    </div>
  );
}
