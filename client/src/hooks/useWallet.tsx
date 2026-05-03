import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { realtime } from "@/lib/realtime";
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

// Use a consistent user ID (in real app this would come from auth)
const USER_ID = "user_001";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(450);

  // Manus §4.1: was `refetchInterval: 10000`. Polling is replaced by a
  // server-pushed `wallet:{userId}` event (see effect below). The query
  // still does an initial fetch so we have a balance before the first
  // event arrives.
  const { data: walletData, isLoading } = useQuery<UserWallet>({
    queryKey: ["/api/wallet", USER_ID],
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
  useEffect(() => {
    const unsub = realtime.subscribe(`wallet:${USER_ID}`, (event: any) => {
      if (event?.type !== 'wallet:updated') return;
      const w = event.wallet as UserWallet | undefined;
      if (w) {
        const next = typeof w.balance === 'number' ? w.balance : parseFloat(w.balance as unknown as string);
        if (Number.isFinite(next)) setBalance(next);
        queryClient.setQueryData(['/api/wallet', USER_ID], w);
      } else {
        // No wallet snapshot in the event - just refetch.
        queryClient.invalidateQueries({ queryKey: ['/api/wallet', USER_ID] });
      }
    });
    return unsub;
  }, []);

  // Recharge mutation
  const rechargeMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/wallet/recharge", {
        userId: USER_ID,
        amount, // Send as number, not string
        paymentMethod,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.wallet) {
        setBalance(typeof data.wallet.balance === 'number' ? data.wallet.balance : parseFloat(data.wallet.balance));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
    },
  });

  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
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

export { USER_ID };
