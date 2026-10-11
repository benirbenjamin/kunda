// =====================================================================
// GET /api/members/matches - List mutual matches
// =====================================================================
import { extractAuthUser } from '../_lib/auth';
import { memoryStore } from '../_lib/db';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userMatches = memoryStore.matches.filter(
    (m) => m.user1Id === auth.userId || m.user2Id === auth.userId
  );

  const results = [];
  for (const m of userMatches) {
    const partnerId = m.user1Id === auth.userId ? m.user2Id : m.user1Id;
    const partnerProfile = memoryStore.profiles.find((p) => p.userId === partnerId);
    if (partnerProfile) {
      results.push({
        matchId: m.id,
        partnerId,
        displayName: partnerProfile.displayName,
        city: partnerProfile.city,
        country: partnerProfile.country,
        relationshipIntention: partnerProfile.relationshipIntention,
        photos: partnerProfile.photos || [],
        compatibilityScore: m.compatibilityScore || 88,
        createdAt: m.createdAt,
      });
    }
  }

  return res.status(200).json({ success: true, matches: results });
}
