import { Card } from "@/components/ui/card";
import { Users, Mic, Shield } from "lucide-react";

interface AppSelectorProps {
  onSelectApp: (app: "user" | "creator" | "admin") => void;
}

export function AppSelector({ onSelectApp }: AppSelectorProps) {
  const apps = [
    {
      id: "user" as const,
      title: "User App",
      description: "Connect with creators and start conversations",
      icon: Users,
      color: "text-primary",
    },
    {
      id: "creator" as const,
      title: "Creator & Agency",
      description: "Manage your profile, earnings, and referrals",
      icon: Mic,
      color: "text-call-accent",
    },
    {
      id: "admin" as const,
      title: "Admin Dashboard",
      description: "Manage users, creators, and platform operations",
      icon: Shield,
      color: "text-success",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Talkin Platform</h1>
          <p className="text-muted-foreground">
            Select an application to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card
              key={app.id}
              className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all"
              onClick={() => onSelectApp(app.id)}
              data-testid={`card-app-${app.id}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 ${app.color}`}>
                <app.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{app.title}</h3>
              <p className="text-sm text-muted-foreground">{app.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
