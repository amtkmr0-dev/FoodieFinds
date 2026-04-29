import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Phone, User, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ACTIVE_TEST_CREATORS: Record<string, { otp: string; name: string; creatorId: string }> = {
  "9717629693": {
    otp: "123456",
    name: "Karan Malhotra",
    creatorId: "8",
  },
};

export default function CreatorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);

  const handleSendOTP = () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }
    
    setShowOTP(true);
    toast({
      title: "OTP Sent",
      description: `OTP has been sent to +91 ${mobileNumber}`,
    });
  };

  const handleLogin = () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    const activeCreator = ACTIVE_TEST_CREATORS[mobileNumber];
    if (activeCreator) {
      if (otp !== activeCreator.otp) {
        toast({
          title: "Invalid OTP",
          description: "Use OTP 123456 for the active creator test account.",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("creator_registered", "true");
      localStorage.setItem("creator_approval_status", "approved");
      localStorage.setItem("creator_mobile", mobileNumber);
      localStorage.setItem("creator_active_account", JSON.stringify(activeCreator));

      toast({
        title: "Welcome back",
        description: `${activeCreator.name} is active and ready for calls.`,
      });
      setLocation("/creator");
      return;
    }

    const isNewUser = localStorage.getItem("creator_registered") !== "true";
    localStorage.setItem("creator_mobile", mobileNumber);
    
    if (isNewUser) {
      setLocation("/creator/onboarding");
    } else {
      setLocation("/creator");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back-to-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Creator Login</CardTitle>
            <p className="text-muted-foreground">
              Join LINKY as a Creator and start earning
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-secondary rounded-md border">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">+91</span>
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                    disabled={showOTP}
                    data-testid="input-mobile-creator"
                  />
                </div>
              </div>

              {!showOTP ? (
                <Button
                  className="w-full"
                  onClick={handleSendOTP}
                  data-testid="button-send-otp-creator"
                >
                  Send OTP
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="pl-10"
                        data-testid="input-otp-creator"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOTP(false);
                        setOtp("");
                      }}
                      className="flex-1"
                      data-testid="button-change-number"
                    >
                      Change Number
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleLogin}
                      data-testid="button-verify-otp-creator"
                    >
                      Verify & Login
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleSendOTP}
                    data-testid="button-resend-otp"
                  >
                    Resend OTP
                  </Button>
                </>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                New to LINKY? You'll be guided through registration
              </p>

              <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                <a href="#" className="hover:text-primary underline" data-testid="link-terms">
                  Terms of Use
                </a>
                <span>•</span>
                <a href="#" className="hover:text-primary underline" data-testid="link-privacy">
                  Privacy Policy
                </a>
                <span>•</span>
                <a href="#" className="hover:text-primary underline" data-testid="link-creator-agreement">
                  Creator Agreement
                </a>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/agent/login")}
              data-testid="button-switch-to-agent"
            >
              Login as Agent instead
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
