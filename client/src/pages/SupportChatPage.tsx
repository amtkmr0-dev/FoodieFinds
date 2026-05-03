import { useState, useEffect } from "react";
import { SupportChat } from "@/components/SupportChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

function SupportChatPageContent() {
  const [, setLocation] = useLocation();
  const [hasHadFirstRecharge, setHasHadFirstRecharge] = useState(false);
  
  useEffect(() => {
    const completedFirstRecharge = localStorage.getItem("firstRechargeCompleted");
    setHasHadFirstRecharge(completedFirstRecharge === "true");
  }, []);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/user")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Support</h1>
        </div>
        <ThemeToggle />
      </header>
      <div className="flex-1 overflow-hidden">
        <SupportChat 
          hasHadFirstCall={hasHadFirstRecharge}
          onClose={() => setLocation("/user")} 
        />
      </div>
    </div>
  );
}

export default function SupportChatPage() {
  const user = useRequireAuth();
  if (!user) return null;
  return <SupportChatPageContent />;
}
