// =====================================================================
// GET /api/wallet/balance - Real Ledger Balance & Financial Overview
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { getWalletBalance, getTransactionHistory } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const wallet = await getWalletBalance(auth.userId);
  const transactions = await getTransactionHistory(auth.userId);

  // Compute total deposits and total spent from ledger entries
  let totalDeposits = 0;
  let totalSpent = 0;

  for (const t of transactions) {
    if (t.status === 'completed') {
      if (t.amountMinor > 0) {
        totalDeposits += t.amountMinor;
      } else {
        totalSpent += Math.abs(t.amountMinor);
      }
    }
  }

  return res.status(200).json({
    success: true,
    balance: wallet.balanceMinor,
    currency: wallet.currency,
    totalDeposits,
    totalSpent,
  });
}
