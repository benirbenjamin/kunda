// =====================================================================
// POST /api/payments/webhook - Flutterwave Webhook Listener
// =====================================================================
import { verifyFlutterwaveWebhookSignature } from '../../_lib/flutterwave.js';
import { creditWallet } from '../../_lib/wallet.js';
import { memoryStore } from '../../_lib/db.js';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // 1. Verify Webhook Signature Header
  const signature = req.headers['verif-hash'] || req.headers['Verif-Hash'];
  if (!verifyFlutterwaveWebhookSignature(signature)) {
    console.warn('Unauthorized Flutterwave webhook attempt with invalid hash signature.');
    return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
  }

  const payload = req.body;
  const event = payload?.event;
  const data = payload?.data;

  if (event === 'charge.completed' && data?.status === 'successful') {
    const txRef = data.tx_ref;
    const amount = parseInt(data.amount, 10);
    const currency = data.currency || 'RWF';
    const customerEmail = data.customer?.email?.toLowerCase();

    // Find user by customer email
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === customerEmail);
    if (!user) {
      console.warn(`Webhook received for unknown user email: ${customerEmail}`);
      return res.status(200).json({ status: 'ignored_unknown_user' });
    }

    // Atomically credit wallet with idempotency on txRef
    const creditResult = await creditWallet(
      user.id,
      amount,
      'deposit',
      `Flutterwave Verified Deposit (${amount} ${currency})`,
      txRef,
      txRef // Idempotency key
    );

    // Send notification
    memoryStore.notifications.unshift({
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'deposit_confirmed',
      title: 'Deposit Confirmed! 💳',
      body: `Your wallet has been credited with ${amount} ${currency}. Reference: ${txRef}`,
      linkUrl: '/dashboard/wallet',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ status: 'success', credited: creditResult.success });
  }

  return res.status(200).json({ status: 'received' });
}
