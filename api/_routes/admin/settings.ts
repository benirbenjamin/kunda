// =====================================================================
// GET & POST /api/admin/settings - Dynamic Business Configuration
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  // GET: Fetch all current settings
  if (req.method === 'GET') {
    const currentSettings = {
      freeInitialMessages: memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES,
      freeDistinctRecipients: memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS,
      freeReplies: memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED,
      payPerMessagePrice: memoryStore.adminSettings.get('pay_per_message_cost') ?? BUSINESS_CONFIG.PAY_PER_MESSAGE_PRICE_RWF,
      contactUnlockPrice: memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF,
      defaultCurrency: memoryStore.adminSettings.get('default_currency') ?? BUSINESS_CONFIG.DEFAULT_CURRENCY,
      moderationStrictness: memoryStore.adminSettings.get('moderation_strictness') ?? 'high',
      // Email Provider settings
      emailProvider: memoryStore.adminSettings.get('email_provider') ?? 'mock',
      resendApiKey: memoryStore.adminSettings.get('resend_api_key') ?? '',
      resendFromEmail: memoryStore.adminSettings.get('resend_from_email') ?? 'Kunda Space <onboarding@resend.dev>',
      smtpHost: memoryStore.adminSettings.get('smtp_host') ?? 'smtp.gmail.com',
      smtpPort: memoryStore.adminSettings.get('smtp_port') ?? 587,
      smtpSecure: memoryStore.adminSettings.get('smtp_secure') ?? false,
      smtpUser: memoryStore.adminSettings.get('smtp_user') ?? '',
      smtpPass: memoryStore.adminSettings.get('smtp_pass') ?? '',
      smtpFromEmail: memoryStore.adminSettings.get('smtp_from_email') ?? 'Kunda Space <noreply@kunda.space>',
      // Google Drive Refresh Token settings
      googleDriveClientId: memoryStore.adminSettings.get('google_drive_client_id') ?? '',
      googleDriveClientSecret: memoryStore.adminSettings.get('google_drive_client_secret') ?? '',
      googleDriveRefreshToken: memoryStore.adminSettings.get('google_drive_refresh_token') ?? '',
      googleDriveFolderId: memoryStore.adminSettings.get('google_drive_folder_id') ?? '',
    };

    return res.status(200).json({ success: true, settings: currentSettings });
  }

  // POST: Update settings
  if (req.method === 'POST') {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }

    if (updates.freeInitialMessages !== undefined) {
      memoryStore.adminSettings.set('free_initial_messages', parseInt(updates.freeInitialMessages, 10));
    }
    if (updates.freeDistinctRecipients !== undefined) {
      memoryStore.adminSettings.set('free_distinct_recipients', parseInt(updates.freeDistinctRecipients, 10));
    }
    if (updates.freeReplies !== undefined) {
      memoryStore.adminSettings.set('free_replies', parseInt(updates.freeReplies, 10));
    }
    if (updates.payPerMessagePrice !== undefined) {
      memoryStore.adminSettings.set('pay_per_message_cost', parseInt(updates.payPerMessagePrice, 10));
    }
    if (updates.contactUnlockPrice !== undefined) {
      memoryStore.adminSettings.set('contact_unlock_cost', parseInt(updates.contactUnlockPrice, 10));
    }
    if (updates.moderationStrictness !== undefined) {
      memoryStore.adminSettings.set('moderation_strictness', updates.moderationStrictness);
    }

    // Email Provider settings
    if (updates.emailProvider !== undefined) memoryStore.adminSettings.set('email_provider', updates.emailProvider);
    if (updates.resendApiKey !== undefined) memoryStore.adminSettings.set('resend_api_key', updates.resendApiKey);
    if (updates.resendFromEmail !== undefined) memoryStore.adminSettings.set('resend_from_email', updates.resendFromEmail);
    if (updates.smtpHost !== undefined) memoryStore.adminSettings.set('smtp_host', updates.smtpHost);
    if (updates.smtpPort !== undefined) memoryStore.adminSettings.set('smtp_port', parseInt(updates.smtpPort, 10));
    if (updates.smtpSecure !== undefined) memoryStore.adminSettings.set('smtp_secure', Boolean(updates.smtpSecure));
    if (updates.smtpUser !== undefined) memoryStore.adminSettings.set('smtp_user', updates.smtpUser);
    if (updates.smtpPass !== undefined) memoryStore.adminSettings.set('smtp_pass', updates.smtpPass);
    if (updates.smtpFromEmail !== undefined) memoryStore.adminSettings.set('smtp_from_email', updates.smtpFromEmail);

    // Google Drive settings
    if (updates.googleDriveClientId !== undefined) memoryStore.adminSettings.set('google_drive_client_id', updates.googleDriveClientId);
    if (updates.googleDriveClientSecret !== undefined) memoryStore.adminSettings.set('google_drive_client_secret', updates.googleDriveClientSecret);
    if (updates.googleDriveRefreshToken !== undefined) memoryStore.adminSettings.set('google_drive_refresh_token', updates.googleDriveRefreshToken);
    if (updates.googleDriveFolderId !== undefined) memoryStore.adminSettings.set('google_drive_folder_id', updates.googleDriveFolderId);

    return res.status(200).json({ success: true, message: 'Settings successfully updated.' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
