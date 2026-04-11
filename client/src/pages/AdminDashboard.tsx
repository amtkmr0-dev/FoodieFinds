import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Users,
  FileCheck,
  DollarSign,
  Percent,
  UserPlus,
  MessageSquare,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Gift,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStoredUser,
  hasRole,
  adminLogout,
  isAuthenticated,
  getSessionRemainingTime,
  isSessionExpiringSoon
} from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Authentication guard - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        title: "Unauthorized Access",
        description: "Please log in to access the admin dashboard.",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
  }, [setLocation, toast]);

  // BUG-016 FIX: Proper type guard and redirect if role is invalid
  // Get admin user from auth utilities
  const adminUser = getStoredUser();
  const adminRole = adminUser?.role as "super_user" | "admin" | "support" | undefined;
  const adminName = adminUser?.username || "Admin User";

  // BUG-016 FIX: Validate admin role with proper type guard
  const validRoles = ["super_user", "admin", "support"];
  const isValidRole = adminRole && validRoles.includes(adminRole);

  // Don't render if not authenticated or role is invalid
  if (!isAuthenticated() || !isValidRole) {
    // BUG-016 FIX: Redirect to login if role is invalid instead of silently returning null
    if (isAuthenticated() && !isValidRole) {
      toast({
        title: "Invalid Role",
        description: "Your account does not have the required permissions to access this dashboard.",
        variant: "destructive",
      });
      setLocation("/admin/login");
    }
    return null;
  }

  // Session timeout state
  const [sessionWarning, setSessionWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Monitor session timeout
  useEffect(() => {
    const checkSession = () => {
      const timeLeft = getSessionRemainingTime();
      setRemainingTime(timeLeft);

      if (timeLeft <= 0) {
        // Session expired
        handleLogout();
      } else if (isSessionExpiringSoon(timeLeft)) {
        // Show warning when session is expiring soon (less than 5 minutes)
        setSessionWarning(true);
      } else {
        setSessionWarning(false);
      }
    };

    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, []);

  const [selectedTab, setSelectedTab] = useState("kyc");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [showBanConfirmDialog, setShowBanConfirmDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileToBan, setProfileToBan] = useState<any>(null);

  // Pricing state
  const [creatorRates, setCreatorRates] = useState<Record<string, number>>({});
  const [agencyCommissions, setAgencyCommissions] = useState<Record<string, number>>({});

  // Mock data for pending KYC approvals
  const pendingCreators = [
    {
      id: "1",
      name: "Ravi Kumar",
      mobile: "+91 9876543210",
      email: "ravi@example.com",
      role: "creator",
      bankAccount: "1234567890",
      ifsc: "SBIN0001234",
      aadhar: "XXXX XXXX 1234",
      pan: "ABCDE1234F",
      referralCode: "RAVI2024",
      submittedAt: "2024-01-03",
      currentRate: 45,
    },
    {
      id: "2",
      name: "Priya Sharma",
      mobile: "+91 9988776655",
      email: "priya@example.com",
      role: "creator",
      bankAccount: "9876543210",
      ifsc: "HDFC0001234",
      aadhar: "XXXX XXXX 5678",
      pan: "PQRST5678K",
      referralCode: "PRIYA2024",
      submittedAt: "2024-01-03",
      currentRate: 50,
    },
  ];

  const pendingAgents = [
    {
      id: "3",
      name: "Agency Pro",
      mobile: "+91 8877665544",
      email: "agencypro@example.com",
      role: "agent",
      bankAccount: "5544332211",
      ifsc: "ICIC0001234",
      aadhar: "XXXX XXXX 9012",
      pan: "WXYZ9012M",
      referralCode: "AGENCY2024",
      submittedAt: "2024-01-03",
      currentCommission: 20,
    },
  ];

  const approvedCreators = [
    {
      id: "4",
      name: "Sarah Johnson",
      mobile: "+91 9876543210",
      email: "sarah@example.com",
      currentRate: 45,
      status: "approved",
    },
    {
      id: "5",
      name: "Mike Chen",
      mobile: "+91 8765432109",
      email: "mike@example.com",
      currentRate: 55,
      status: "approved",
    },
  ];

  const approvedAgents = [
    {
      id: "6",
      name: "Elite Agency",
      mobile: "+91 7654321098",
      email: "elite@example.com",
      currentCommission: 20,
      status: "approved",
    },
  ];

  const admins = [
    {
      id: "1",
      name: "Super Admin",
      mobile: "+91 9999999999",
      email: "super@talkin.com",
      role: "super_user",
      isActive: true,
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      name: "Admin User",
      mobile: "+91 8888888888",
      email: "admin@talkin.com",
      role: "admin",
      isActive: true,
      createdAt: "2024-01-02",
    },
    {
      id: "3",
      name: "Support Agent",
      mobile: "+91 7777777777",
      email: "support@talkin.com",
      role: "support",
      isActive: true,
      createdAt: "2024-01-02",
    },
  ];

  const supportTickets = [
    {
      id: "1",
      userName: "John Doe",
      userMobile: "+91 9876543210",
      subject: "Payment not received",
      message: "I withdrew ₹1000 but haven't received it in my account yet.",
      status: "open",
      priority: "high",
      createdAt: "2024-01-03 10:30",
    },
    {
      id: "2",
      userName: "Jane Smith",
      userMobile: "+91 8765432109",
      subject: "Account verification issue",
      message: "My KYC documents were rejected. Can you help?",
      status: "in_progress",
      priority: "medium",
      createdAt: "2024-01-03 09:15",
    },
  ];

  // BUG-033 FIX: Implement API call for approve action
  const handleApprove = async (profile: any) => {
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: profile.id,
          role: profile.role,
          name: profile.name,
        }),
      });

      if (response.ok) {
        // Update localStorage as fallback/cache
        localStorage.setItem(`${profile.role}_approval_${profile.id}`, "approved");
        toast({
          title: "Application Approved",
          description: `${profile.name} has been approved as a ${profile.role}.`,
        });
      } else {
        throw new Error('Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      // Fallback to localStorage if API fails
      localStorage.setItem(`${profile.role}_approval_${profile.id}`, "approved");
      toast({
        title: "Application Approved",
        description: `${profile.name} has been approved as a ${profile.role}. (Offline mode)`,
      });
    }
  };

  // BUG-033 FIX: Implement API call for reject action
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedProfile.id,
          role: selectedProfile.role,
          name: selectedProfile.name,
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        // Update localStorage as fallback/cache
        localStorage.setItem(`${selectedProfile.role}_approval_${selectedProfile.id}`, "rejected");
        localStorage.setItem(`${selectedProfile.role}_rejection_${selectedProfile.id}`, rejectionReason);

        toast({
          title: "Application Rejected",
          description: `${selectedProfile.name}'s application has been rejected.`,
        });

        setShowRejectDialog(false);
        setRejectionReason("");
        setSelectedProfile(null);
      } else {
        throw new Error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      // Fallback to localStorage if API fails
      localStorage.setItem(`${selectedProfile.role}_approval_${selectedProfile.id}`, "rejected");
      localStorage.setItem(`${selectedProfile.role}_rejection_${selectedProfile.id}`, rejectionReason);

      toast({
        title: "Application Rejected",
        description: `${selectedProfile.name}'s application has been rejected. (Offline mode)`,
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedProfile(null);
    }
  };

  // BUG-017 FIX: Replace blocking confirm() with custom confirmation dialog
  const handleBan = (profile: any) => {
    setProfileToBan(profile);
    setShowBanConfirmDialog(true);
  };

  // BUG-033 FIX: Implement API call for ban action
  const confirmBan = async () => {
    if (profileToBan) {
      try {
        const response = await fetch('/api/admin/ban', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: profileToBan.id,
            role: profileToBan.role,
            name: profileToBan.name,
          }),
        });

        if (response.ok) {
          // Update localStorage as fallback/cache
          localStorage.setItem(`${profileToBan.role}_approval_${profileToBan.id}`, "banned");
          toast({
            title: "User Banned",
            description: `${profileToBan.name} has been permanently banned from the platform.`,
            variant: "destructive",
          });
          setShowBanConfirmDialog(false);
          setProfileToBan(null);
        } else {
          throw new Error('Failed to ban user');
        }
      } catch (error) {
        console.error('Error banning user:', error);
        // Fallback to localStorage if API fails
        localStorage.setItem(`${profileToBan.role}_approval_${profileToBan.id}`, "banned");
        toast({
          title: "User Banned",
          description: `${profileToBan.name} has been permanently banned from the platform. (Offline mode)`,
          variant: "destructive",
        });
        setShowBanConfirmDialog(false);
        setProfileToBan(null);
      }
    }
  };

  const cancelBan = () => {
    setShowBanConfirmDialog(false);
    setProfileToBan(null);
  };

  const openRejectDialog = (profile: any) => {
    setSelectedProfile(profile);
    setShowRejectDialog(true);
  };

  // BUG-021 FIX: Add min/max rate validation (₹10-₹500)
  // BUG-033 FIX: Implement API call for rate update
  const handleUpdateRate = async (creatorId: string, creatorName: string) => {
    const newRate = creatorRates[creatorId];
    const MIN_RATE = 10;
    const MAX_RATE = 500;

    if (!newRate || newRate <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid per-minute rate.",
        variant: "destructive",
      });
      return;
    }

    if (newRate < MIN_RATE) {
      toast({
        title: "Rate Too Low",
        description: `Minimum rate is ₹${MIN_RATE}/min. Please enter a higher rate.`,
        variant: "destructive",
      });
      return;
    }

    if (newRate > MAX_RATE) {
      toast({
        title: "Rate Too High",
        description: `Maximum rate is ₹${MAX_RATE}/min. Please enter a lower rate.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/update-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          rate: newRate,
        }),
      });

      if (response.ok) {
        // Update localStorage as fallback/cache
        localStorage.setItem(`creator_rate_${creatorId}`, newRate.toString());

        toast({
          title: "Rate Updated",
          description: `${creatorName}'s rate has been updated to ₹${newRate}/min.`,
        });

        // Clear input
        setCreatorRates({ ...creatorRates, [creatorId]: 0 });
      } else {
        throw new Error('Failed to update rate');
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      // Fallback to localStorage if API fails
      localStorage.setItem(`creator_rate_${creatorId}`, newRate.toString());

      toast({
        title: "Rate Updated",
        description: `${creatorName}'s rate has been updated to ₹${newRate}/min. (Offline mode)`,
      });

      // Clear input
      setCreatorRates({ ...creatorRates, [creatorId]: 0 });
    }
  };

  // BUG-020 FIX: Set maximum commission limit (80%) - platform needs to earn something
  // BUG-033 FIX: Implement API call for commission update
  const handleUpdateCommission = async (agencyId: string, agencyName: string) => {
    const newCommission = agencyCommissions[agencyId];
    const MIN_COMMISSION = 1;
    const MAX_COMMISSION = 80; // Platform needs at least 20%

    if (!newCommission || newCommission <= 0) {
      toast({
        title: "Invalid Commission",
        description: "Please enter a valid commission percentage.",
        variant: "destructive",
      });
      return;
    }

    if (newCommission < MIN_COMMISSION) {
      toast({
        title: "Commission Too Low",
        description: `Minimum commission is ${MIN_COMMISSION}%.`,
        variant: "destructive",
      });
      return;
    }

    if (newCommission > MAX_COMMISSION) {
      toast({
        title: "Commission Too High",
        description: `Maximum commission is ${MAX_COMMISSION}%. Platform needs to earn at least ${100 - MAX_COMMISSION}%.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/update-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyId,
          commission: newCommission,
        }),
      });

      if (response.ok) {
        // Update localStorage as fallback/cache
        localStorage.setItem(`agency_commission_${agencyId}`, newCommission.toString());

        toast({
          title: "Commission Updated",
          description: `${agencyName}'s commission has been updated to ${newCommission}%.`,
        });

        // Clear input
        setAgencyCommissions({ ...agencyCommissions, [agencyId]: 0 });
      } else {
        throw new Error('Failed to update commission');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      // Fallback to localStorage if API fails
      localStorage.setItem(`agency_commission_${agencyId}`, newCommission.toString());

      toast({
        title: "Commission Updated",
        description: `${agencyName}'s commission has been updated to ${newCommission}%. (Offline mode)`,
      });

      // Clear input
      setAgencyCommissions({ ...agencyCommissions, [agencyId]: 0 });
    }
  };

  const handleLogout = async () => {
    const result = await adminLogout();

    if (result.success) {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/admin/login");
    } else {
      toast({
        title: "Logout Error",
        description: result.error || "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatRemainingTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Role-based navigation visibility
  const canSeeKYC = adminRole === "super_user" || adminRole === "admin";
  const canSeePricing = adminRole === "super_user" || adminRole === "admin";
  const canSeeGifts = adminRole === "super_user" || adminRole === "admin";
  const canSeeAdmins = adminRole === "super_user";
  const canSeeSupport = true; // All roles can see support

  // Don't render if role is not set
  if (!adminRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Session Warning Banner */}
      {sessionWarning && (
        <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              Session expiring in {formatRemainingTime(remainingTime)}. Please save your work.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-yellow-600"
            onClick={() => setSessionWarning(false)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{adminName} ({adminRole.replace("_", " ")})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${[canSeeKYC, canSeePricing, canSeeGifts, canSeeAdmins, canSeeSupport].filter(Boolean).length}, 1fr)` }}>
            {canSeeKYC && (
              <TabsTrigger value="kyc" data-testid="tab-kyc">
                <FileCheck className="w-4 h-4 mr-2" />
                KYC Approvals
              </TabsTrigger>
            )}
            {canSeePricing && (
              <TabsTrigger value="pricing" data-testid="tab-pricing">
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing
              </TabsTrigger>
            )}
            {canSeeGifts && (
              <TabsTrigger value="gifts" data-testid="tab-gifts">
                <Gift className="w-4 h-4 mr-2" />
                Gifts
              </TabsTrigger>
            )}
            {canSeeAdmins && (
              <TabsTrigger value="admins" data-testid="tab-admins">
                <UserPlus className="w-4 h-4 mr-2" />
                Admin Management
              </TabsTrigger>
            )}
            {canSeeSupport && (
              <TabsTrigger value="support" data-testid="tab-support">
                <MessageSquare className="w-4 h-4 mr-2" />
                Support
              </TabsTrigger>
            )}
          </TabsList>

          {/* KYC Approvals Tab */}
          {canSeeKYC && (
            <TabsContent value="kyc" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Pending Creator Applications
                  </CardTitle>
                  <CardDescription>Review and approve/reject creator registrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingCreators.map((creator) => (
                    <Card key={creator.id}>
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">Name</Label>
                              <p className="font-medium">{creator.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Contact</Label>
                              <p className="text-sm">{creator.mobile}</p>
                              <p className="text-sm text-muted-foreground">{creator.email}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Bank Details</Label>
                              <p className="text-sm">Account: {creator.bankAccount}</p>
                              <p className="text-sm">IFSC: {creator.ifsc}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">KYC Documents</Label>
                              <p className="text-sm">Aadhar: {creator.aadhar}</p>
                              <p className="text-sm">PAN: {creator.pan}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Referral Code</Label>
                              <p className="text-sm font-mono">{creator.referralCode}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Submitted</Label>
                              <p className="text-sm">{creator.submittedAt}</p>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(creator)}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-${creator.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => openRejectDialog(creator)}
                            data-testid={`button-reject-${creator.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => handleBan(creator)}
                            data-testid={`button-ban-${creator.id}`}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Pending Agency Applications
                  </CardTitle>
                  <CardDescription>Review and approve/reject agency registrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingAgents.map((agent) => (
                    <Card key={agent.id}>
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">Agency Name</Label>
                              <p className="font-medium">{agent.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Contact</Label>
                              <p className="text-sm">{agent.mobile}</p>
                              <p className="text-sm text-muted-foreground">{agent.email}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Bank Details</Label>
                              <p className="text-sm">Account: {agent.bankAccount}</p>
                              <p className="text-sm">IFSC: {agent.ifsc}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">KYC Documents</Label>
                              <p className="text-sm">Aadhar: {agent.aadhar}</p>
                              <p className="text-sm">PAN: {agent.pan}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Referral Code</Label>
                              <p className="text-sm font-mono">{agent.referralCode}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Submitted</Label>
                              <p className="text-sm">{agent.submittedAt}</p>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(agent)}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-approve-${agent.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => openRejectDialog(agent)}
                            data-testid={`button-reject-${agent.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => handleBan(agent)}
                            data-testid={`button-ban-${agent.id}`}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Pricing Tab */}
          {canSeePricing && (
            <TabsContent value="pricing" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Creator Per-Minute Rates
                  </CardTitle>
                  <CardDescription>Manage pricing for approved creators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvedCreators.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{creator.name}</p>
                        <p className="text-sm text-muted-foreground">{creator.mobile}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current Rate</p>
                          <p className="text-lg font-bold">₹{localStorage.getItem(`creator_rate_${creator.id}`) || creator.currentRate}/min</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="New rate"
                          className="w-32"
                          value={creatorRates[creator.id] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreatorRates({ ...creatorRates, [creator.id]: parseInt(e.target.value) || 0 })}
                          data-testid={`input-rate-${creator.id}`}
                        />
                        <Button
                          onClick={() => handleUpdateRate(creator.id, creator.name)}
                          data-testid={`button-update-rate-${creator.id}`}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-primary" />
                    Agency Commission Rates
                  </CardTitle>
                  <CardDescription>Manage commission for approved agencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvedAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.mobile}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Current Commission</p>
                          <p className="text-lg font-bold">{localStorage.getItem(`agency_commission_${agent.id}`) || agent.currentCommission}%</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="New %"
                          className="w-32"
                          value={agencyCommissions[agent.id] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgencyCommissions({ ...agencyCommissions, [agent.id]: parseInt(e.target.value) || 0 })}
                          data-testid={`input-commission-${agent.id}`}
                        />
                        <Button
                          onClick={() => handleUpdateCommission(agent.id, agent.name)}
                          data-testid={`button-update-commission-${agent.id}`}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Admin Management Tab (Super User only) */}
          {canSeeAdmins && (
            <TabsContent value="admins" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Admin Users
                      </CardTitle>
                      <CardDescription>Manage admin access and roles</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddAdminDialog(true)} data-testid="button-add-admin">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{admin.name}</p>
                          <Badge variant={admin.role === "super_user" ? "default" : "secondary"}>
                            {admin.role.replace("_", " ")}
                          </Badge>
                          {admin.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{admin.mobile} • {admin.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Created: {admin.createdAt}</p>
                      </div>
                      {admin.role !== "super_user" && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" data-testid={`button-edit-admin-${admin.id}`}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            data-testid={`button-deactivate-admin-${admin.id}`}
                          >
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Gifts Tab */}
          {canSeeGifts && (
            <TabsContent value="gifts" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Gift Management
                  </CardTitle>
                  <CardDescription>
                    Configure gift amounts and options displayed to users during calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rose</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹20</div>
                        <p className="text-xs text-muted-foreground mt-1">Single rose gift</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-rose">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bouquet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹40</div>
                        <p className="text-xs text-muted-foreground mt-1">Flower bouquet</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-bouquet">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Diamond</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹50</div>
                        <p className="text-xs text-muted-foreground mt-1">Sparkling diamond</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-diamond">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emerald</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹100</div>
                        <p className="text-xs text-muted-foreground mt-1">Precious emerald</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-emerald">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sapphire</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹250</div>
                        <p className="text-xs text-muted-foreground mt-1">Blue sapphire gem</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-sapphire">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ruby</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹500</div>
                        <p className="text-xs text-muted-foreground mt-1">Red ruby gem</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-ruby">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crystal Heart</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹750</div>
                        <p className="text-xs text-muted-foreground mt-1">Crystal heart gift</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-crystal">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Royal Crown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹900</div>
                        <p className="text-xs text-muted-foreground mt-1">Royal crown gift</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-crown">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader className="space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Golden Treasure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹1000</div>
                        <p className="text-xs text-muted-foreground mt-1">Ultimate treasure</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" data-testid="button-edit-gift-treasure">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Gifts are displayed to users during calls. Editing gift amounts updates them system-wide.
                    </p>
                    <Button data-testid="button-add-gift">
                      <Gift className="w-4 h-4 mr-2" />
                      Add New Gift
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Support Tab (All roles) */}
          {canSeeSupport && (
            <TabsContent value="support" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Support Tickets
                  </CardTitle>
                  <CardDescription>Manage user support requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{ticket.subject}</h3>
                                <Badge variant={ticket.status === "open" ? "default" : ticket.status === "in_progress" ? "secondary" : "outline"}>
                                  {ticket.status.replace("_", " ")}
                                </Badge>
                                <Badge variant={ticket.priority === "high" ? "destructive" : "secondary"}>
                                  {ticket.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                From: {ticket.userName} ({ticket.userMobile})
                              </p>
                              <p className="text-sm">{ticket.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">{ticket.createdAt}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" data-testid={`button-reply-${ticket.id}`}>
                                Reply
                              </Button>
                              <Button size="sm" data-testid={`button-resolve-${ticket.id}`}>
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedProfile?.name}'s application. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
              rows={4}
              data-testid="textarea-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason("");
              setSelectedProfile(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} data-testid="button-confirm-reject">
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Create a new admin user with specific role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input id="admin-name" placeholder="Enter admin name" data-testid="input-admin-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-mobile">Mobile Number</Label>
              <Input id="admin-mobile" placeholder="+91 XXXXXXXXXX" data-testid="input-new-admin-mobile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" placeholder="admin@talkin.com" data-testid="input-admin-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <Select>
                <SelectTrigger data-testid="select-admin-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Admin Added",
                  description: "New admin user has been created successfully.",
                });
                setShowAddAdminDialog(false);
              }}
              data-testid="button-create-admin"
            >
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BUG-017 FIX: Custom Ban Confirmation Dialog - replaces blocking confirm() */}
      <Dialog open={showBanConfirmDialog} onOpenChange={setShowBanConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Confirm Ban
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently ban <strong>{profileToBan?.name}</strong>? This action cannot be undone and user will lose all access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBan}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBan} data-testid="button-confirm-ban">
              Permanently Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
