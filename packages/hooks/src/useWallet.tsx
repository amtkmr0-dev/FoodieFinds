import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Simulate fetching wallet balance
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate balance updates
      setBalance(prev => prev + 1);
    }, 30000); // Every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const refreshBalance = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBalance(prev => prev + Math.random() * 10);
      setIsLoading(false);
    }, 500);
  };

  const recharge = async (amount: number, paymentMethod: string) => {
    setIsLoading(true);
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setBalance(prev => prev + amount);
        setIsLoading(false);
        resolve();
      }, 1000);
    });
  };

  return (
    <WalletContext.Provider value={{ balance, isLoading, refreshBalance, recharge }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
