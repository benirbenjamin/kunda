// =====================================================================
// POST /api/subscriptions/subscribe - Purchase Subscription Pass
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../../_lib/auth';
import { memoryStore } from '../../_lib/db';
import { debitWallet, getWalletBalance } from '../../_lib/wallet';
import { BUSINESS_CONFIG } from '../../_lib/config';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { planCode } = req.body;
  if (!planCode || !['three_day', 'weekly'].includes(planCode)) {
    return res.status(400).json({ success: false, error: 'Valid planCode (three_day, weekly) is required' });
  }

  const isThreeDay = planCode === 'three_day';
  const price = isThreeDay ? BUSINESS_CONFIG.THREE_DAY_PASS_PRICE_RWF : BUSINESS_CONFIG.WEEKLY_PASS_PRICE_RWF;
  const durationDays = isThreeDay ? 3 : 7;
  const planName = isThreeDay ? '3-Day Connection Pass' : 'Weekly Premium Pass';

  // 1. Debit Wallet
  const debitRes = await debitWallet(
    auth.userId,
    price,
    'subscription_purchase',
    `Purchased ${planName} (${price} RWF)`
  );

  if (!debitRes.success) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: debitRes.error || `Insufficient funds. Top up your wallet to activate this pass.`,
      requiredAmount: price,
    });
  }

  // 2. Set Expiration Date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const subRecord = {
    id: crypto.randomUUID(),
    userId: auth.userId,
    planCode,
    planName,
    startedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };

  memoryStore.subscriptions.push(subRecord);

  // 3. In-App Notification
  memoryStore.notifications.unshift({
    id: crypto.randomUUID(),
    userId: auth.userId,
    type: 'subscription_active',
    title: 'Membership Activated! 🌟',
    body: `Your ${planName} is active until ${expiresAt.toLocaleDateString()}. Enjoy unlimited messaging!`,
    linkUrl: '/dashboard/messages',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const updatedWallet = await getWalletBalance(auth.userId);

  return res.status(200).json({
    success: true,
    subscription: subRecord,
    wallet: updatedWallet,
  });
}
