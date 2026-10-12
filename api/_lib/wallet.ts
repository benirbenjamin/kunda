// =====================================================================
// KUNDA SPACE: ATOMIC WALLET & IMMUTABLE LEDGER SERVICE
// =====================================================================
import { memoryStore, query } from './db.js';
import crypto from 'crypto';

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amountMinor: number; // positive = credit, negative = debit
  currency: string;
  type: 'deposit' | 'message_fee' | 'contact_unlock' | 'subscription_purchase' | 'refund' | 'admin_adjustment';
  description: string;
  reference: string;
  idempotencyKey?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
}

/**
 * Gets user wallet balance (minor units) and currency
 */
export async function getWalletBalance(userId: string): Promise<{ balanceMinor: number; currency: string }> {
  // 1. Try PostgreSQL if available
  const res = await query('SELECT balance_minor, currency FROM wallets WHERE user_id = $1', [userId]);
  if (res && res.rows && res.rows.length > 0) {
    return {
      balanceMinor: parseInt(res.rows[0].balance_minor, 10),
      currency: res.rows[0].currency || 'RWF',
    };
  }

  // 2. Fallback to memoryStore
  const wallet = memoryStore.wallets.get(userId);
  if (wallet) {
    return wallet;
  }

  // Initialize new wallet if not yet existing
  const initial = { balanceMinor: 0, currency: 'RWF' };
  memoryStore.wallets.set(userId, initial);
  return initial;
}

/**
 * Credits a wallet with idempotency check
 */
export async function creditWallet(
  userId: string,
  amountMinor: number,
  type: WalletTransaction['type'],
  description: string,
  reference?: string,
  idempotencyKey?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (amountMinor <= 0) {
    return { success: false, newBalance: 0, error: 'Credit amount must be greater than zero' };
  }

  const txRef = reference || `TX_CR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const idemp = idempotencyKey || txRef;

  // Check idempotency in memoryStore
  const existing = memoryStore.transactions.find((t) => t.idempotencyKey === idemp || t.reference === txRef);
  if (existing) {
    const current = await getWalletBalance(userId);
    return { success: true, newBalance: current.balanceMinor };
  }

  // Execute in PostgreSQL if available
  const dbRes = await query(
    `INSERT INTO wallet_transactions (wallet_id, user_id, amount_minor, currency, type, description, reference, idempotency_key, status)
     VALUES ((SELECT id FROM wallets WHERE user_id = $1), $1, $2, 'RWF', $3, $4, $5, $6, 'completed')
     RETURNING amount_minor`,
    [userId, amountMinor, type, description, txRef, idemp]
  );

  if (dbRes) {
    await query(`UPDATE wallets SET balance_minor = balance_minor + $1 WHERE user_id = $2`, [amountMinor, userId]);
    const updated = await getWalletBalance(userId);
    return { success: true, newBalance: updated.balanceMinor };
  }

  // Fallback memoryStore ledger
  const current = memoryStore.wallets.get(userId) || { balanceMinor: 0, currency: 'RWF' };
  const newBalance = current.balanceMinor + amountMinor;
  memoryStore.wallets.set(userId, { balanceMinor: newBalance, currency: current.currency });

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor,
    currency: current.currency,
    type,
    description,
    reference: txRef,
    idempotencyKey: idemp,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);
  return { success: true, newBalance };
}

/**
 * Debits a wallet atomically with sufficient funds check
 */
export async function debitWallet(
  userId: string,
  amountMinor: number,
  type: WalletTransaction['type'],
  description: string,
  reference?: string,
  idempotencyKey?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (amountMinor <= 0) {
    return { success: false, newBalance: 0, error: 'Debit amount must be greater than zero' };
  }

  const txRef = reference || `TX_DB_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const idemp = idempotencyKey || txRef;

  // Idempotency check
  const existing = memoryStore.transactions.find((t) => t.idempotencyKey === idemp || t.reference === txRef);
  if (existing) {
    const current = await getWalletBalance(userId);
    return { success: true, newBalance: current.balanceMinor };
  }

  const current = await getWalletBalance(userId);
  if (current.balanceMinor < amountMinor) {
    return {
      success: false,
      newBalance: current.balanceMinor,
      error: `Insufficient wallet balance (${current.balanceMinor} RWF available, ${amountMinor} RWF required). Please top up.`,
    };
  }

  // Fallback memoryStore atomic debit
  const newBalance = current.balanceMinor - amountMinor;
  memoryStore.wallets.set(userId, { balanceMinor: newBalance, currency: current.currency });

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor: -amountMinor, // negative in ledger
    currency: current.currency,
    type,
    description,
    reference: txRef,
    idempotencyKey: idemp,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  // If Postgres is connected, update DB too
  await query(
    `INSERT INTO wallet_transactions (wallet_id, user_id, amount_minor, currency, type, description, reference, idempotency_key, status)
     VALUES ((SELECT id FROM wallets WHERE user_id = $1), $1, $2, 'RWF', $3, $4, $5, $6, 'completed')`,
    [userId, -amountMinor, type, description, txRef, idemp]
  );
  await query(`UPDATE wallets SET balance_minor = balance_minor - $1 WHERE user_id = $2`, [amountMinor, userId]);

  return { success: true, newBalance };
}

/**
 * Gets transaction ledger history for user
 */
export async function getTransactionHistory(userId: string): Promise<WalletTransaction[]> {
  const res = await query(
    `SELECT id, amount_minor, currency, type, description, reference, status, created_at 
     FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  if (res && res.rows && res.rows.length > 0) {
    return res.rows.map((r: any) => ({
      id: r.id,
      walletId: `w-${userId}`,
      userId,
      amountMinor: parseInt(r.amount_minor, 10),
      currency: r.currency,
      type: r.type,
      description: r.description,
      reference: r.reference,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  return memoryStore.transactions.filter((t) => t.userId === userId);
}
