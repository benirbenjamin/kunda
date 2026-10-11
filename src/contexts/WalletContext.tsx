import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface WalletContextType {
  balance: number;
  currency: string;
  totalDeposits: number;
  totalSpent: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  depositFunds: (amount: number) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('RWF');
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);

  const refreshBalance = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setCurrency(data.currency);
        setTotalDeposits(data.totalDeposits || 0);
        setTotalSpent(data.totalSpent || 0);
      }
    } catch (err) {
      console.error('Wallet balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
    }
  }, [isAuthenticated]);

  const depositFunds = async (amount: number) => {
    if (!token) return { success: false, error: 'Unauthorized' };
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, currency }),
      });
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        return { success: true, paymentUrl: data.paymentUrl };
      }
      return { success: false, error: data.error || 'Failed to initialize payment' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Payment network error' };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        currency,
        totalDeposits,
        totalSpent,
        loading,
        refreshBalance,
        depositFunds,
        isDepositModalOpen,
        setIsDepositModalOpen,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
