import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  AlertCircle,
  BellOff,
  IndianRupee,
  Copy,
  Check,
  Edit,
  IdCard,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isEditing, setIsEditing] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  // Mock user data
  const [userProfile, setUserProfile] = useState({
    userId: "TK-87654321",
    phone: "+91 98765 43210",
    email: "user@example.com",
    name: "Ravi Kumar",
    profilePicture: "",
    username: "SwiftHawk1234",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: userProfile.username,
    name: userProfile.name,
    email: userProfile.email,
  });

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

  // Recharge packs with colors and emojis
  const rechargePacks = [
    { pay: 100, get: 110, bonus: 10, emoji: "🌟", color: "from-blue-500 to-cyan-500", label: "Starter" },
    { pay: 500, get: 550, bonus: 50, emoji: "💎", color: "from-purple-500 to-pink-500", label: "Popular" },
    { pay: 1000, get: 1150, bonus: 150, emoji: "🚀", color: "from-orange-500 to-red-500", label: "Best Value" },
    { pay: 2000, get: 2350, bonus: 350, emoji: "👑", color: "from-yellow-500 to-orange-500", label: "Premium" },
    { pay: 5000, get: 6000, bonus: 1000, emoji: "💰", color: "from-green-500 to-emerald-500", label: "Ultimate" },
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

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditForm({
      username: userProfile.username,
      name: userProfile.name,
      email: userProfile.email,
    });
  };

  const handleSaveProfile = () => {
    setUserProfile({
      ...userProfile,
      username: editForm.username,
      name: editForm.name,
      email: editForm.email,
    });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      username: userProfile.username,
      name: userProfile.name,
      email: userProfile.email,
    });
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userProfile.userId);
    setCopiedUserId(true);
    toast({
      title: "User ID Copied",
      description: "User ID has been copied to clipboard.",
    });
    setTimeout(() => setCopiedUserId(false), 2000);
  };

  // Check if support is enabled (user has completed first call)
  const supportEnabled = localStorage.getItem("firstCallCompleted") === "true";

  const legalLinks = [
    { title: "Terms and Conditions", onClick: () => window.open("/legal/terms", "_blank") },
    { title: "Terms of Use", onClick: () => window.open("/legal/terms-of-use", "_blank") },
    { title: "Privacy Policy", onClick: () => window.open("/legal/privacy", "_blank") },
    { title: "Refund/Cancellation Policy", onClick: () => window.open("/legal/refund", "_blank") },
    { title: "Community Guidelines", onClick: () => window.open("/legal/community", "_blank") },
    { title: "Content Moderation", onClick: () => window.open("/legal/moderation", "_blank") },
    { title: "Compliance Statement", onClick: () => window.open("/legal/compliance", "_blank") },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/user")}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Account</h1>
          </div>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Profile</CardTitle>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                data-testid="button-edit-profile"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  data-testid="button-save-profile"
                >
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div className="flex-1 space-y-3">
                {/* User ID with Copy Button */}
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <IdCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono flex-1" data-testid="text-user-id">
                    {userProfile.userId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleCopyUserId}
                    data-testid="button-copy-user-id"
                  >
                    {copiedUserId ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Username
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, username: e.target.value })}
                      placeholder="Enter username"
                      data-testid="input-username"
                    />
                  ) : (
                    <div className="text-sm font-medium" data-testid="text-username">
                      {userProfile.username}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter name"
                      data-testid="input-name"
                    />
                  ) : (
                    <div className="text-sm font-medium" data-testid="text-name">
                      {userProfile.name}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter email"
                      data-testid="input-email"
                    />
                  ) : (
                    <div className="text-sm font-medium" data-testid="text-email">
                      {userProfile.email}
                    </div>
                  )}
                </div>

                {/* Mobile (Read-only) */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Mobile Number
                  </label>
                  <div className="text-sm font-medium text-muted-foreground" data-testid="text-phone">
                    {userProfile.phone}
                  </div>
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
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transactions" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline" data-testid="button-talktime-transactions">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    <span className="font-semibold">Talktime Transactions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            <Accordion type="single" collapsible className="w-full">
              {/* Language */}
              <AccordionItem value="language">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Language</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
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
                </AccordionContent>
              </AccordionItem>

              {/* DND Mode */}
              <div className="flex items-center justify-between py-3 px-3 border-b">
                <div className="flex items-center gap-3">
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">DND Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Stop receiving promotional calls
                    </div>
                  </div>
                </div>
                <Switch
                  checked={dndEnabled}
                  onCheckedChange={setDndEnabled}
                  data-testid="switch-dnd"
                />
              </div>

              {/* Legal & Policies */}
              <AccordionItem value="legal">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-sm">Legal & Policies</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {legalLinks.map((link) => (
                      <div
                        key={link.title}
                        className="flex items-center justify-between py-2 px-3 cursor-pointer hover-elevate rounded-md"
                        onClick={link.onClick}
                        data-testid={`legal-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <span className="text-sm">{link.title}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Report a Problem */}
              <div
                className="flex items-center justify-between py-3 px-3 border-b cursor-pointer hover-elevate rounded-md"
                onClick={() => setLocation("/user/report")}
                data-testid="setting-report-a-problem"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-sm">Report a Problem</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Accordion>
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
              <div
                key={pack.pay}
                className={`relative cursor-pointer rounded-xl p-1 bg-gradient-to-r ${pack.color} hover:scale-105 transition-transform duration-200`}
                onClick={() => handleRecharge(pack)}
                data-testid={`recharge-pack-${pack.pay}`}
              >
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{pack.emoji}</span>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase">
                          {pack.label}
                        </div>
                        <div className="font-bold text-lg flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {pack.pay}
                        </div>
                        <div className="text-sm text-success font-medium">
                          +₹{pack.bonus} bonus
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">You Get</div>
                      <div className="text-2xl font-bold flex items-center gap-1 bg-gradient-to-r bg-clip-text text-transparent ${pack.color}">
                        <IndianRupee className="w-6 h-6" />
                        {pack.get}
                      </div>
                      <div className="text-xs font-semibold text-success">
                        {Math.round((pack.bonus / pack.pay) * 100)}% extra
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
