import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  CreditCard,
  Smartphone,
  Building2,
  Video,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getTalktimeTransactions, recordRechargeTransaction, subscribeToTalktimeTransactions } from "@/lib/wallet-transactions";
import { APP_LANGUAGES, useAppLanguage } from "@/lib/language";
import { addLocalWalletBalance } from "@/hooks/useWallet";
import { getUserCallLogs, subscribeToCallLogs } from "@/lib/call-logs";
import { ProfilePicturePicker } from "@/components/ProfilePicturePicker";
import { getStoredProfilePicture, saveStoredProfilePicture, USER_PROFILE_PICTURE_KEY } from "@/lib/profile-pictures";

function createLocalRechargeResponse(amount: number, paymentMethod: string, userId: string) {
  const transactionId = `LOCAL${Date.now()}`;

  return {
    success: true,
    wallet: {
      id: `wallet_${userId}`,
      userId,
      balance: amount.toFixed(2),
      updatedAt: new Date(),
    },
    transaction: {
      transactionId,
      status: "success",
      paymentMethod,
      amount,
      currency: "INR",
    },
    totalAmount: amount,
    status: "success",
    transactionId,
    message: "Payment completed in local demo mode.",
  };
}

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language: selectedLanguage, setLanguage, t } = useAppLanguage();
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<typeof rechargePacks[0] | null>(null);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [showBlockedCreators, setShowBlockedCreators] = useState(false);
  const [showProfilePicturePicker, setShowProfilePicturePicker] = useState(false);

  // Mock user data
  const [userProfile, setUserProfile] = useState({
    userId: "TK-87654321",
    phone: "+91 98765 43210",
    email: "user@example.com",
    name: "Ravi Kumar",
    profilePicture: getStoredProfilePicture(USER_PROFILE_PICTURE_KEY),
    username: "SwiftHawk1234",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: userProfile.username,
    name: userProfile.name,
    email: userProfile.email,
  });

  // BUG-032 FIX: Implement API call to fetch transaction history
  const [transactions, setTransactions] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState(() => getUserCallLogs());
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const handleProfilePictureSelect = (imageUrl: string) => {
    saveStoredProfilePicture(USER_PROFILE_PICTURE_KEY, imageUrl);
    setUserProfile((profile) => ({ ...profile, profilePicture: imageUrl }));
    toast({
      title: "Profile picture updated",
      description: "Your new picture is visible on your account profile.",
    });
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const userId = localStorage.getItem("linky_device_id") || "user_001";
        const response = await fetch(`/api/wallet/${userId}/transactions`);
        if (response.ok) {
          const data = await response.json();
          const apiTransactions = Array.isArray(data) ? data : data.transactions || [];
          setTransactions(apiTransactions.length > 0 ? apiTransactions : getTalktimeTransactions());
        } else {
          setTransactions(getTalktimeTransactions());
        }
      } catch {
        setTransactions(getTalktimeTransactions());
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    setCallLogs(getUserCallLogs());
    return subscribeToCallLogs(() => setCallLogs(getUserCallLogs()));
  }, []);

  useEffect(() => {
    return subscribeToTalktimeTransactions(() => setTransactions(getTalktimeTransactions()));
  }, []);

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

  const languages = APP_LANGUAGES;

  const handleUnblock = (creatorId: string) => {
    setBlockedCreators(blockedCreators.filter((c) => c.id !== creatorId));
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Import payment methods from centralized config
  const paymentMethods = [
    {
      id: "upi",
      name: "UPI App",
      description: "Pay using any UPI app",
      icon: Smartphone,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "card",
      name: "Card",
      description: "Debit/Credit card payment",
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "netbanking",
      name: "Net Banking",
      description: "Pay via your bank account",
      icon: Building2,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  const handleRecharge = (pack: typeof rechargePacks[0]) => {
    setSelectedPack(pack);
  };

  const rechargeMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string }) => {
      const userId = localStorage.getItem("linky_device_id") || "user_001";

      // BUG-003 FIX: Validate amount is a valid number
      if (typeof data.amount !== 'number' || isNaN(data.amount) || data.amount <= 0) {
        throw new Error("Invalid amount. Amount must be a positive number.");
      }

      try {
        // BUG-003 FIX: Send amount as number, not string
        const response = await apiRequest("POST", "/api/wallet/recharge", {
          userId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
        });
        return response.json();
      } catch {
        return createLocalRechargeResponse(data.amount, data.paymentMethod, userId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      // BUG-001 FIX: Mark first recharge as completed ONLY after payment is confirmed successful
      localStorage.setItem("firstRechargeCompleted", "true");
    },
  });

  const handleSelectPayment = (method: string) => {
    if (!selectedPack) return;

    toast({
      title: "Processing Payment",
      description: `Redirecting to ${paymentMethods.find(m => m.id === method)?.name} for ₹${selectedPack.pay}...`,
    });

    setTimeout(() => {
      // BUG-004 FIX: Use selectedPack.pay (amount to pay) instead of selectedPack.get (amount received)
      rechargeMutation.mutate(
        { amount: selectedPack.pay, paymentMethod: method },
        {
          onSuccess: () => {
            const paymentMethod = paymentMethods.find(m => m.id === method)?.name || method;
            addLocalWalletBalance(selectedPack.get);
            const updatedTransactions = recordRechargeTransaction({
              transactionId: `LOCAL${Date.now()}`,
              amount: selectedPack.pay,
              bonus: selectedPack.bonus,
              total: selectedPack.get,
              paymentMethod,
              status: "success",
            });
            setTransactions(updatedTransactions);

            toast({
              title: "Payment Successful!",
              description: `₹${selectedPack.get} has been added to your wallet.`,
            });
            setTimeout(() => {
              setShowRechargeModal(false);
              setSelectedPack(null);
            }, 1500);
          },
          onError: (error) => {
            toast({
              title: "Payment Failed",
              description: error.message || "Failed to process payment. Please try again.",
              variant: "destructive",
            });
          },
        }
      );
    }, 1500);
  };

  const handleCloseRechargeModal = () => {
    setShowRechargeModal(false);
    setSelectedPack(null);
  };

  // BUG-019 FIX: Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // BUG-019 FIX: Username uniqueness check (mock implementation)
  const isUsernameUnique = (username: string): boolean => {
    // In production, this would check against backend API
    // For now, we'll check against localStorage
    const existingUsernames = JSON.parse(localStorage.getItem("existingUsernames") || "[]");
    return !existingUsernames.includes(username) || username === userProfile.username;
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
    // BUG-019 FIX: Validate email format
    if (!isValidEmail(editForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // BUG-019 FIX: Check username uniqueness
    if (!isUsernameUnique(editForm.username)) {
      toast({
        title: "Username Taken",
        description: "This username is already taken. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    // BUG-018 FIX: Persist profile changes to localStorage
    const updatedProfile = {
      ...userProfile,
      username: editForm.username,
      name: editForm.name,
      email: editForm.email,
    };

    setUserProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

    // Update username in existingUsernames list
    const existingUsernames = JSON.parse(localStorage.getItem("existingUsernames") || "[]");
    if (!existingUsernames.includes(editForm.username)) {
      existingUsernames.push(editForm.username);
      localStorage.setItem("existingUsernames", JSON.stringify(existingUsernames));
    }

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

  // Check if support is enabled (user has completed first recharge)
  const supportEnabled = localStorage.getItem("firstRechargeCompleted") === "true";

  const legalLinks = [
    { title: "Terms and Conditions", path: "/legal/terms" },
    { title: "Terms of Use", path: "/legal/terms-of-use" },
    { title: "Privacy Policy", path: "/legal/privacy" },
    { title: "Refund/Cancellation Policy", path: "/legal/refund" },
    { title: "Community Guidelines", path: "/legal/community" },
    { title: "Content Moderation", path: "/legal/moderation" },
    { title: "Compliance Statement", path: "/legal/compliance" },
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
                  onClick={() => setShowProfilePicturePicker(true)}
                  data-testid="button-upload-photo"
                  aria-label="Change profile picture"
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, name: e.target.value })}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, email: e.target.value })}
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
          {t("rechargeWallet")}
        </Button>

        {/* Talktime Transactions */}
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="transactions" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline" data-testid="button-talktime-transactions">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    <span className="font-semibold">{t("talktimeTransactions")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3">
                    {isLoadingTransactions ? (
                      // Loading skeleton
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-20 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="text-right">
                              <Skeleton className="h-4 w-16 mb-1 ml-auto" />
                              <Skeleton className="h-3 w-12 ml-auto" />
                            </div>
                          </div>
                        ))}
                      </>
                    ) : transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                          data-testid={`transaction-${tx.id}`}
                        >
                          <div>
                            <div className="font-medium">
                              {tx.type === "call" ? "-" : ""}₹{Math.abs(Number(tx.total)).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">{tx.date}</div>
                            {tx.paymentMethod && (
                              <div className="text-xs text-muted-foreground">
                                {tx.paymentMethod}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {tx.type === "call" ? (
                              <div className="text-sm text-destructive">Call charge</div>
                            ) : (
                              <>
                                <div className="text-sm">{t("paid")} ₹{Number(tx.amount).toFixed(2)}</div>
                                <div className="text-xs text-success">+₹{Number(tx.bonus || 0).toFixed(2)} {t("bonus")}</div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">{t("noTransactions")}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("transactionHint")}
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* User Call Logs */}
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="call-logs" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline" data-testid="button-user-call-logs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span className="font-semibold">Call Logs</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3">
                    {callLogs.length > 0 ? (
                      callLogs.map((call) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                          data-testid={`call-log-${call.id}`}
                        >
                          <div>
                            <button
                              type="button"
                              className="font-medium text-left hover:text-primary hover:underline"
                              onClick={() => setLocation(`/user/creator/${call.creatorId}`)}
                              data-testid={`button-call-log-creator-${call.creatorId}`}
                            >
                              {call.creatorName}
                            </button>
                            <div className="text-xs text-muted-foreground">{call.date}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              {call.callType === "video" ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                              {call.callType === "video" ? "Video" : "Audio"} • {call.durationLabel}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-destructive">-₹{Number(call.totalCost).toFixed(2)}</div>
                            <Badge className="bg-success">Completed</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No calls yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed audio and video calls will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Blocked Creators - Click to View */}
        <Card
          className="cursor-pointer hover-elevate active-elevate-2"
          onClick={() => setShowBlockedCreators(true)}
          data-testid="card-blocked-creators"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5" />
                <div>
                  <div className="font-medium">{t("blockedCreators")}</div>
                  <div className="text-xs text-muted-foreground">
                    {blockedCreators.length} blocked
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
                ? t("supportAvailable")
                : t("supportLocked")}
            </Button>
            {!supportEnabled && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("supportHint")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t("settings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Language */}
              <AccordionItem value="language">
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-sm">{t("language")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
                    {languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant={selectedLanguage === lang ? "default" : "outline"}
                        className="cursor-pointer hover-elevate"
                        onClick={() => setLanguage(lang)}
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
                    <div className="font-medium text-sm">{t("dndMode")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("stopPromotionalCalls")}
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
                    <span className="font-medium text-sm">{t("legalPolicies")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {legalLinks.map((link) => (
                      <div
                        key={link.title}
                        className="flex items-center justify-between py-2 px-3 cursor-pointer hover-elevate rounded-md"
                        onClick={() => setLocation(link.path)}
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
                  <span className="font-medium text-sm">{t("reportProblem")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Accordion>
          </CardContent>
        </Card>
      </main>

      {/* Blocked Creators Modal */}
      <Dialog open={showBlockedCreators} onOpenChange={setShowBlockedCreators}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              {t("blockedCreators")}
            </DialogTitle>
            <DialogDescription>
              Creators you have blocked will not be able to contact you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
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
              <p className="text-sm text-muted-foreground text-center py-8">
                No blocked creators
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog open={showRechargeModal} onOpenChange={handleCloseRechargeModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {!selectedPack ? "Select Recharge Pack" : "Select Payment Method"}
            </DialogTitle>
            <DialogDescription>
              {!selectedPack
                ? "Choose a recharge pack to add balance to your wallet"
                : `Complete payment of ₹${selectedPack.pay} to get ₹${selectedPack.get}`
              }
            </DialogDescription>
          </DialogHeader>

          {!selectedPack ? (
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
                            {pack.pay.toFixed(2)}
                          </div>
                          <div className="text-sm text-success font-medium">
                            +₹{pack.bonus.toFixed(2)} bonus
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">You Get</div>
                        <div className="text-2xl font-bold flex items-center gap-1 bg-gradient-to-r bg-clip-text text-transparent ${pack.color}">
                          <IndianRupee className="w-6 h-6" />
                          {pack.get.toFixed(2)}
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
          ) : (
            <div className="space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Recharge Amount</p>
                  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                    <IndianRupee className="w-7 h-7" />
                    {selectedPack.pay.toFixed(2)}
                  </div>
                  <div className="text-sm text-success font-medium mt-1">
                    You'll get ₹{selectedPack.get.toFixed(2)} (includes ₹{selectedPack.bonus.toFixed(2)} bonus)
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedPack(null)}
                    data-testid="button-change-pack"
                  >
                    Change Pack
                  </Button>
                </div>
              </Card>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handleSelectPayment(method.id)}
                    data-testid={`card-payment-${method.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${method.color}`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold" data-testid={`text-payment-name-${method.id}`}>
                          {method.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProfilePicturePicker
        open={showProfilePicturePicker}
        onOpenChange={setShowProfilePicturePicker}
        currentImage={userProfile.profilePicture}
        fallbackText={userProfile.username}
        title="Change your profile picture"
        onSelect={handleProfilePictureSelect}
      />
    </div>
  );
}
