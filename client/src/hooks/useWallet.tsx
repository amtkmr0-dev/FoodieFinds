import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserWallet } from "@shared/schema";

interface WalletContextType {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => void;
  recharge: (amount: number, paymentMethod: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Use a consistent user ID (in real app this would come from auth)
const USER_ID = "user_001";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(450);

  // Fetch wallet balance
  const { data: walletData, isLoading } = useQuery<UserWallet>({
    queryKey: ["/api/wallet", USER_ID],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Update local balance when wallet data changes
  useEffect(() => {
    if (walletData) {
      setBalance(parseFloat(walletData.balance));
    }
  }, [walletData]);

  // Recharge mutation
  const rechargeMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/wallet/recharge", {
        userId: USER_ID,
        amount: amount.toString(),
        paymentMethod,
        status: "success",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.wallet) {
        setBalance(parseFloat(data.wallet.balance));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
    },
  });

  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
  };

  const recharge = async (amount: number, paymentMethod: string) => {
    await rechargeMutation.mutateAsync({ amount, paymentMethod });
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
