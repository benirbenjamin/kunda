// =====================================================================
// GET /api/auth/me - Authenticated session state
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { getWalletBalance } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized session' });
  }

  const user = memoryStore.users.find((u) => u.id === auth.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User account not found' });
  }

  const profile = memoryStore.profiles.find((p) => p.userId === auth.userId);
  const wallet = await getWalletBalance(auth.userId);

  // Remaining free allowances
  const allowances = memoryStore.allowances.get(auth.userId) || {
    initialRemaining: 3,
    distinctRecipients: [],
    repliesRemaining: 3,
  };

  // Active subscription check
  const activeSub = memoryStore.subscriptions.find(
    (s) => s.userId === auth.userId && s.status === 'active' && new Date(s.expiresAt) > new Date()
  );

  // Unread messages count
  const unreadMessagesCount = memoryStore.messages.filter(
    (m) => m.recipientId === auth.userId && !m.isRead
  ).length;

  // Unread notifications count
  const unreadNotificationsCount = memoryStore.notifications.filter(
    (n) => n.userId === auth.userId && !n.isRead
  ).length;

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      dob: user.dob,
      phone: user.phone,
      phoneCode: user.phoneCode,
      preferredLanguage: user.preferredLanguage,
    },
    profile,
    wallet,
    allowances,
    activeSubscription: activeSub || null,
    counts: {
      unreadMessages: unreadMessagesCount,
      unreadNotifications: unreadNotificationsCount,
    },
  });
}
