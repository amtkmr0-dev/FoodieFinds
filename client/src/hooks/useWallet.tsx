import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { startRazorpayRecharge } from "@/lib/razorpay";
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
const WALLET_BALANCE_KEY = `foodiefinds_wallet_balance_${USER_ID}`;
const WALLET_BALANCE_EVENT = "foodiefinds-wallet-balance-change";

function readStoredBalance() {
  const storedBalance = localStorage.getItem(WALLET_BALANCE_KEY);
  if (!storedBalance) return 450;

  const parsedBalance = Number(storedBalance);
  return Number.isFinite(parsedBalance) ? parsedBalance : 450;
}

export function addLocalWalletBalance(amount: number) {
  const nextBalance = readStoredBalance() + amount;
  localStorage.setItem(WALLET_BALANCE_KEY, String(nextBalance));
  window.dispatchEvent(new CustomEvent(WALLET_BALANCE_EVENT, { detail: nextBalance }));
  return nextBalance;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number>(() => readStoredBalance());

  useEffect(() => {
    const handleBalanceChange = (event: Event) => {
      const nextBalance = (event as CustomEvent<number>).detail ?? readStoredBalance();
      setBalance(Number(nextBalance));
    };

    window.addEventListener(WALLET_BALANCE_EVENT, handleBalanceChange);
    window.addEventListener("storage", handleBalanceChange);

    return () => {
      window.removeEventListener(WALLET_BALANCE_EVENT, handleBalanceChange);
      window.removeEventListener("storage", handleBalanceChange);
    };
  }, []);

  // Fetch wallet balance
  const { data: walletData, isLoading } = useQuery<UserWallet>({
    queryKey: ["/api/wallet", USER_ID],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/wallet/${USER_ID}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Wallet API unavailable: ${res.status}`);
        }

        return await res.json();
      } catch {
        const storedBalance = readStoredBalance();

        return {
          id: `wallet_${USER_ID}`,
          userId: USER_ID,
          balance: storedBalance.toFixed(2),
          updatedAt: new Date(),
        } as UserWallet;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Update local balance when wallet data changes
  useEffect(() => {
    if (walletData) {
      const nextBalance = typeof walletData.balance === 'number' ? walletData.balance : parseFloat(walletData.balance);
      setBalance(nextBalance);
      localStorage.setItem(WALLET_BALANCE_KEY, String(nextBalance));
    }
  }, [walletData]);

  // Recharge mutation
  const rechargeMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      return await startRazorpayRecharge({
        userId: USER_ID,
        amount,
        paymentMethod,
      });
    },
    onSuccess: (data: any) => {
      if (data.wallet) {
        const nextBalance = typeof data.wallet.balance === 'number' ? data.wallet.balance : parseFloat(data.wallet.balance);
        setBalance(nextBalance);
        localStorage.setItem(WALLET_BALANCE_KEY, String(nextBalance));
        window.dispatchEvent(new CustomEvent(WALLET_BALANCE_EVENT, { detail: nextBalance }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
    },
  });

  const refreshBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/wallet", USER_ID] });
  }, []);

  const recharge = useCallback(async (amount: number, paymentMethod: string) => {
    return await rechargeMutation.mutateAsync({ amount, paymentMethod });
  }, [rechargeMutation]);

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
