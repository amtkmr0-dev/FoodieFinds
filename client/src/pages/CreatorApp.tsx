import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wallet, Users, Gift, MessageSquare, Settings, TrendingUp } from "lucide-react";

export default function CreatorApp() {
  const [role] = useState<"creator" | "agency">("creator");

  const stats = {
    creator: [
      { label: "Earnings Today", value: "₹2,340", icon: Wallet },
      { label: "Total Calls", value: "45", icon: Users },
      { label: "Gifts Received", value: "12", icon: Gift },
    ],
    agency: [
      { label: "Commission", value: "₹12,450", icon: Wallet },
      { label: "Creators", value: "23", icon: Users },
      { label: "Growth", value: "+15%", icon: TrendingUp },
    ],
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Talkin {role === "creator" ? "Creator" : "Agency"}</h1>
            <Badge variant="secondary" className="mt-1">
              {role === "creator" ? "Creator Mode" : "Agency Mode"}
            </Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="text-2xl">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Sarah Johnson</h2>
              <p className="text-muted-foreground">₹45/min • 1,250 followers</p>
              <Badge className="mt-2 bg-success">Approved</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats[role].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg bg-secondary">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {role === "agency" && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Referral Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value="https://talkin.app/ref/SARAH123"
                readOnly
                className="flex-1 px-4 py-2 bg-secondary rounded-lg text-sm"
                data-testid="input-referral-link"
              />
              <Button onClick={() => console.log("Copied!")} data-testid="button-copy-link">
                Copy
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-earnings">
            <Wallet className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Earnings</h3>
            <p className="text-sm text-muted-foreground">
              View your detailed earnings and withdraw funds
            </p>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" data-testid="card-profile">
            <Settings className="w-8 h-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Profile Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update your profile (requires admin approval)
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Call with User {i}</p>
                    <p className="text-xs text-muted-foreground">5 mins • ₹{i * 45}</p>
                  </div>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <Button variant="ghost" size="icon" data-testid="button-nav-home">
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-nav-messages">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-nav-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
