// =====================================================================
// GET /api/subscriptions/plans - Subscription and Pricing Plans
// =====================================================================
import { memoryStore, loadAdminSettingsFromDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  // Sync latest admin pricing from database
  await loadAdminSettingsFromDb();

  const hourlyPrice = Number(memoryStore.adminSettings.get('hourly_pass_cost') ?? BUSINESS_CONFIG.HOURLY_PASS_PRICE_RWF);
  const threeDayPrice = Number(memoryStore.adminSettings.get('three_day_pass_cost') ?? BUSINESS_CONFIG.THREE_DAY_PASS_PRICE_RWF);
  const weeklyPrice = Number(memoryStore.adminSettings.get('weekly_pass_cost') ?? BUSINESS_CONFIG.WEEKLY_PASS_PRICE_RWF);
  const payPerMessagePrice = Number(memoryStore.adminSettings.get('pay_per_message_cost') ?? BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF);
  const contactUnlockPrice = Number(memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF);
  const currency = (memoryStore.adminSettings.get('default_currency') as string) || BUSINESS_CONFIG.DEFAULT_CURRENCY;

  const plans = [
    {
      code: 'free',
      name_en: 'Free Starter',
      name_rw: 'Ibanze ku Buntu',
      name_fr: 'Débutant Gratuit',
      description_en: 'Explore verified members, 3 free messages to new people and 3 free replies.',
      description_rw: "Reba abanyamuryango, ubutumwa 3 ku buntu ku bantu bashya n'ibisubizo 3.",
      description_fr: "Explorez les profils vérifiés, 3 messages gratuits et 3 réponses gratuites.",
      price: 0,
      currency,
      durationDays: 0,
      features: [
        'Complete Profile Setup',
        '3 Free Outgoing Messages',
        '3 Free Conversation Replies',
        'Algorithmic Compatibility Breakdown'
      ]
    },
    {
      code: 'hourly',
      name_en: 'Hourly Pass (24 Hours)',
      name_rw: "Pass y'Amasaha 24",
      name_fr: 'Pass Connexion 24 Heures',
      description_en: `Unlimited messaging for 24 hours. Quick connection boost for ${hourlyPrice} ${currency}.`,
      description_rw: `Ubutumwa budafite umupaka mu masaha 24 kuri ${hourlyPrice} ${currency}.`,
      description_fr: `Messagerie illimitée pendant 24 heures pour ${hourlyPrice} ${currency}.`,
      price: hourlyPrice,
      currency,
      durationDays: 1,
      features: [
        'Unlimited Outgoing Messages for 24h',
        'Instant Profile Match Delivery',
        'No per-message deductions',
        'Safe internal chat delivery'
      ]
    },
    {
      code: 'three_day',
      name_en: '3-Day Connection Pass',
      name_rw: "Icyumweru Gitoya (Iminsi 3)",
      name_fr: 'Pass Connexion 3 Jours',
      description_en: `Unlimited messaging for 72 hours. Perfect for weekend romance (${threeDayPrice} ${currency}).`,
      description_rw: `Ubutumwa budafite umupaka mu masaha 72 kuri ${threeDayPrice} ${currency}. Byiza ku mpera z'icyumweru.`,
      description_fr: `Messagerie illimitée pendant 72 heures (${threeDayPrice} ${currency}). Idéal pour le week-end.`,
      price: threeDayPrice,
      currency,
      durationDays: 3,
      isPopular: true,
      features: [
        'Unlimited Outgoing Messages for 72h',
        'Direct Conversation Initiations',
        'No per-message deductions',
        'Priority recommendation status'
      ]
    },
    {
      code: 'weekly',
      name_en: 'Weekly Premium',
      name_rw: 'Icyumweru Cyose',
      name_fr: 'Pass Hebdomadaire Premium',
      description_en: `Full access for 7 days with priority discovery and unlimited messaging (${weeklyPrice} ${currency}).`,
      description_rw: `Kuganira bidahagarara icyumweru cyose no kugaragara mbere kuri ${weeklyPrice} ${currency}.`,
      description_fr: `Accès illimité pendant 7 jours avec visibilité prioritaire (${weeklyPrice} ${currency}).`,
      price: weeklyPrice,
      currency,
      durationDays: 7,
      features: [
        'Unlimited Messaging for 7 Days',
        'Top Placement in Discover Feed',
        'See Who Liked You First',
        'Dedicated Support Assistance'
      ]
    },
    {
      code: 'pay_per_message',
      name_en: 'Pay-Per-Message',
      name_rw: 'Kwishyura Buri Butumwa',
      name_fr: 'Paiement Par Message',
      description_en: `Pay ${payPerMessagePrice} ${currency} only when you send an individual message after free allowance.`,
      description_rw: `Ishyura ${payPerMessagePrice} ${currency} gusa ku butumwa wohereje iyo ubufasha burangiye.`,
      description_fr: `Payez ${payPerMessagePrice} ${currency} par message envoyé hors quota gratuit.`,
      price: payPerMessagePrice,
      currency,
      durationDays: 0,
      features: [
        'Zero recurring commitment',
        'Only debited on actual sent message',
        'Keep existing conversation history open'
      ]
    },
    {
      code: 'contact_unlock',
      name_en: 'Direct Contact Unlock',
      name_rw: 'Kureba Nimero ya Telefone',
      name_fr: 'Déblocage Contact Direct',
      description_en: `Unlock direct phone number when the member gives mutual consent (${contactUnlockPrice} ${currency}).`,
      description_rw: `Reba numero ya telefone mugihe mwembi mwabyemeranyijweho (${contactUnlockPrice} ${currency}).`,
      description_fr: `Débloquez le numéro de téléphone avec consentement mutuel (${contactUnlockPrice} ${currency}).`,
      price: contactUnlockPrice,
      currency,
      durationDays: 0,
      features: [
        'Direct phone number revealed',
        'Strict recipient privacy and consent check',
        'Permanent contact access in your messages'
      ]
    }
  ];

  return res.status(200).json({ success: true, plans });
}
