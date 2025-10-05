import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Phone, Smartphone, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

type FlowState = "check-device" | "phone-entry" | "otp-verification" | "success";

export default function SignupLogin() {
  const [, setLocation] = useLocation();
  const [flowState, setFlowState] = useState<FlowState>("check-device");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [deviceRecognized, setDeviceRecognized] = useState(false);

  useEffect(() => {
    const deviceId = localStorage.getItem("linky_device_id");
    const savedUsername = localStorage.getItem("linky_username");
    
    if (deviceId && savedUsername) {
      setDeviceRecognized(true);
      setGeneratedUsername(savedUsername);
    } else {
      setFlowState("phone-entry");
    }
  }, []);

  const handleFastLogin = () => {
    window.location.href = "/user";
  };

  const handleSendOTP = () => {
    if (!phone || phone.length < 10) return;
    console.log("Sending OTP to:", phone);
    setFlowState("otp-verification");
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) return;
    
    const username = generateUsername();
    setGeneratedUsername(username);
    
    const deviceId = crypto.randomUUID();
    localStorage.setItem("linky_device_id", deviceId);
    localStorage.setItem("linky_username", username);
    localStorage.setItem("linky_phone", phone);
    
    setFlowState("success");
    
    setTimeout(() => {
      window.location.href = "/user";
    }, 2000);
  };

  const generateUsername = (): string => {
    const adjectives = ["Swift", "Bright", "Cool", "Calm", "Bold", "Quick", "Happy", "Lucky", "Keen", "Wise"];
    const nouns = ["Hawk", "Star", "Wave", "Tiger", "Eagle", "Fox", "Wolf", "Lion", "Bear", "Raven"];
    const randomNum = Math.floor(Math.random() * 9999);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${randomNum}`;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers;
    }
    return numbers.slice(0, 10);
  };

  if (flowState === "check-device" && deviceRecognized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-muted-foreground">Device recognized</p>
          </div>

          <div className="bg-secondary rounded-lg p-4 mb-6">
            <div className="text-sm text-muted-foreground mb-1">Logged in as</div>
            <div className="text-lg font-semibold">{generatedUsername}</div>
          </div>

          <Button
            className="w-full mb-3"
            onClick={handleFastLogin}
            data-testid="button-fast-login"
          >
            Continue to App
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              localStorage.removeItem("linky_device_id");
              localStorage.removeItem("linky_username");
              localStorage.removeItem("linky_phone");
              setDeviceRecognized(false);
              setFlowState("phone-entry");
            }}
            data-testid="button-use-different-account"
          >
            Use Different Account
          </Button>
        </Card>
      </div>
    );
  }

  if (flowState === "phone-entry") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">LINKY</h1>
            <p className="text-muted-foreground">Real Voices, Real Connections</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className="pl-10"
                  maxLength={10}
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                We'll send you an OTP for verification
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSendOTP}
            disabled={!phone || phone.length < 10}
            data-testid="button-send-otp"
          >
            Send OTP
          </Button>

          <div className="mt-6 p-4 bg-primary/5 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-muted-foreground">
                No password needed - we'll create a unique username for you automatically
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (flowState === "otp-verification") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Verify OTP</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to
            </p>
            <p className="font-semibold mt-1">+91 {phone}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-widest font-semibold"
                maxLength={6}
                data-testid="input-otp"
              />
            </div>
          </div>

          <Button
            className="w-full mb-3"
            onClick={handleVerifyOTP}
            disabled={!otp || otp.length !== 6}
            data-testid="button-verify-otp"
          >
            Verify & Continue
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setFlowState("phone-entry")}
            data-testid="button-back"
          >
            Change Number
          </Button>

          <div className="text-center mt-4">
            <button
              onClick={() => console.log("Resend OTP")}
              className="text-sm text-primary hover:underline"
              data-testid="button-resend-otp"
            >
              Resend OTP
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (flowState === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to LINKY!</h1>
            <p className="text-muted-foreground mb-6">Your account has been created</p>

            <div className="bg-secondary rounded-lg p-4 mb-6">
              <div className="text-sm text-muted-foreground mb-1">Your unique username</div>
              <div className="text-xl font-bold text-primary">{generatedUsername}</div>
            </div>

            <Badge variant="secondary" className="mb-6">
              Redirecting to app...
            </Badge>

            <p className="text-sm text-muted-foreground">
              Next time, you can login instantly with device recognition
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
