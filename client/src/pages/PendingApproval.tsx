import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Clock, CheckCircle2, XCircle, Ban, RefreshCw } from "lucide-react";

export default function PendingApproval() {
  const [, setLocation] = useLocation();
  const [approvalStatus, setApprovalStatus] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    // Mock: Get approval status from localStorage
    const status = localStorage.getItem("creator_approval_status") || "pending";
    const reason = localStorage.getItem("rejection_reason") || "";
    setApprovalStatus(status);
    setRejectionReason(reason);
  }, []);

  const handleResubmit = () => {
    setLocation("/creator/onboarding");
  };

  const handleLogout = () => {
    localStorage.removeItem("creator_registered");
    localStorage.removeItem("creator_approval_status");
    localStorage.removeItem("rejection_reason");
    setLocation("/creator/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            {approvalStatus === "pending" && (
              <>
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">Profile Under Review</CardTitle>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    Pending Approval
                  </Badge>
                </div>
              </>
            )}

            {approvalStatus === "approved" && (
              <>
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">Profile Approved!</CardTitle>
                  <Badge className="bg-green-500">Approved</Badge>
                </div>
              </>
            )}

            {approvalStatus === "rejected" && (
              <>
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">Profile Rejected</CardTitle>
                  <Badge variant="destructive">Rejected</Badge>
                </div>
              </>
            )}

            {approvalStatus === "banned" && (
              <>
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <Ban className="w-10 h-10 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">Account Banned</CardTitle>
                  <Badge variant="destructive">Banned</Badge>
                </div>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {approvalStatus === "pending" && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Thank you for submitting your profile! Our admin team is currently reviewing your documents.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">What happens next?</p>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left list-disc list-inside">
                    <li>Admin reviews your documents</li>
                    <li>Verification typically takes 24-48 hours</li>
                    <li>You'll be notified via SMS once approved</li>
                  </ul>
                </div>
              </div>
            )}

            {approvalStatus === "approved" && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Congratulations! Your profile has been approved. You can now start earning on LINKY.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setLocation("/creator")}
                  data-testid="button-go-to-dashboard"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {approvalStatus === "rejected" && (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Rejection Reason:</p>
                  <p className="text-sm text-muted-foreground">
                    {rejectionReason || "Your documents could not be verified. Please check the details and resubmit."}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Please correct the issues mentioned above and resubmit your profile for review.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="flex-1"
                    data-testid="button-logout"
                  >
                    Logout
                  </Button>
                  <Button
                    onClick={handleResubmit}
                    className="flex-1"
                    data-testid="button-resubmit"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resubmit
                  </Button>
                </div>
              </div>
            )}

            {approvalStatus === "banned" && (
              <div className="space-y-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Account Status:</p>
                  <p className="text-sm text-muted-foreground">
                    Your account has been permanently banned due to policy violations. 
                    You cannot register again with this mobile number.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  For more information, please contact our support team.
                </p>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full"
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            )}

            {approvalStatus === "pending" && (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full"
                data-testid="button-logout"
              >
                Logout
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
