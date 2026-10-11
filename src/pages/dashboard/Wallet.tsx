import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DepositModal } from '../../components/ui/DepositModal';
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ShieldCheck, History } from 'lucide-react';

export const Wallet: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();
  const { balance, currency, totalDeposits, totalSpent, setIsDepositModalOpen, refreshBalance } = useWallet();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Fetch ledger error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    refreshBalance();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('wallet.title')}</h1>
          <p className="text-xs text-slate-500">{t('wallet.subtitle')}</p>
        </div>
        <Button onClick={() => setIsDepositModalOpen(true)} className="shadow-md shadow-rose-200">
          + Add Funds
        </Button>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-200 space-y-2">
          <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
            {t('wallet.availableBalance')}
          </span>
          <div className="text-3xl font-black">{balance.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-rose-100/80">Minor-unit audited ledger balance</p>
        </div>

        {/* Total Deposits */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('wallet.totalDeposits')}
          </span>
          <div className="text-2xl font-black text-slate-900">{totalDeposits.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Flutterwave verified
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('wallet.totalSpent')}
          </span>
          <div className="text-2xl font-black text-slate-900">{totalSpent.toLocaleString()} {currency}</div>
          <p className="text-[11px] text-slate-400">Messages & Contact unlocks</p>
        </div>
      </div>

      {/* Immutable Transaction Ledger History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            {t('wallet.historyTitle')}
          </h3>
          <span className="text-xs text-slate-400 font-medium">{transactions.length} records</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">{t('wallet.noTransactions')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 capitalize">
                      {tx.type?.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">{tx.reference}</td>
                    <td className="p-4 text-right font-black whitespace-nowrap">
                      <span className={tx.amountMinor > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.amountMinor > 0 ? `+${tx.amountMinor.toLocaleString()}` : tx.amountMinor.toLocaleString()} {tx.currency || 'RWF'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={tx.status === 'completed' ? 'emerald' : 'amber'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Deposit Modal */}
      <DepositModal />
    </div>
  );
};
