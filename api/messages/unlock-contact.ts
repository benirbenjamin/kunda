// =====================================================================
// POST /api/messages/unlock-contact - Direct Contact Unlocking
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../_lib/auth';
import { memoryStore } from '../_lib/db';
import { debitWallet, getWalletBalance } from '../_lib/wallet';
import { BUSINESS_CONFIG } from '../_lib/config';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'Target user ID is required' });
  }

  if (targetUserId === auth.userId) {
    return res.status(400).json({ success: false, error: 'Cannot unlock your own contact info' });
  }

  // Check if target user exists and is not suspended
  const targetUser = memoryStore.users.find((u) => u.id === targetUserId);
  const targetProfile = memoryStore.profiles.find((p) => p.userId === targetUserId);

  if (!targetUser || !targetProfile) {
    return res.status(404).json({ success: false, error: 'Target member profile not found' });
  }

  if (targetUser.isSuspended) {
    return res.status(403).json({ success: false, error: 'Cannot unlock contact of a restricted member' });
  }

  // 1. Mandatory Consent Check
  if (!targetProfile.contactSharingConsent) {
    return res.status(403).json({
      success: false,
      error: 'CONSENT_REQUIRED',
      message: `${targetProfile.displayName} has not enabled direct contact sharing on their profile yet. You can ask them respectfully via chat first.`,
    });
  }

  // 2. Check if already unlocked
  const alreadyUnlocked = memoryStore.contactUnlocks.some(
    (cu) => cu.requesterId === auth.userId && cu.targetUserId === targetUserId
  );

  if (alreadyUnlocked) {
    return res.status(200).json({
      success: true,
      alreadyUnlocked: true,
      phone: `${targetUser.phoneCode} ${targetUser.phone}`,
      displayName: targetProfile.displayName,
    });
  }

  // 3. Debit Wallet
  const unlockCost = BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF;
  const debitRes = await debitWallet(
    auth.userId,
    unlockCost,
    'contact_unlock',
    `Direct contact unlock for ${targetProfile.displayName} (${unlockCost} RWF)`
  );

  if (!debitRes.success) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: debitRes.error || `Insufficient balance. Contact unlock requires ${unlockCost} RWF.`,
      requiredAmount: unlockCost,
    });
  }

  // 4. Save Unlock Entitlement
  const unlockRecord = {
    id: crypto.randomUUID(),
    requesterId: auth.userId,
    targetUserId,
    amountPaidMinor: unlockCost,
    currency: 'RWF',
    createdAt: new Date().toISOString(),
  };

  memoryStore.contactUnlocks.push(unlockRecord);

  // 5. Notify target user that their contact was unlocked with their consent
  const requesterProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
  memoryStore.notifications.unshift({
    id: crypto.randomUUID(),
    userId: targetUserId,
    type: 'contact_unlocked',
    title: 'Contact Shared',
    body: `${requesterProfile?.displayName || 'A mutual connection'} has unlocked your phone number via mutual consent.`,
    linkUrl: `/dashboard/messages?user=${auth.userId}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const updatedWallet = await getWalletBalance(auth.userId);

  return res.status(200).json({
    success: true,
    phone: `${targetUser.phoneCode} ${targetUser.phone}`,
    displayName: targetProfile.displayName,
    wallet: updatedWallet,
  });
}
