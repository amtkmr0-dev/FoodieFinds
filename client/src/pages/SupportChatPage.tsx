import { SupportChat } from "@/components/SupportChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";

export default function SupportChatPage() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Support</h1>
        <ThemeToggle />
      </header>
      <div className="flex-1 overflow-hidden">
        <SupportChat 
          hasHadFirstCall={true}
          onClose={() => setLocation("/user")} 
        />
      </div>
    </div>
  );
}
