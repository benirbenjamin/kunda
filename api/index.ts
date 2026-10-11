// =====================================================================
// KUNDA SPACE: CONSOLIDATED SERVERLESS FUNCTION DISPATCHER (Vercel)
// =====================================================================
import registerHandler from './_routes/auth/register';
import loginHandler from './_routes/auth/login';
import meHandler from './_routes/auth/me';
import verifyEmailHandler from './_routes/auth/verify-email';
import forgotPasswordHandler from './_routes/auth/forgot-password';
import resetPasswordHandler from './_routes/auth/reset-password';
import uploadHandler from './_routes/upload/index';
import tutorialsHandler from './_routes/tutorials/index';
import discoverHandler from './_routes/members/discover';
import interactionHandler from './_routes/members/interaction';
import matchesHandler from './_routes/members/matches';
import conversationsHandler from './_routes/messages/conversations';
import sendHandler from './_routes/messages/send';
import unlockContactHandler from './_routes/messages/unlock-contact';
import balanceHandler from './_routes/wallet/balance';
import transactionsHandler from './_routes/wallet/transactions';
import initPaymentHandler from './_routes/payments/initialize';
import webhookHandler from './_routes/payments/webhook';
import verifyPaymentHandler from './_routes/payments/verify';
import plansHandler from './_routes/subscriptions/plans';
import subscribeHandler from './_routes/subscriptions/subscribe';
import notificationsHandler from './_routes/notifications/index';
import adminMetricsHandler from './_routes/admin/metrics';
import adminUsersHandler from './_routes/admin/users';
import adminSettingsHandler from './_routes/admin/settings';
import adminModerationHandler from './_routes/admin/moderation';
import adminLedgerHandler from './_routes/admin/ledger';

const routes: Record<string, (req: any, res: any) => Promise<any> | any> = {
  'auth/login': loginHandler,
  'auth/register': registerHandler,
  'auth/me': meHandler,
  'auth/verify-email': verifyEmailHandler,
  'auth/forgot-password': forgotPasswordHandler,
  'auth/reset-password': resetPasswordHandler,
  'upload': uploadHandler,
  'tutorials': tutorialsHandler,
  'members/discover': discoverHandler,
  'members/interaction': interactionHandler,
  'members/matches': matchesHandler,
  'messages/conversations': conversationsHandler,
  'messages/send': sendHandler,
  'messages/unlock-contact': unlockContactHandler,
  'wallet/balance': balanceHandler,
  'wallet/transactions': transactionsHandler,
  'payments/initialize': initPaymentHandler,
  'payments/webhook': webhookHandler,
  'payments/verify': verifyPaymentHandler,
  'subscriptions/plans': plansHandler,
  'subscriptions/subscribe': subscribeHandler,
  'notifications': notificationsHandler,
  'admin/metrics': adminMetricsHandler,
  'admin/users': adminUsersHandler,
  'admin/settings': adminSettingsHandler,
  'admin/moderation': adminModerationHandler,
  'admin/ledger': adminLedgerHandler,
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Resolve path from rewrite query param `path`, headers, or req.url
  let resolvedPath = '';
  if (Array.isArray(req.query?.path)) {
    resolvedPath = req.query.path.join('/');
  } else if (typeof req.query?.path === 'string') {
    resolvedPath = req.query.path;
  }

  if (!resolvedPath) {
    const rawUrl =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-forwarded-uri'] as string) ||
      req.url ||
      '';
    const cleanUrl = rawUrl.split('?')[0];
    resolvedPath = cleanUrl.replace(/^\/api\/?/, '').replace(/^\//, '');
  }

  // Normalize path: strip query params if any and trim slashes
  resolvedPath = resolvedPath.split('?')[0].replace(/^\/+/, '').replace(/\/+$/, '');

  // Safe body parsing: if body arrived as string, parse it to JSON
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch (parseErr) {
      console.warn('Failed to parse string request body as JSON:', parseErr);
    }
  } else if (!req.body && req.method !== 'GET') {
    req.body = {};
  }

  const targetHandler = routes[resolvedPath];

  if (targetHandler) {
    try {
      return await targetHandler(req, res);
    } catch (err: any) {
      console.error(`API execution error on [${req.method}] /api/${resolvedPath}:`, err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal Server Error',
      });
    }
  }

  // Health check fallback
  if (resolvedPath === 'health' || resolvedPath === '') {
    return res.status(200).json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
  }

  return res.status(404).json({
    success: false,
    error: `API route not found: /api/${resolvedPath}`,
  });
}
