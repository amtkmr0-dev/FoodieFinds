import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { PerformanceMeter } from "@/components/creator/PerformanceMeter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import {
  Wallet,
  Users,
  Gift,
  MessageSquare,
  Settings,
  TrendingUp,
  Video,
  Phone,
  Sparkles,
  Trophy,
  Target,
  DollarSign,
  BarChart3,
  Clock,
  Star,
  Zap,
  Crown,
  Heart,
  Send,
  Download,
  UserPlus,
  Radio,
  Camera,
  Mic,
  Award,
  TrendingDown,
  User,
  Globe,
  Copy,
  Share,
  Shield,
  CreditCard,
  FileText,
  Shuffle,
} from "lucide-react";
import { getCreatorCallLogs, subscribeToCallLogs } from "@/lib/call-logs";
import { ProfilePicturePicker } from "@/components/ProfilePicturePicker";
import { getStoredProfilePicture, saveStoredProfilePicture } from "@/lib/profile-pictures";
import { publishCallSignal, subscribeToCallSignals, type SimulatedIncomingCall } from "@/lib/call-signaling";
import {
  getLocalCreatorStatus,
  subscribeToCreatorStatus,
  updateCreatorStatus,
  type CreatorCallStatus,
} from "@/lib/creator-status";
import { useLocation } from "wouter";
import { creatorsData, type Creator } from "@/lib/creatorsData";

type ActiveCreatorAccount = {
  otp?: string;
  name: string;
  creatorId: string;
};

function getActiveCreatorAccount(): ActiveCreatorAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("creator_active_account");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getActiveCreatorProfile(account: ActiveCreatorAccount | null): Creator {
  if (!account) return creatorsData[0];

  return (
    creatorsData.find((creator) => creator.name === account.name) ||
    creatorsData.find((creator) => creator.id === account.creatorId) ||
    creatorsData[0]
  );
}

function getCreatorProfilePictureKey(account: ActiveCreatorAccount | null, creator: Creator) {
  return `linky_creator_profile_picture_${account?.creatorId || creator.id}`;
}

