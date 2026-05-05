/**
 * Creator login page (PR #7: real OTP flow against backend).
 *
 * Pre-PR #7: this page was a pure mock - it set localStorage flags and
 * redirected without ever talking to the server. PR #7 wires it to the
 * real /api/auth/creator/{send-otp,verify-otp} endpoints.
 *
 * Demo phone numbers: 9000000001 .. 9000000009 (see server/storage.ts
 * MemStorage seed and scripts/seed.ts). The OTP is logged server-side
 * and ALSO returned in the response body in non-prod for convenience.
 */

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
import { setAccessToken } from "@/lib/auth";

export default function CreatorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/auth/creator/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobileNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Failed to Send OTP",
          description: data.error || "Please try again later",
          variant: "destructive",
        });
        return;
      }

      setShowOTP(true);
      toast({
        title: "OTP Sent",
        description: data.otp
          ? `Demo OTP: ${data.otp}` // dev-only convenience: server includes OTP in non-prod
          : `OTP has been sent to +91 ${mobileNumber}`,
      });
    } catch (err: any) {
      toast({
        title: "Network Error",
        description: err.message || "Could not reach the server",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/creator/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobileNumber, otp }),
        credentials: "include", // refresh-token cookie
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid OTP",
          variant: "destructive",
        });
        return;
      }

      // Persist the JWT in memory + storage (so useRequireAuth and
      // queryClient pick it up on every subsequent request).
      setAccessToken(data.accessToken);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      toast({
        title: "Welcome back",
        description: `Logged in as ${data.user.name}`,
      });

      setLocation("/creator");
    } catch (err: any) {
      toast({
        title: "Network Error",
        description: err.message || "Could not reach the server",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
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
              Sign in as a Creator to see your earnings and call history
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Demo accounts: phone <code className="font-mono">9000000001</code>..<code className="font-mono">9000000009</code>
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
                    disabled={showOTP || isSending}
                    data-testid="input-mobile-creator"
                  />
                </div>
              </div>

              {!showOTP ? (
                <Button
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={isSending}
                  data-testid="button-send-otp-creator"
                >
                  {isSending ? "Sending..." : "Send OTP"}
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
                      disabled={isVerifying}
                      data-testid="button-verify-otp-creator"
                    >
                      {isVerifying ? "Verifying..." : "Verify & Login"}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleSendOTP}
                    disabled={isSending}
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
