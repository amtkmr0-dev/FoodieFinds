import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { realtime } from "@/lib/realtime";
import { getStoredUser } from "@/lib/auth";
import type { UserWallet } from "@shared/schema";

interface WalletContextType {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => void;
  recharge: (amount: number, paymentMethod: string) => Promise<{
    success: boolean;
    wallet?: UserWallet;
    transaction?: any;
    bonus?: number;
    totalAmount?: number;
    status?: string;
    transactionId?: string;
    message?: string;
    error?: string;
  }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Read the authenticated user's id from the OTP-issued JWT (cached in
 * localStorage as `auth_user`). Returns null when no one is logged in -
 * the wallet provider then renders a zero-balance shell with no fetches.
 *
 * Post-audit fix: previously `USER_ID = "user_001"` was hardcoded, which
 * meant every wallet interaction targeted the same shared bucket and the
 * (now authenticated) server would 401/403. The real userId comes from
 * the OTP flow's response, stored by `setAccessToken` in `auth.ts`.
 *
 * Exported because `useCallBalanceMonitor` and `GiftSelectionModal` need
 * the same answer at request time (NOT at module load - the user logs in
 * after the bundle has loaded).
 */
export function getCurrentUserId(): string | null {
  return getStoredUser()?.userId ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(450);
  // Re-render whenever login/logout dispatches the `auth-changed` event,
  // so `userId` updates without forcing a page reload after OTP verify.
  const [userId, setUserId] = useState<string | null>(getCurrentUserId());
  useEffect(() => {
    const sync = () => setUserId(getCurrentUserId());
    window.addEventListener('auth-changed', sync);
    return () => window.removeEventListener('auth-changed', sync);
  }, []);

  // Manus §4.1: was `refetchInterval: 10000`. Polling is replaced by a
  // server-pushed `wallet:{userId}` event. The query still does an initial
  // fetch so we have a balance before the first event arrives.
  // Skip the fetch entirely if the user isn't logged in yet.
  const { data: walletData, isLoading } = useQuery<UserWallet>({
    queryKey: userId ? ["/api/wallet", userId] : ["/api/wallet/anon"],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Update local balance when wallet data changes
  useEffect(() => {
    if (walletData) {
      setBalance(typeof walletData.balance === 'number' ? walletData.balance : parseFloat(walletData.balance));
    }
  }, [walletData]);

  // Subscribe once to the user's wallet channel. The server publishes
  // on every recharge / call deduction / refund, so we never need to poll.
  // Skip if no user is logged in.
  useEffect(() => {
    if (!userId) return;
    const unsub = realtime.subscribe(`wallet:${userId}`, (event: any) => {
      if (event?.type !== 'wallet:updated') return;
      const w = event.wallet as UserWallet | undefined;
      if (w) {
        const next = typeof w.balance === 'number' ? w.balance : parseFloat(w.balance as unknown as string);
        if (Number.isFinite(next)) setBalance(next);
        queryClient.setQueryData(['/api/wallet', userId], w);
      } else {
        // No wallet snapshot in the event - just refetch.
        queryClient.invalidateQueries({ queryKey: ['/api/wallet', userId] });
      }
    });
    return unsub;
  }, [userId]);

  // Recharge mutation. The server now derives userId from the JWT and
  // ignores any userId in the body, so we don't send one.
  const rechargeMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/wallet/recharge", {
        amount,
        paymentMethod,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.wallet) {
        setBalance(typeof data.wallet.balance === 'number' ? data.wallet.balance : parseFloat(data.wallet.balance));
      }
      if (userId) queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
    },
  });

  const refreshBalance = () => {
    if (userId) queryClient.invalidateQueries({ queryKey: ["/api/wallet", userId] });
  };

  const recharge = async (amount: number, paymentMethod: string) => {
    return await rechargeMutation.mutateAsync({ amount, paymentMethod });
  };

  return (
    <WalletContext.Provider value={{ balance, isLoading, refreshBalance, recharge }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

