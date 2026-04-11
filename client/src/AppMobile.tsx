import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/hooks/useWallet";
import UserApp from "@/pages/UserApp";
import CreatorProfile from "@/pages/CreatorProfile";
import RechargePage from "@/pages/RechargePage";
import PaymentGatewayPage from "@/pages/PaymentGatewayPage";
import SupportChatPage from "@/pages/SupportChatPage";
import AccountPage from "@/pages/AccountPage";
import { CallInterface } from "@/components/CallInterface";
import { useParams } from "wouter";
import { creatorsData } from "@/lib/creatorsData";

function CallInterfaceWrapper() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();

  const creator = creatorsData.find((c) => c.id === id);
  if (!creator) return <div>Creator not found</div>;

  const searchParams = new URLSearchParams(window.location.search);
  const isRandomMatch = searchParams.get('randomMatch') === 'true';
  const pricePerMinute = (isRandomMatch && creator.randomMatchEnabled) ? 25 : creator.price;

  // FIX: Extract callType from URL query parameter to fix video/audio call layout mismatch
  const callTypeParam = searchParams.get('callType') as "audio" | "video" | null;
  const callType = callTypeParam === "video" ? "video" : "audio";

  return (
    <CallInterface
      creatorName={creator.name}
      creatorImage={undefined}
      creatorId={creator.id}
      pricePerMinute={pricePerMinute}
      callType={callType}
      onEndCall={() => {
        window.history.back();
      }}
    />
  );
}

// User App Only - Mobile Version
function UserAppMobile() {
  const [location] = useLocation();

  // Force user app on mobile
  useEffect(() => {
    if (location === "/") {
      window.location.href = "/user";
    }
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WalletProvider>
            <div className="min-h-screen bg-background">
              <Switch>
                <Route path="/" component={() => <UserApp />} />
                <Route path="/user" component={() => <UserApp />} />
                <Route path="/user/creator/:id" component={CreatorProfile} />
                <Route path="/user/call/:id" component={CallInterfaceWrapper} />
                <Route path="/user/recharge" component={RechargePage} />
                <Route path="/user/payment" component={PaymentGatewayPage} />
                <Route path="/user/support" component={SupportChatPage} />
                <Route path="/user/account" component={AccountPage} />
                <Route component={() => <UserApp />} />
              </Switch>
              <Toaster />
            </div>
          </WalletProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default UserAppMobile;