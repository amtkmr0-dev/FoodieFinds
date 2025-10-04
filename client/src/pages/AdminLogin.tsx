import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, Phone, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOTP = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${mobileNumber}`,
    });
    setStep("otp");
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    // Check if admin exists
    const isRegistered = localStorage.getItem("admin_registered");
    
    if (isRegistered) {
      const adminRole = localStorage.getItem("admin_role") || "admin";
      toast({
        title: "Login Successful",
        description: `Welcome back, ${adminRole}!`,
      });
      setTimeout(() => {
        setLocation("/admin/dashboard");
      }, 1000);
    } else {
      toast({
        title: "Access Denied",
        description: "This mobile number is not authorized as an admin. Contact Super User for access.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">Secure login for administrators</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Admin Login
            </CardTitle>
            <CardDescription>
              {step === "mobile" 
                ? "Enter your registered mobile number" 
                : "Enter the OTP sent to your mobile"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "mobile" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-secondary rounded-md border">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">+91</span>
                    </div>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      maxLength={10}
                      data-testid="input-admin-mobile"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSendOTP}
                  data-testid="button-send-otp"
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    data-testid="input-admin-otp"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("mobile")}
                    data-testid="button-change-number"
                  >
                    Change Number
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleVerifyOTP}
                    data-testid="button-verify-otp"
                  >
                    Verify & Login
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Only authorized administrators can access this portal
          </p>
        </div>
      </div>
    </div>
  );
}
