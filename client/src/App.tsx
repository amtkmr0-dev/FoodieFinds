import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/hooks/useWallet";
import { AppSelector } from "@/components/AppSelector";
import UserApp from "@/pages/UserApp";
import CreatorProfile from "@/pages/CreatorProfile";
import CreatorApp from "@/pages/CreatorApp";
import AdminDashboard from "@/pages/AdminDashboard";
import SignupLogin from "@/pages/SignupLogin";
import CreatorSignup from "@/pages/CreatorSignup";
import CreatorLogin from "@/pages/CreatorLogin";
import AgentLogin from "@/pages/AgentLogin";
import CreatorOnboarding from "@/pages/CreatorOnboarding";
import PendingApproval from "@/pages/PendingApproval";
import AdminLogin from "@/pages/AdminLogin";
import RechargePage from "@/pages/RechargePage";
import PaymentGatewayPage from "@/pages/PaymentGatewayPage";
import SupportChatPage from "@/pages/SupportChatPage";
import AdminBroadcast from "@/pages/AdminBroadcast";
import AccountPage from "@/pages/AccountPage";
import { CallInterface } from "@/components/CallInterface";
import NotFound from "@/pages/not-found";
import { useLocation, useParams } from "wouter";

const creatorsData = [
  {
    id: "1",
    name: "Sarah Johnson",
    price: 45,
    country: "India",
    followers: 1250,
    languages: ["English", "Hindi", "Tamil"],
    isOnline: true,
    randomMatchEnabled: true,
  },
  {
    id: "2",
    name: "Rahul Verma",
    price: 38,
    country: "India",
    followers: 890,
    languages: ["Hindi", "English"],
    isOnline: false,
    randomMatchEnabled: false,
  },
  {
    id: "3",
    name: "Priya Sharma",
    price: 52,
    country: "India",
    followers: 2100,
    languages: ["English", "Hindi", "Marathi"],
    isOnline: true,
    randomMatchEnabled: true,
  },
  {
    id: "4",
    name: "Amit Patel",
    price: 40,
    country: "India",
    followers: 1500,
    languages: ["Gujarati", "Hindi", "English"],
    isOnline: true,
    randomMatchEnabled: true,
  },
  {
    id: "5",
    name: "Neha Kapoor",
    price: 48,
    country: "India",
    followers: 1780,
    languages: ["English", "Hindi", "Punjabi"],
    isOnline: true,
    randomMatchEnabled: true,
  },
];

function CallInterfaceWrapper() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const creatorId = params.id || "1";
  
  const creator = creatorsData.find(c => c.id === creatorId) || creatorsData[0];
  
  return (
    <CallInterface
      creatorName={creator.name}
      creatorId={creator.id}
      pricePerMinute={creator.price}
      onEndCall={() => setLocation("/user")}
    />
  );
}

function Router() {
  const [selectedApp, setSelectedApp] = useState<"user" | "creator" | "admin" | null>(null);

  if (!selectedApp) {
    return <AppSelector onSelectApp={setSelectedApp} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => {
        if (selectedApp === "user") return <UserApp />;
        if (selectedApp === "creator") return <CreatorApp />;
        if (selectedApp === "admin") return <AdminDashboard />;
        return <AppSelector onSelectApp={setSelectedApp} />;
      }} />
      <Route path="/signup" component={SignupLogin} />
      <Route path="/creator-signup" component={CreatorSignup} />
      
      {/* Creator & Agent Auth Routes */}
      <Route path="/creator/login" component={CreatorLogin} />
      <Route path="/agent/login" component={AgentLogin} />
      <Route path="/creator/onboarding" component={CreatorOnboarding} />
      <Route path="/agent/onboarding" component={CreatorOnboarding} />
      <Route path="/creator/pending-approval" component={PendingApproval} />
      <Route path="/agent/pending-approval" component={PendingApproval} />
      
      {/* User Routes */}
      <Route path="/user" component={UserApp} />
      <Route path="/user/account" component={AccountPage} />
      <Route path="/user/creator/:id" component={CreatorProfile} />
      <Route path="/user/recharge" component={RechargePage} />
      <Route path="/user/payment/:amount" component={PaymentGatewayPage} />
      <Route path="/user/support" component={SupportChatPage} />
      <Route path="/user/call/:id" component={CallInterfaceWrapper} />
      
      {/* Creator & Admin Routes */}
      <Route path="/creator" component={CreatorApp} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/broadcast" component={AdminBroadcast} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
