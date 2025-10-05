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
import { creatorsData, type Creator } from "@/lib/creatorsData";

export default function UserApp() {
  const [, setLocation] = useLocation();
  const { balance } = useWallet();
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [randomMatchedCreator, setRandomMatchedCreator] = useState<Creator | null>(null);
  const [activeTab, setActiveTab] = useState("explore");
  const [showRandomMatch, setShowRandomMatch] = useState(false);
  const [followedCreators, setFollowedCreators] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedCreators");
    return saved ? JSON.parse(saved) : [];
  });
  const [shuffledCreators, setShuffledCreators] = useState<Creator[]>([]);

  const creators = creatorsData;

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
