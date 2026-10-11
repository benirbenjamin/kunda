import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api, getErrorMessage } from '../lib/api';

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
      const res = await api.get('/wallet/balance');
      if (res.data.success) {
        setBalance(res.data.balance);
        setCurrency(res.data.currency);
        setTotalDeposits(res.data.totalDeposits || 0);
        setTotalSpent(res.data.totalSpent || 0);
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
      const res = await api.post('/payments/initialize', { amount, currency });
      if (res.data.success && res.data.paymentUrl) {
        return { success: true, paymentUrl: res.data.paymentUrl };
      }
      return { success: false, error: res.data.error || 'Failed to initialize payment' };
    } catch (err: any) {
      return { success: false, error: getErrorMessage(err) };
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
