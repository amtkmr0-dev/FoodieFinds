import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Phone, Mail, LogIn } from "lucide-react";

export default function SignupLogin() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSignup, setIsSignup] = useState(true);

  const handleSubmit = () => {
    console.log("Submitting:", { phone, email, isSignup });
  };

  const handleDeviceLogin = () => {
    console.log("Device ID login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Talkin</h1>
          <p className="text-muted-foreground">
            {isSignup ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                data-testid="input-email"
              />
            </div>
          </div>
        </div>

        <Button
          className="w-full mb-3"
          onClick={handleSubmit}
          disabled={!phone}
          data-testid="button-submit"
        >
          {isSignup ? "Sign Up" : "Log In"}
        </Button>

        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={handleDeviceLogin}
          data-testid="button-device-login"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Fast Login with Device ID
        </Button>

        <div className="text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-primary hover:underline"
            data-testid="button-toggle-mode"
          >
            {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}