export default function CreatorApp() {
  const [role, setRole] = useState<"creator" | "agency">("creator");
  const [isLive, setIsLive] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showProfilePicturePicker, setShowProfilePicturePicker] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState<"audio" | "video">("audio");
  const [incomingCallerName, setIncomingCallerName] = useState("");
  const [incomingCall, setIncomingCall] = useState<SimulatedIncomingCall | null>(null);
  const [allowedCallTypes, setAllowedCallTypes] = useState<"audio" | "video" | "both">("both");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const activeCreatorAccount = getActiveCreatorAccount();
  const activeCreatorProfile = getActiveCreatorProfile(activeCreatorAccount);
  const creatorProfilePictureKey = getCreatorProfilePictureKey(activeCreatorAccount, activeCreatorProfile);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: activeCreatorProfile.name,
    email: `${activeCreatorProfile.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    mobile: activeCreatorAccount ? `+91 ${localStorage.getItem("creator_mobile") || ""}`.trim() : "+91 9876543210",
    profilePicture: getStoredProfilePicture(creatorProfilePictureKey, activeCreatorProfile.image),
  });

  // Bank details state
  const [bankData, setBankData] = useState({
    accountName: activeCreatorProfile.name,
    accountNumber: "1234567890",
    ifscCode: "SBIN0001234",
    verified: true,
  });

  // Withdrawal state
  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  // Random Match setting
  const [randomMatchEnabled, setRandomMatchEnabled] = useState(true);
  const [serverEarnings, setServerEarnings] = useState<number | null>(null);
  const [creatorCallStatus, setCreatorCallStatus] = useState<CreatorCallStatus>(
    () => getLocalCreatorStatus(activeCreatorProfile.id).status
  );

  const handleLogout = () => {
    [
      "creator_registered",
      "creator_approval_status",
      "creator_mobile",
      "creator_active_account",
      "agent_registered",
      "agent_approval_status",
      "agent_mobile",
      "rejection_reason",
    ].forEach((key) => localStorage.removeItem(key));

    setIsLive(false);
    setShowIncomingCall(false);
    setIncomingCall(null);

    toast({
      title: "Logged out",
      description: "You have been signed out of the creator app.",
    });
    setLocation("/creator/login");
  };

  // Mock data
  const creatorStats = {
    earningsToday: serverEarnings ?? 2340,
    earningsThisWeek: 15670,
    earningsThisMonth: 54320,
    totalCalls: 45,
    callsToday: 12,
    giftsReceived: 127,
    giftsValue: 8900,
    followers: activeCreatorProfile.followers,
    liveViewers: 0,
    pkWins: 23,
    pkLosses: 15,
    rank: 47,
  };

  // Performance metrics for the meter
  const performanceMetrics = {
    score: 78.5, // 0-100 score
    metrics: {
      avgCallDuration: 720, // 12 minutes in seconds
      userRetention: 68.3, // percentage
      callAcceptanceRate: 82.5, // percentage
    },
  };

  const agencyStats = {
    commission: 12450,
    commissionToday: 1890,
    creators: 23,
    activeCreators: 18,
    growth: 15,
    totalEarnings: 89560,
  };

  const gifts = [
    { id: 1, name: "Rose", price: 10, icon: Heart, points: 1, color: "text-pink-500" },
    { id: 2, name: "Heart", price: 50, icon: Heart, points: 5, color: "text-red-500" },
    { id: 3, name: "Diamond", price: 200, icon: Sparkles, points: 20, color: "text-blue-500" },
    { id: 4, name: "Crown", price: 500, icon: Crown, points: 50, color: "text-yellow-500" },
    { id: 5, name: "Rocket", price: 1000, icon: Zap, points: 100, color: "text-purple-500" },
    { id: 6, name: "Universe", price: 5000, icon: Star, points: 500, color: "text-indigo-500" },
  ];

  const defaultRecentCalls = [
    { id: 1, user: "Rahul M.", duration: "12 min", earnings: 540, type: "video", status: "completed" },
    { id: 2, user: "Priya S.", duration: "8 min", earnings: 360, type: "voice", status: "completed" },
    { id: 3, user: "Amit K.", duration: "15 min", earnings: 675, type: "video", status: "completed" },
  ];
  const [recentCalls, setRecentCalls] = useState(defaultRecentCalls);

  useEffect(() => {
    const mapCalls = (calls: any[]) => calls.map((call) => ({
        id: call.id,
        user: call.userName,
        duration: call.durationLabel,
        earnings: call.creatorEarnings,
        type: call.callType === "video" ? "video" : "voice",
        status: call.status,
        date: call.date,
      }));

    const refreshCallLogs = async () => {
      try {
        const response = await fetch(`/api/call-logs/creator/${activeCreatorProfile.id}`);
        if (response.ok) {
          const data = await response.json();
          const apiCalls = Array.isArray(data) ? mapCalls(data) : [];
          setRecentCalls(apiCalls.length > 0 ? apiCalls : defaultRecentCalls);
          return;
        }
      } catch {
        // Fall back to browser call logs.
      }

      const loggedCalls = mapCalls(getCreatorCallLogs(activeCreatorProfile.id));
      setRecentCalls(loggedCalls.length > 0 ? loggedCalls : defaultRecentCalls);
    };

    refreshCallLogs();
    const interval = setInterval(refreshCallLogs, 5000);
    const unsubscribe = subscribeToCallLogs(refreshCallLogs);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeCreatorProfile.id]);

  useEffect(() => {
    const refreshEarnings = async () => {
      try {
        const response = await fetch(`/api/creator/${activeCreatorProfile.id}/earnings`);
        if (!response.ok) return;
        const data = await response.json();
        const balance = Number(data.balance || data.wallet?.balance || 0);
        if (Number.isFinite(balance)) {
          setServerEarnings(balance);
        }
      } catch {
        // Keep local mock earnings while API is unavailable.
      }
    };

    refreshEarnings();
    const interval = setInterval(refreshEarnings, 5000);
    return () => clearInterval(interval);
  }, [activeCreatorProfile.id]);

  useEffect(() => {
    return subscribeToCallSignals((call) => {
      if (call.status !== "ringing") return;

      setIncomingCall(call);
      setIncomingCallType(call.callType);
      setIncomingCallerName(call.callerName || "User");
      setShowIncomingCall(true);
    });
  }, []);

  useEffect(() => {
    let disposed = false;

    const refreshStatus = async () => {
      try {
        const response = await fetch(`/api/creator/${activeCreatorProfile.id}/status`);
        if (!response.ok) return;
        const data = await response.json();
        if (!disposed && data.status) {
          setCreatorCallStatus(data.status);
        }
      } catch {
        if (!disposed) {
          setCreatorCallStatus(getLocalCreatorStatus(activeCreatorProfile.id).status);
        }
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    const unsubscribe = subscribeToCreatorStatus((record) => {
      if (record.creatorId === activeCreatorProfile.id) {
        setCreatorCallStatus(record.status);
      }
    });

    return () => {
      disposed = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeCreatorProfile.id]);

  const pkBattleHistory = [
    { id: 1, opponent: "Creator_789", result: "win", points: 1250, gifts: 25, duration: "5 min" },
    { id: 2, opponent: "Star_Host", result: "loss", points: 890, gifts: 18, duration: "5 min" },
    { id: 3, opponent: "TopCreator", result: "win", points: 1580, gifts: 32, duration: "5 min" },
  ];

  const myCreators = [
    { id: 1, name: "Sarah Johnson", earnings: 3240, calls: 28, status: "online", commission: 648 },
    { id: 2, name: "Amit Patel", earnings: 2890, calls: 24, status: "online", commission: 578 },
    { id: 3, name: "Priya Singh", earnings: 4120, calls: 35, status: "offline", commission: 824 },
  ];

  const topCreators = [
    { id: 1, rank: 1, name: "StarHost_Pro", earnings: 125000, calls: 890, pkWins: 156, followers: 45000 },
    { id: 2, rank: 2, name: "TalkQueen_24", earnings: 118000, calls: 820, pkWins: 142, followers: 38000 },
    { id: 3, rank: 3, name: "VoiceMaster", earnings: 112000, calls: 795, pkWins: 135, followers: 35000 },
    { id: 4, rank: 4, name: "ChatKing_89", earnings: 98000, calls: 710, pkWins: 118, followers: 28000 },
    { id: 5, rank: 5, name: "LiveStar_Pro", earnings: 92000, calls: 680, pkWins: 110, followers: 25000 },
  ];

  const topEarners = [
    { id: 1, name: "DiamondHost", amount: 15400, period: "Today" },
    { id: 2, name: "GoldenVoice", amount: 12800, period: "Today" },
    { id: 3, name: "ProTalker", amount: 10200, period: "Today" },
  ];

  const topPKPlayers = [
    { id: 1, name: "BattleChamp", wins: 245, losses: 45, winRate: 84.5 },
    { id: 2, name: "PKMaster_X", wins: 210, losses: 60, winRate: 77.8 },
    { id: 3, name: "FightStar", wins: 195, losses: 55, winRate: 78.0 },
  ];

  const beautyFilters = [
    { id: "none", name: "None", description: "No filter" },
    { id: "smooth", name: "Smooth Skin", description: "Face beautification" },
    { id: "bright", name: "Brighten", description: "Enhance brightness" },
    { id: "natural", name: "Natural Glow", description: "Soft glow effect" },
    { id: "rosy", name: "Rosy Cheeks", description: "Add blush effect" },
    { id: "glamour", name: "Glamour", description: "Full makeup look" },
  ];

  const handleGoLive = () => {
    setIsLive(!isLive);
  };

  const handleUpdateProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been successfully updated.",
    });
  };

  const handleProfilePictureSelect = (imageUrl: string) => {
    saveStoredProfilePicture(creatorProfilePictureKey, imageUrl);
    setProfileData((profile) => ({ ...profile, profilePicture: imageUrl }));
    toast({
      title: "Profile picture updated",
      description: "Your creator profile now has the selected picture.",
    });
  };

  const handleUpdateBank = () => {
    toast({
      title: "Bank Details Updated",
      description: "Your bank account details have been successfully updated. Withdrawals remain available with your verified account.",
    });
    // Note: In production, this would trigger admin re-verification workflow
    // For now, keep verification status to allow continued withdrawals
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawalAmount);

    // Validate bank verification
    if (!bankData.verified) {
      toast({
        title: "Bank Not Verified",
        description: "Please wait for your bank account to be verified before withdrawing funds.",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum amount
    if (!amount || amount < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹500.",
        variant: "destructive",
      });
      return;
    }

    // Validate available balance
    if (amount > creatorStats.earningsToday) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to withdraw this amount.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Withdrawal Initiated",
      description: `₹${amount.toLocaleString()} has been transferred to your bank account ${bankData.accountNumber.slice(-4)}.`,
    });
    setWithdrawalAmount("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              LINKY {role === "creator" ? "Creator" : "Agency"}
            </h1>
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-red-500 animate-pulse" : ""}>
              {isLive ? "🔴 LIVE" : role === "creator" ? "Creator" : "Agency"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRole(role === "creator" ? "agency" : "creator")}
              data-testid="button-switch-role"
            >
              Switch to {role === "creator" ? "Agency" : "Creator"}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">
              <Radio className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Go Live</span>
            </TabsTrigger>
            <TabsTrigger value="pk-battles" data-testid="tab-pk-battles">
              <Trophy className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">PK Battles</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
              <Award className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Rankings</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" data-testid="tab-gifts">
              <Gift className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Gifts</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">
              <Wallet className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 md:mr-2" />
              <span className="sr-only md:not-sr-only">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profileData.profilePicture} alt="Profile" />
                      <AvatarFallback className="text-2xl">
                        {profileData.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                      onClick={() => setShowProfilePicturePicker(true)}
                      data-testid="button-creator-upload-photo"
                      aria-label="Change creator profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">{profileData.name}</h2>
                    <p className="text-muted-foreground">₹{activeCreatorProfile.price}/min • {creatorStats.followers.toLocaleString()} followers</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-success">Approved</Badge>
                      <Badge
                        variant={creatorCallStatus === "on_call" ? "destructive" : "outline"}
                        className={creatorCallStatus === "available" ? "border-green-500 text-green-600" : ""}
                      >
                        status: {creatorCallStatus}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Rank #{creatorStats.rank}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      size="lg"
                      className={isLive ? "bg-red-500 hover:bg-red-600" : ""}
                      onClick={handleGoLive}
                      data-testid="button-go-live"
                    >
                      {isLive ? (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          End Stream
                        </>
                      ) : (
                        <>
                          <Radio className="w-4 h-4 mr-2" />
                          Go Live
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-secondary">
                    <Wallet className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold mb-1">₹{creatorStats.earningsToday.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Today's Earnings</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary">
                    <Phone className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold mb-1">{creatorStats.callsToday}</p>
                    <p className="text-xs text-muted-foreground">Calls Today</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary">
                    <Gift className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold mb-1">{creatorStats.giftsReceived}</p>
                    <p className="text-xs text-muted-foreground">Gifts Received</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-secondary">
                    <Trophy className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold mb-1">{creatorStats.pkWins}-{creatorStats.pkLosses}</p>
                    <p className="text-xs text-muted-foreground">PK Record</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Meter */}
            <PerformanceMeter
              score={performanceMetrics.score}
              metrics={performanceMetrics.metrics}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover-elevate cursor-pointer" data-testid="card-video-call">
                <CardContent className="pt-6 text-center">
                  <Video className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Video Call</h3>
                  <p className="text-sm text-muted-foreground">Start earning</p>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" data-testid="card-voice-call">
                <CardContent className="pt-6 text-center">
                  <Mic className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Voice Call</h3>
                  <p className="text-sm text-muted-foreground">Audio only</p>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" data-testid="card-start-pk">
                <CardContent className="pt-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Start PK</h3>
                  <p className="text-sm text-muted-foreground">Battle now</p>
                </CardContent>
              </Card>

              <Card className="hover-elevate cursor-pointer" data-testid="card-beauty-filters">
                <CardContent className="pt-6 text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Beauty Filters</h3>
                  <p className="text-sm text-muted-foreground">Apply effects</p>
                </CardContent>
              </Card>
            </div>

            {/* Test Incoming Call Button (for development/testing) */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-center">Test Incoming Call</h3>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncomingCallType("audio");
                      setIncomingCallerName("Test User (Audio)");
                      setShowIncomingCall(true);
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Simulate Audio Call
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIncomingCallType("video");
                      setIncomingCallerName("Test User (Video)");
                      setShowIncomingCall(true);
                    }}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Simulate Video Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Calls</span>
                  <Badge variant="secondary">{recentCalls.length} today</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{call.user.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{call.user}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          {call.type === "video" ? <Video className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                          {call.duration} • ₹{call.earnings}
                        </p>
                        {"date" in call && call.date && (
                          <p className="text-xs text-muted-foreground">{call.date}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-success">Completed</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Go Live Tab */}
          <TabsContent value="live" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  Live Streaming Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isLive ? (
                  <div className="text-center py-8">
                    <Radio className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Start Your Live Stream</h3>
                    <p className="text-muted-foreground mb-6">Connect with your audience in real-time</p>
                    <Button size="lg" onClick={handleGoLive} data-testid="button-start-stream">
                      <Video className="w-4 h-4 mr-2" />
                      Go Live Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="font-semibold text-red-500">LIVE NOW</span>
                        </div>
                        <Badge variant="secondary">{creatorStats.liveViewers} viewers</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Viewers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">₹0</p>
                          <p className="text-xs text-muted-foreground">Gifts Received</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">0:00</p>
                          <p className="text-xs text-muted-foreground">Duration</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1" data-testid="button-toggle-camera">
                          <Camera className="w-4 h-4 mr-2" />
                          Camera
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" data-testid="button-toggle-mic">
                          <Mic className="w-4 h-4 mr-2" />
                          Microphone
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1" data-testid="button-filters">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Filters
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Beauty Filters & Effects
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-4">
                              {beautyFilters.map((filter) => (
                                <div
                                  key={filter.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedFilter === filter.id
                                    ? "bg-primary/10 border-primary"
                                    : "bg-secondary border-transparent hover-elevate"
                                    }`}
                                  onClick={() => setSelectedFilter(filter.id)}
                                  data-testid={`filter-${filter.id}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">{filter.name}</p>
                                      <p className="text-sm text-muted-foreground">{filter.description}</p>
                                    </div>
                                    {selectedFilter === filter.id && (
                                      <Badge variant="default" className="ml-2">Active</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      onClick={handleGoLive}
                      data-testid="button-end-stream"
                    >
                      End Live Stream
                    </Button>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Stream Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Beauty Filter</p>
                        <p className="text-sm text-muted-foreground">Auto-enhance appearance</p>
                      </div>
                      <Switch data-testid="switch-beauty-filter" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Allow Gifts</p>
                        <p className="text-sm text-muted-foreground">Receive virtual gifts</p>
                      </div>
                      <Switch defaultChecked data-testid="switch-allow-gifts" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Chat</p>
                        <p className="text-sm text-muted-foreground">Allow viewer messages</p>
                      </div>
                      <Switch defaultChecked data-testid="switch-enable-chat" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PK Battles Tab */}
          <TabsContent value="pk-battles" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    PK Battle Arena
                  </span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {creatorStats.pkWins}W - {creatorStats.pkLosses}L
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">What are PK Battles?</h3>
                  <p className="text-muted-foreground mb-4">
                    Compete with another creator in a 5-minute live battle. Viewers send gifts to support their favorite creator. Most gifts wins!
                  </p>
                  <Button size="lg" className="w-full" data-testid="button-find-pk-opponent">
                    <Zap className="w-4 h-4 mr-2" />
                    Find Opponent
                  </Button>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Battle History</h4>
                  <div className="space-y-3">
                    {pkBattleHistory.map((battle) => (
                      <div
                        key={battle.id}
                        className={`p-4 rounded-lg border ${battle.result === "win"
                          ? "bg-green-500/10 border-green-500/20"
                          : "bg-red-500/10 border-red-500/20"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={battle.result === "win" ? "default" : "secondary"}
                              className={battle.result === "win" ? "bg-green-500" : "bg-red-500"}
                            >
                              {battle.result.toUpperCase()}
                            </Badge>
                            <span className="font-medium">vs {battle.opponent}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{battle.duration}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Points</p>
                            <p className="font-semibold">{battle.points.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Gifts</p>
                            <p className="font-semibold">{battle.gifts}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard & Rankings Tab */}
          <TabsContent value="leaderboard" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top Creators Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${creator.rank <= 3
                      ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
                      : "bg-secondary"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        {creator.rank === 1 && <Crown className="w-6 h-6 text-yellow-500" />}
                        {creator.rank === 2 && <Award className="w-6 h-6 text-gray-400" />}
                        {creator.rank === 3 && <Award className="w-6 h-6 text-orange-400" />}
                        {creator.rank > 3 && (
                          <span className="font-bold text-lg">#{creator.rank}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{creator.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {creator.followers.toLocaleString()} followers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{creator.earnings.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {creator.calls} calls • {creator.pkWins} PK wins
                      </p>
                    </div>
                  </div>
                ))}

                {creatorStats.rank <= 100 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-lg">#{creatorStats.rank}</span>
                        </div>
                        <div>
                          <p className="font-semibold">You</p>
                          <p className="text-sm text-muted-foreground">
                            {creatorStats.followers.toLocaleString()} followers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{creatorStats.earningsThisMonth.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {creatorStats.totalCalls} calls • {creatorStats.pkWins} PK wins
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Earners Today */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Top Earners Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topEarners.map((earner, index) => (
                    <div key={earner.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{earner.name}</p>
                          <p className="text-xs text-muted-foreground">{earner.period}</p>
                        </div>
                      </div>
                      <Badge variant="outline">₹{earner.amount.toLocaleString()}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top PK Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="w-4 h-4 text-primary" />
                    Top PK Champions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topPKPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.wins}W - {player.losses}L
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10">
                        {player.winRate}%
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Discovery Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Discover Creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="hover-elevate cursor-pointer">
                      <CardContent className="pt-6 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-3">
                          <AvatarFallback>C{i}</AvatarFallback>
                        </Avatar>
                        <h4 className="font-semibold mb-1">Creator_{i * 100}</h4>
                        <p className="text-sm text-muted-foreground mb-2">₹{40 + i * 5}/min</p>
                        <Badge variant="secondary" className="mb-3">
                          {(1000 + i * 500).toLocaleString()} followers
                        </Badge>
                        <Button size="sm" className="w-full" data-testid={`button-challenge-creator-${i}`}>
                          <Zap className="w-3 h-3 mr-2" />
                          Challenge to PK
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gifts Tab */}
          <TabsContent value="gifts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Virtual Gifts
                  </span>
                  <Badge variant="secondary">₹{creatorStats.giftsValue.toLocaleString()} earned</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gifts.map((gift) => (
                    <Card key={gift.id} className="hover-elevate cursor-pointer" data-testid={`gift-${gift.id}`}>
                      <CardContent className="pt-6 text-center">
                        <gift.icon className={`w-12 h-12 mx-auto mb-2 ${gift.color}`} />
                        <h4 className="font-semibold mb-1">{gift.name}</h4>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <span>₹{gift.price}</span>
                          <span>•</span>
                          <span>{gift.points} pts</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Gift Conversion Rate</h4>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Your Share</span>
                      <span className="text-2xl font-bold">70%</span>
                    </div>
                    <Progress value={70} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      For every ₹100 in gifts, you earn ₹70
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Top Gifters This Week</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            {i === 1 && <Crown className="w-4 h-4 text-yellow-500" />}
                            {i === 2 && <Star className="w-4 h-4 text-gray-400" />}
                            {i === 3 && <Award className="w-4 h-4 text-orange-400" />}
                          </div>
                          <div>
                            <p className="font-medium">User_{i * 100}</p>
                            <p className="text-xs text-muted-foreground">{15 - i * 2} gifts sent</p>
                          </div>
                        </div>
                        <Badge variant="outline">₹{(500 - i * 100).toLocaleString()}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Earnings Overview
                  </span>
                  <Button onClick={handleWithdraw} data-testid="button-withdraw">
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">Today</p>
                      <p className="text-3xl font-bold mb-1">₹{creatorStats.earningsToday.toLocaleString()}</p>
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +12% from yesterday
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">This Week</p>
                      <p className="text-3xl font-bold mb-1">₹{creatorStats.earningsThisWeek.toLocaleString()}</p>
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +8% from last week
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">This Month</p>
                      <p className="text-3xl font-bold mb-1">₹{creatorStats.earningsThisMonth.toLocaleString()}</p>
                      <p className="text-sm text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +15% from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Earnings Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Video & Voice Calls</p>
                          <p className="text-sm text-muted-foreground">45 calls today</p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{(creatorStats.earningsToday * 0.6).toFixed(0)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Virtual Gifts</p>
                          <p className="text-sm text-muted-foreground">127 gifts received</p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{(creatorStats.earningsToday * 0.3).toFixed(0)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Radio className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Live Streaming</p>
                          <p className="text-sm text-muted-foreground">2 streams today</p>
                        </div>
                      </div>
                      <span className="font-semibold">₹{(creatorStats.earningsToday * 0.1).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Withdrawal Information</h4>
                  <div className="bg-secondary rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Available Balance</span>
                      <span className="text-xl font-bold">₹{creatorStats.earningsToday.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Minimum Withdrawal</span>
                      <span>₹500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Processing Time</span>
                      <span>Instant</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Profile Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.profilePicture} alt="Creator profile picture" />
                      <AvatarFallback className="text-2xl">
                        {profileData.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                      onClick={() => setShowProfilePicturePicker(true)}
                      data-testid="button-settings-creator-upload-photo"
                      aria-label="Change creator profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-medium">Creator profile picture</p>
                    <p className="text-sm text-muted-foreground">Shown on your public profile, calls, and creator listings.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      data-testid="input-profile-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-mobile">Mobile Number</Label>
                    <Input id="profile-mobile" value={profileData.mobile} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Approval Status</Label>
                    <Badge className="bg-green-500">Approved</Badge>
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} data-testid="button-update-profile">Update Profile</Button>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Bank Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-name">Account Holder Name</Label>
                    <Input
                      id="bank-account-name"
                      value={bankData.accountName}
                      onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                      data-testid="input-bank-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-number">Account Number</Label>
                    <Input
                      id="bank-account-number"
                      value={bankData.accountNumber}
                      onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                      data-testid="input-bank-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-ifsc">IFSC Code</Label>
                    <Input
                      id="bank-ifsc"
                      value={bankData.ifscCode}
                      onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                      data-testid="input-bank-ifsc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <Badge className={bankData.verified ? "bg-green-500" : "bg-yellow-500"}>
                      {bankData.verified ? "Verified" : "Pending Verification"}
                    </Badge>
                  </div>
                </div>
                <Button onClick={handleUpdateBank} data-testid="button-update-bank">Update Bank Details</Button>
              </CardContent>
            </Card>

            {/* KYC Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  KYC Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadhar">Aadhar Number</Label>
                    <Input id="aadhar" defaultValue="XXXX XXXX 1234" disabled data-testid="input-aadhar-display" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input id="pan" defaultValue="ABCDE1234F" disabled data-testid="input-pan-display" />
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Note:</strong> KYC documents are verified and cannot be edited.
                    Contact support if you need to update these details.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Withdrawal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="text-2xl font-bold">₹{creatorStats.earningsToday.toLocaleString()}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Minimum Withdrawal</span>
                      <span>₹500</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Processing Time</span>
                      <span>Instant</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Bank Account</span>
                      <span>XXXX1234 (Verified)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter amount (min ₹500)"
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    data-testid="input-withdrawal-amount"
                  />
                  <Button onClick={handleWithdraw} data-testid="button-withdraw">
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Language Preference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Select Language</Label>
                    <select
                      id="language"
                      className="w-full p-2 border rounded-md bg-background"
                      defaultValue="en"
                      data-testid="select-language"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>
                  <Button data-testid="button-save-language">Save Language</Button>
                </div>
              </CardContent>
            </Card>

            {/* Random Match Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-primary" />
                  Random Match Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Enable Random Match</p>
                    <p className="text-sm text-muted-foreground">
                      Allow users to connect with you through random match feature at ₹25/min
                    </p>
                  </div>
                  <Switch
                    checked={randomMatchEnabled}
                    onCheckedChange={setRandomMatchEnabled}
                    data-testid="switch-random-match"
                  />
                </div>
                {randomMatchEnabled && (
                  <>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm">
                        <strong>Note:</strong> When enabled, users clicking the Random Match button will be
                        matched with you at a fixed rate of ₹25/min. This helps increase your visibility
                        and earnings.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label>Allowed Call Types</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          variant={allowedCallTypes === "audio" ? "default" : "outline"}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setAllowedCallTypes("audio")}
                        >
                          <Phone className="w-6 h-6" />
                          <span className="text-sm font-medium">Audio</span>
                        </Button>
                        <Button
                          variant={allowedCallTypes === "video" ? "default" : "outline"}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setAllowedCallTypes("video")}
                        >
                          <Video className="w-6 h-6" />
                          <span className="text-sm font-medium">Video</span>
                        </Button>
                        <Button
                          variant={allowedCallTypes === "both" ? "default" : "outline"}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setAllowedCallTypes("both")}
                        >
                          <Sparkles className="w-6 h-6" />
                          <span className="text-sm font-medium">Both</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select which call types you want to receive. "Both" allows users to choose either audio or video.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Referral Program */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Earn by Referring!</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your referral code and earn ₹500 for each creator who joins and completes 10 calls
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label>Your Referral Code</Label>
                      <div className="flex gap-2 mt-2">
                        <Input value="SARAH2024" readOnly className="font-mono font-bold" data-testid="input-referral-code" />
                        <Button variant="outline" size="icon" data-testid="button-copy-referral">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Referral Link</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value="https://talkin.app/creator/login?ref=SARAH2024"
                          readOnly
                          className="text-sm"
                          data-testid="input-referral-link"
                        />
                        <Button variant="outline" size="icon" data-testid="button-share-referral">
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">₹6,000</p>
                    <p className="text-sm text-muted-foreground">Earned from Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policies & Legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Legal & Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="link-terms-of-use">
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Use
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="link-privacy-policy">
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="link-creator-agreement">
                    <FileText className="w-4 h-4 mr-2" />
                    Creator Agreement
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="link-community-guidelines">
                    <Users className="w-4 h-4 mr-2" />
                    Community Guidelines
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Agency-specific sections */}
        {role === "agency" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                My Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myCreators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{creator.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{creator.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {creator.calls} calls • ₹{creator.earnings.toLocaleString()} earned
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={creator.status === "online" ? "default" : "secondary"} className={creator.status === "online" ? "bg-green-500" : ""}>
                      {creator.status}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">
                      ₹{creator.commission.toLocaleString()} commission
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <Button variant="ghost" size="icon" data-testid="button-nav-home">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-nav-messages">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-nav-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Incoming Call Modal for Creators */}
      {showIncomingCall && (
        <IncomingCallModal
          callerName={incomingCallerName}
          pricePerMinute={25}
          callType={incomingCallType}
          isOutgoing={false}
          showRejectConfirmation={true}
          onAccept={() => {
            if (!incomingCall) return;
            publishCallSignal({ ...incomingCall, status: "accepted", createdAt: Date.now() });
            updateCreatorStatus(incomingCall.creatorId, "on_call");
            setCreatorCallStatus("on_call");
            setShowIncomingCall(false);
            toast({
              title: "Call Accepted",
              description: `You accepted the ${incomingCallType} call from ${incomingCallerName}`,
            });
            const params = new URLSearchParams({
              callType: incomingCall.callType,
              roomId: incomingCall.roomId,
              callerName: incomingCall.callerName,
              price: String(incomingCall.pricePerMinute),
            });
            setLocation(`/creator/call/${incomingCall.creatorId}?${params.toString()}`);
          }}
          onReject={() => {
            if (incomingCall) {
              publishCallSignal({ ...incomingCall, status: "rejected", createdAt: Date.now() });
              updateCreatorStatus(incomingCall.creatorId, "available");
              setCreatorCallStatus("available");
            }
            setShowIncomingCall(false);
            setIncomingCall(null);
            toast({
              title: "Call Rejected",
              description: `You rejected the ${incomingCallType} call from ${incomingCallerName}`,
              variant: "destructive",
            });
          }}
        />
      )}

      <ProfilePicturePicker
        open={showProfilePicturePicker}
        onOpenChange={setShowProfilePicturePicker}
        currentImage={profileData.profilePicture}
        fallbackText={profileData.name}
        title="Change creator profile picture"
        onSelect={handleProfilePictureSelect}
      />
    </div>
  );
}
