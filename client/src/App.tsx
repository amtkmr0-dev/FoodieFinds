import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
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
import RechargePage from "@/pages/RechargePage";
import SupportChatPage from "@/pages/SupportChatPage";
import AdminBroadcast from "@/pages/AdminBroadcast";
import AccountPage from "@/pages/AccountPage";
import { CallInterface } from "@/components/CallInterface";
import NotFound from "@/pages/not-found";

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
      <Route path="/user/support" component={SupportChatPage} />
      <Route path="/user/call" component={() => (
        <CallInterface
          creatorName="Sarah Johnson"
          pricePerMinute={45}
          currentBalance={450}
          onEndCall={() => window.location.href = "/user"}
          onSendGift={() => console.log("Send gift")}
          onRecharge={() => window.location.href = "/user/recharge"}
        />
      )} />
      
      {/* Creator & Admin Routes */}
      <Route path="/creator" component={CreatorApp} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/broadcast" component={AdminBroadcast} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
