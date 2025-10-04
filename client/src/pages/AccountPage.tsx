import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Camera,
  Wallet,
  History,
  UserX,
  Settings,
  Globe,
  MessageSquare,
  LogOut,
  ChevronRight,
  FileText,
  Shield,
  AlertCircle,
  BellOff,
  IndianRupee,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  // Mock user data
  const userProfile = {
    phone: "+91 98765 43210",
    email: "user@example.com",
    profilePicture: "",
    username: "SwiftHawk1234",
  };

  // Mock transactions
  const transactions = [
    { id: "1", date: "2025-01-03", amount: 500, bonus: 50, total: 550 },
    { id: "2", date: "2025-01-01", amount: 1000, bonus: 150, total: 1150 },
    { id: "3", date: "2024-12-28", amount: 200, bonus: 20, total: 220 },
  ];

  // Mock blocked creators
  const [blockedCreators, setBlockedCreators] = useState([
    { id: "1", name: "John Doe", profilePicture: "" },
    { id: "2", name: "Jane Smith", profilePicture: "" },
  ]);

  // Recharge packs
  const rechargePacks = [
    { pay: 100, get: 110, bonus: 10 },
    { pay: 500, get: 550, bonus: 50 },
    { pay: 1000, get: 1150, bonus: 150 },
    { pay: 2000, get: 2350, bonus: 350 },
    { pay: 5000, get: 6000, bonus: 1000 },
  ];

  const languages = ["English", "हिंदी", "தமிழ்", "తెలుగు", "বাংলা"];

  const handleUnblock = (creatorId: string) => {
    setBlockedCreators(blockedCreators.filter((c) => c.id !== creatorId));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const handleRecharge = (pack: typeof rechargePacks[0]) => {
    setShowRechargeModal(false);
    setLocation("/user/recharge");
  };

  // Check if support is enabled (user has completed first call)
  const supportEnabled = localStorage.getItem("firstCallCompleted") === "true";

  const settingsItems = [
    {
      title: "Language",
      description: "Select your preferred language",
      icon: Globe,
      action: (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {languages.map((lang) => (
            <Badge
              key={lang}
              variant={selectedLanguage === lang ? "default" : "outline"}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedLanguage(lang)}
              data-testid={`badge-language-${lang}`}
            >
              {lang}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      title: "DND Mode",
      description: "Stop receiving promotional calls",
      icon: BellOff,
      action: (
        <Switch
          checked={dndEnabled}
          onCheckedChange={setDndEnabled}
          data-testid="switch-dnd"
        />
      ),
    },
    {
      title: "Terms and Conditions",
      icon: FileText,
      onClick: () => window.open("/legal/terms", "_blank"),
    },
    {
      title: "Terms of Use",
      icon: FileText,
      onClick: () => window.open("/legal/terms-of-use", "_blank"),
    },
    {
      title: "Privacy Policy",
      icon: Shield,
      onClick: () => window.open("/legal/privacy", "_blank"),
    },
    {
      title: "Refund/Cancellation Policy",
      icon: FileText,
      onClick: () => window.open("/legal/refund", "_blank"),
    },
    {
      title: "Community Guidelines",
      icon: FileText,
      onClick: () => window.open("/legal/community", "_blank"),
    },
    {
      title: "Content Moderation",
      icon: Shield,
      onClick: () => window.open("/legal/moderation", "_blank"),
    },
    {
      title: "Compliance Statement",
      icon: FileText,
      onClick: () => window.open("/legal/compliance", "_blank"),
    },
    {
      title: "Report a Problem",
      icon: AlertCircle,
      onClick: () => setLocation("/user/report"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Account</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={userProfile.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {userProfile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
                  data-testid="button-upload-photo"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1" data-testid="text-username">
                  {userProfile.username}
                </h2>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span data-testid="text-phone">{userProfile.phone}</span>
                  </div>
                  {userProfile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span data-testid="text-email">{userProfile.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recharge Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => setShowRechargeModal(true)}
          data-testid="button-recharge"
        >
          <Wallet className="w-5 h-5 mr-2" />
          Recharge Wallet
        </Button>

        {/* Talktime Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-5 h-5" />
              Talktime Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div>
                    <div className="font-medium">₹{tx.total}</div>
                    <div className="text-xs text-muted-foreground">{tx.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">Paid ₹{tx.amount}</div>
                    <div className="text-xs text-success">+₹{tx.bonus} bonus</div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blocked Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Blocked Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockedCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between"
                  data-testid={`blocked-creator-${creator.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={creator.profilePicture} />
                      <AvatarFallback>
                        {creator.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{creator.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(creator.id)}
                    data-testid={`button-unblock-${creator.id}`}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
              {blockedCreators.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocked creators
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardContent className="pt-6">
            <Button
              className="w-full"
              variant="outline"
              disabled={!supportEnabled}
              onClick={() => setLocation("/user/support")}
              data-testid="button-support"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {supportEnabled
                ? "Contact Support"
                : "Complete your first call to unlock support"}
            </Button>
            {!supportEnabled && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Support chat is available after your first successful call
              </p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {settingsItems.map((item, index) => {
                const isLanguageOrComplexAction = item.title === "Language";
                
                return (
                  <div key={item.title}>
                    {index > 0 && <Separator className="my-1" />}
                    <div
                      className={`py-3 px-3 ${
                        item.onClick ? "cursor-pointer hover-elevate rounded-md" : ""
                      }`}
                      onClick={item.onClick}
                      data-testid={`setting-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className={`flex items-center ${isLanguageOrComplexAction ? 'mb-3' : 'justify-between'}`}>
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {!isLanguageOrComplexAction && item.action && (
                          item.action
                        )}
                        {!isLanguageOrComplexAction && !item.action && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {isLanguageOrComplexAction && item.action && (
                        <div>
                          {item.action}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Recharge Modal */}
      <Dialog open={showRechargeModal} onOpenChange={setShowRechargeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Recharge Pack</DialogTitle>
            <DialogDescription>
              Choose a recharge pack to add balance to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {rechargePacks.map((pack) => (
              <Card
                key={pack.pay}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => handleRecharge(pack)}
                data-testid={`recharge-pack-${pack.pay}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        Pay ₹{pack.pay}
                      </div>
                      <div className="text-sm text-success">
                        +₹{pack.bonus} bonus
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" />
                        Get ₹{pack.get}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((pack.bonus / pack.pay) * 100)}% extra
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
