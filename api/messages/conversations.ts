// =====================================================================
// GET /api/messages/conversations - List member conversations
// =====================================================================
import { extractAuthUser } from '../_lib/auth';
import { memoryStore } from '../_lib/db';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Find all messages involving the user
  const userMessages = memoryStore.messages.filter(
    (m) => m.senderId === auth.userId || m.recipientId === auth.userId
  );

  // Group by partner ID
  const partnerMap = new Map<string, { lastMessage: any; unreadCount: number }>();

  // Also include mutual matches that haven't exchanged messages yet
  const userMatches = memoryStore.matches.filter(
    (m) => m.user1Id === auth.userId || m.user2Id === auth.userId
  );
  for (const m of userMatches) {
    const partnerId = m.user1Id === auth.userId ? m.user2Id : m.user1Id;
    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, { lastMessage: null, unreadCount: 0 });
    }
  }

  for (const msg of userMessages) {
    const partnerId = msg.senderId === auth.userId ? msg.recipientId : msg.senderId;
    const existing = partnerMap.get(partnerId);
    const unread = !msg.isRead && msg.recipientId === auth.userId ? 1 : 0;

    if (!existing) {
      partnerMap.set(partnerId, { lastMessage: msg, unreadCount: unread });
    } else {
      if (unread) existing.unreadCount += 1;
      if (!existing.lastMessage || new Date(msg.createdAt) > new Date(existing.lastMessage.createdAt)) {
        existing.lastMessage = msg;
      }
    }
  }

  const conversationList = [];
  for (const [partnerId, data] of partnerMap.entries()) {
    const partnerProfile = memoryStore.profiles.find((p) => p.userId === partnerId);
    const partnerUser = memoryStore.users.find((u) => u.id === partnerId);
    if (!partnerProfile || !partnerUser) continue;

    const isContactUnlocked = memoryStore.contactUnlocks.some(
      (cu) => cu.requesterId === auth.userId && cu.targetUserId === partnerId
    );

    conversationList.push({
      partnerId,
      partnerName: partnerProfile.displayName,
      partnerAvatar: partnerProfile.photos?.[0] || '',
      partnerCity: partnerProfile.city,
      lastMessage: data.lastMessage ? data.lastMessage.content : 'Started a match! Say hello 👋',
      lastMessageTime: data.lastMessage ? data.lastMessage.createdAt : new Date().toISOString(),
      unreadCount: data.unreadCount,
      isContactUnlocked,
      partnerPhone: isContactUnlocked ? `${partnerUser.phoneCode} ${partnerUser.phone}` : null,
      contactConsentGiven: partnerProfile.contactSharingConsent || false,
    });
  }

  // Sort by last activity descending
  conversationList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  return res.status(200).json({ success: true, conversations: conversationList });
}
