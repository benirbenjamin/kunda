// =====================================================================
// GET /api/subscriptions/plans - Subscription and Pricing Plans
// =====================================================================

export default async function handler(req: any, res: any) {
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
      currency: 'RWF',
      durationDays: 0,
      features: [
        'Complete Profile Setup',
        '3 Free Outgoing Messages',
        '3 Free Conversation Replies',
        'Algorithmic Compatibility Breakdown'
      ]
    },
    {
      code: 'three_day',
      name_en: '3-Day Connection Pass',
      name_rw: "Icyumweru Gitoya (Iminsi 3)",
      name_fr: 'Pass Connexion 3 Jours',
      description_en: 'Unlimited messaging for 72 hours. Perfect for weekend romance.',
      description_rw: "Ubutumwa budafite umupaka mu masaha 72. Byiza ku mpera z'icyumweru.",
      description_fr: 'Messagerie illimitée pendant 72 heures. Idéal pour le week-end.',
      price: 1500,
      currency: 'RWF',
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
      description_en: 'Full access for 7 days with priority discovery and unlimited messaging.',
      description_rw: 'Kuganira bidahagarara icyumweru cyose no kugaragara mbere.',
      description_fr: 'Accès illimité pendant 7 jours avec visibilité prioritaire.',
      price: 3000,
      currency: 'RWF',
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
      description_en: 'Pay 150 RWF only when you send an individual message after free allowance.',
      description_rw: 'Ishyura 150 RWF gusa ku butumwa wohereje iyo ubufasha burangiye.',
      description_fr: 'Payez 150 RWF par message envoyé hors quota gratuit.',
      price: 150,
      currency: 'RWF',
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
      description_en: 'Unlock direct phone number when the member gives mutual consent.',
      description_rw: 'Reba numero ya telefone mugihe mwembi mwabyemeranyijweho.',
      description_fr: 'Débloquez le numéro de téléphone avec consentement mutuel.',
      price: 2000,
      currency: 'RWF',
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
