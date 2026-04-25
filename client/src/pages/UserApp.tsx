import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatorCard } from "@/components/CreatorCard";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { RechargeWalletModal } from "@/components/RechargeWalletModal";
import { ResponsiveGrid } from "@/components/ResponsiveLayout";
import { Home, Heart, Shuffle, MessageSquare, User, Video, Phone as PhoneIcon, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { creatorsData, type Creator } from "@/lib/creatorsData";
import { useAppLanguage } from "@/lib/language";

export default function UserApp() {
  const [location, setLocation] = useLocation();
  const { balance } = useWallet();
  const { t } = useAppLanguage();
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showRechargeWallet, setShowRechargeWallet] = useState(false);
  const [randomMatchedCreator, setRandomMatchedCreator] = useState<Creator | null>(null);
  const [activeTab, setActiveTab] = useState("explore");
  const [showRandomMatch, setShowRandomMatch] = useState(false);
  const [showCallTypeDialog, setShowCallTypeDialog] = useState(false);
  const [selectedCallType, setSelectedCallType] = useState<"audio" | "video">("video");
  const [matchedCreatorForCallType, setMatchedCreatorForCallType] = useState<Creator | null>(null);
  const randomMatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // BUG-030 FIX: Use centralized state management for followed creators
  // Initialize from localStorage but sync with storage changes
  const [followedCreators, setFollowedCreators] = useState<string[]>(() => {
    const saved = localStorage.getItem("followedCreators");
    return saved ? JSON.parse(saved) : [];
  });
  const [shuffledCreators, setShuffledCreators] = useState<Creator[]>([]);
  const shouldShowRandomMatch =
    showRandomMatch &&
    !showIncomingCall &&
    !showRechargeWallet &&
    !showCallTypeDialog;

  const creators = creatorsData;

  // BUG-029 FIX: Move shuffle logic to useEffect with empty dependency array
  // This prevents shuffling on every render
  useEffect(() => {
    const shuffled = [...creators].sort(() => Math.random() - 0.5);
    setShuffledCreators(shuffled);
  }, []); // Empty dependency array - only run on mount

  // BUG-030 FIX: Listen for storage changes to sync followed creators across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "followedCreators" && e.newValue) {
        setFollowedCreators(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (randomMatchTimeoutRef.current) {
        clearTimeout(randomMatchTimeoutRef.current);
      }
    };
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
    setMatchedCreatorForCallType(randomCreator);

    // Set default call type based on creator's preferences
    if (randomCreator.allowedCallTypes === "video") {
      setSelectedCallType("video");
    } else if (randomCreator.allowedCallTypes === "audio") {
      setSelectedCallType("audio");
    } else {
      // "both" - default to video
      setSelectedCallType("video");
    }

    // Show call type selection dialog first
    setShowCallTypeDialog(true);
  };

  // Start the call after call type is selected
  const startRandomMatchCall = () => {
    if (!matchedCreatorForCallType) {
      return;
    }

    setRandomMatchedCreator(matchedCreatorForCallType);
    setShowIncomingCall(true);

    // Auto-connect after 3 seconds (simulate ringing then creator answers)
    randomMatchTimeoutRef.current = setTimeout(() => {
      // BUG-012 FIX: Check if user is still on the same page before navigating
      if (location.startsWith('/user') && !location.includes('/call/')) {
        setShowIncomingCall(false);
        setLocation(`/user/call/${matchedCreatorForCallType.id}?randomMatch=true&callType=${selectedCallType}`);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b px-3 mobile-m:px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-lg mobile-m:text-xl font-bold">{t("appName")}</h1>
          <div className="flex items-center gap-2 mobile-m:gap-3">
            <BalanceDisplay
              balance={balance}
              onClick={() => setShowRechargeWallet(true)}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 mobile-m:px-4 py-4 mobile-m:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 mobile-m:mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto h-10 mobile-m:h-11">
            <TabsTrigger value="explore" data-testid="tab-explore" className="text-xs mobile-m:text-sm">
              {t("explore")}
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new" className="text-xs mobile-m:text-sm">
              {t("new")}
            </TabsTrigger>
            <TabsTrigger value="follow" data-testid="tab-follow" className="text-xs mobile-m:text-sm">
              {t("follow")}
            </TabsTrigger>
          </TabsList>

          {/* BUG-044 FIX: Add empty state for no creators */}
          <TabsContent value="explore" className="mt-4 mobile-m:mt-6">
            {shuffledCreators.length === 0 ? (
              <div className="text-center py-8 mobile-m:py-12" role="status" aria-live="polite">
                <Users className="w-10 h-10 mobile-m:w-12 mobile-m:h-12 mx-auto mb-3 mobile-m:mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-base mobile-m:text-lg font-semibold mb-2">{t("noCreatorsAvailable")}</h3>
                <p className="text-sm mobile-m:text-base text-muted-foreground mb-3 mobile-m:mb-4 px-4">
                  {t("checkBackLater")}
                </p>
              </div>
            ) : (
              <ResponsiveGrid>
                {shuffledCreators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => setLocation(`/user/creator/${creator.id}`)}
                  />
                ))}
              </ResponsiveGrid>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4 mobile-m:mt-6">
            {shuffledCreators.length === 0 ? (
              <div className="text-center py-8 mobile-m:py-12" role="status" aria-live="polite">
                <Users className="w-10 h-10 mobile-m:w-12 mobile-m:h-12 mx-auto mb-3 mobile-m:mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-base mobile-m:text-lg font-semibold mb-2">{t("noNewCreators")}</h3>
                <p className="text-sm mobile-m:text-base text-muted-foreground mb-3 mobile-m:mb-4 px-4">
                  {t("checkBackLater")}
                </p>
              </div>
            ) : (
              <ResponsiveGrid>
                {shuffledCreators.slice().reverse().map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => setLocation(`/user/creator/${creator.id}`)}
                  />
                ))}
              </ResponsiveGrid>
            )}
          </TabsContent>

          <TabsContent value="follow" className="mt-4 mobile-m:mt-6">
            {/* BUG-044 FIX: Add empty state for no followed creators */}
            {followedCreators.length === 0 ? (
              <div className="text-center py-8 mobile-m:py-12" role="status" aria-live="polite">
                <Heart className="w-10 h-10 mobile-m:w-12 mobile-m:h-12 mx-auto mb-3 mobile-m:mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-base mobile-m:text-lg font-semibold mb-2">{t("noFollowedCreators")}</h3>
                <p className="text-sm mobile-m:text-base text-muted-foreground mb-3 mobile-m:mb-4 px-4">
                  {t("followCreators")}
                </p>
                <Button
                  onClick={() => setActiveTab("explore")}
                  data-testid="button-explore"
                  className="text-sm mobile-m:text-base"
                  aria-label="Explore creators to follow"
                >
                  {t("exploreCreators")}
                </Button>
              </div>
            ) : (
              <ResponsiveGrid>
                {creators.filter((c) => followedCreators.includes(c.id)).map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    {...creator}
                    onClick={() => setLocation(`/user/creator/${creator.id}`)}
                  />
                ))}
              </ResponsiveGrid>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation with Random Match Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Random Match Button - Above nav bar */}
        <div className="flex justify-center pb-2 mobile-m:pb-3">
          <Button
            size="lg"
            className={`shadow-2xl transition-all duration-500 ease-out bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 text-sm mobile-m:text-base px-6 mobile-m:px-8 h-10 mobile-m:h-11 ${shouldShowRandomMatch
              ? 'opacity-100 scale-100 animate-pulse'
              : 'opacity-0 scale-90 pointer-events-none'
              }`}
            style={{ animationDuration: '2s' }}
            onClick={handleRandomMatch}
            data-testid="button-random-match"
          >
            <Shuffle className="w-4 h-4 mobile-m:w-5 mobile-m:h-5 mr-1 mobile-m:mr-2" />
            <span className="hidden mobile-s:inline">{t("randomMatch")}</span>
            <span className="mobile-s:hidden">{t("match")}</span>
          </Button>
        </div>

        {/* Navigation Bar */}
        <nav className="bg-card border-t px-3 mobile-m:px-4 py-2 mobile-m:py-3">
          <div className="flex justify-around max-w-md mx-auto">
            <Button variant="ghost" size="icon" data-testid="button-nav-home" className="h-10 w-10 mobile-m:h-12 mobile-m:w-12">
              <Home className="w-4 h-4 mobile-m:w-5 mobile-m:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/user/support")}
              data-testid="button-nav-messages"
              className="h-10 w-10 mobile-m:h-12 mobile-m:w-12"
            >
              <MessageSquare className="w-4 h-4 mobile-m:w-5 mobile-m:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/user/account")}
              className="h-10 w-10 mobile-m:h-12 mobile-m:w-12"
              data-testid="button-nav-profile"
            >
              <User className="w-4 h-4 mobile-m:w-5 mobile-m:h-5" />
            </Button>
          </div>
        </nav>
      </div>

      {showIncomingCall && randomMatchedCreator && (
        <IncomingCallModal
          callerName={randomMatchedCreator.name}
          pricePerMinute={25}
          callType={selectedCallType}
          isOutgoing={true}
          onReject={() => {
            // Clear the auto-connect timeout
            if (randomMatchTimeoutRef.current) {
              clearTimeout(randomMatchTimeoutRef.current);
              randomMatchTimeoutRef.current = null;
            }
            setShowIncomingCall(false);
            setRandomMatchedCreator(null);
          }}
        />
      )}

      <RechargeWalletModal
        open={showRechargeWallet}
        onOpenChange={setShowRechargeWallet}
      />

      {/* Call Type Selection Dialog */}
      <Dialog open={showCallTypeDialog} onOpenChange={setShowCallTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("chooseCallType")}</DialogTitle>
            <DialogDescription>
              {matchedCreatorForCallType ?
                `Connect with ${matchedCreatorForCallType.name}` :
                t("selectConnection")}
            </DialogDescription>
          </DialogHeader>
          <div className={`grid gap-4 py-4 ${matchedCreatorForCallType?.allowedCallTypes === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
            {matchedCreatorForCallType?.allowedCallTypes === "audio" || matchedCreatorForCallType?.allowedCallTypes === "both" ? (
              <Button
                variant={selectedCallType === "audio" ? "default" : "outline"}
                className="h-32 flex flex-col gap-3"
                onClick={() => setSelectedCallType("audio")}
              >
                <PhoneIcon className="w-10 h-10" />
                <span className="font-semibold">{t("audioCall")}</span>
                <span className="text-xs text-muted-foreground">{t("voiceOnly")}</span>
              </Button>
            ) : null}
            {matchedCreatorForCallType?.allowedCallTypes === "video" || matchedCreatorForCallType?.allowedCallTypes === "both" ? (
              <Button
                variant={selectedCallType === "video" ? "default" : "outline"}
                className="h-32 flex flex-col gap-3"
                onClick={() => setSelectedCallType("video")}
              >
                <Video className="w-10 h-10" />
                <span className="font-semibold">{t("videoCall")}</span>
                <span className="text-xs text-muted-foreground">{t("faceToFace")}</span>
              </Button>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallTypeDialog(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={() => {
              setShowCallTypeDialog(false);
              startRandomMatchCall();
            }}>
              {t("startMatch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
