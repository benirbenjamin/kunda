// =====================================================================
// KUNDA SPACE: CONSOLIDATED EXPRESS API SERVER & SERVERLESS ENTRY
// =====================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import API route handlers from consolidated _routes directory
import registerHandler from './api/_routes/auth/register';
import loginHandler from './api/_routes/auth/login';
import meHandler from './api/_routes/auth/me';
import verifyEmailHandler from './api/_routes/auth/verify-email';
import forgotPasswordHandler from './api/_routes/auth/forgot-password';
import resetPasswordHandler from './api/_routes/auth/reset-password';
import uploadHandler from './api/_routes/upload/index';
import tutorialsHandler from './api/_routes/tutorials/index';
import discoverHandler from './api/_routes/members/discover';
import interactionHandler from './api/_routes/members/interaction';
import matchesHandler from './api/_routes/members/matches';
import conversationsHandler from './api/_routes/messages/conversations';
import sendHandler from './api/_routes/messages/send';
import unlockContactHandler from './api/_routes/messages/unlock-contact';
import balanceHandler from './api/_routes/wallet/balance';
import transactionsHandler from './api/_routes/wallet/transactions';
import initPaymentHandler from './api/_routes/payments/initialize';
import webhookHandler from './api/_routes/payments/webhook';
import verifyPaymentHandler from './api/_routes/payments/verify';
import plansHandler from './api/_routes/subscriptions/plans';
import subscribeHandler from './api/_routes/subscriptions/subscribe';
import notificationsHandler from './api/_routes/notifications/index';
import adminMetricsHandler from './api/_routes/admin/metrics';
import adminUsersHandler from './api/_routes/admin/users';
import adminSettingsHandler from './api/_routes/admin/settings';
import adminModerationHandler from './api/_routes/admin/moderation';
import adminLedgerHandler from './api/_routes/admin/ledger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper adapter for Vercel function signature
const wrap = (handler: any) => async (req: express.Request, res: express.Response) => {
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error('Unhandled API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
};

// Dual-bind helper so routes work whether accessed at /api/... or routed directly
const bindRoute = (routePath: string, handler: any) => {
  const withoutApi = routePath.replace(/^\/api/, '');
  app.all(routePath, wrap(handler));
  if (withoutApi && withoutApi !== routePath) {
    app.all(withoutApi, wrap(handler));
  }
};

// Auth routes
bindRoute('/api/auth/register', registerHandler);
bindRoute('/api/auth/login', loginHandler);
bindRoute('/api/auth/me', meHandler);
bindRoute('/api/auth/verify-email', verifyEmailHandler);
bindRoute('/api/auth/forgot-password', forgotPasswordHandler);
bindRoute('/api/auth/reset-password', resetPasswordHandler);

// Uploads (Google Drive) & Tutorials
bindRoute('/api/upload', uploadHandler);
bindRoute('/api/tutorials', tutorialsHandler);

// Members & Matching routes
bindRoute('/api/members/discover', discoverHandler);
bindRoute('/api/members/interaction', interactionHandler);
bindRoute('/api/members/matches', matchesHandler);

// Messaging & Contact Unlock
bindRoute('/api/messages/conversations', conversationsHandler);
bindRoute('/api/messages/send', sendHandler);
bindRoute('/api/messages/unlock-contact', unlockContactHandler);

// Wallet & Ledger
bindRoute('/api/wallet/balance', balanceHandler);
bindRoute('/api/wallet/transactions', transactionsHandler);

// Payments (Flutterwave)
bindRoute('/api/payments/initialize', initPaymentHandler);
bindRoute('/api/payments/webhook', webhookHandler);
bindRoute('/api/payments/verify', verifyPaymentHandler);

// Subscriptions
bindRoute('/api/subscriptions/plans', plansHandler);
bindRoute('/api/subscriptions/subscribe', subscribeHandler);

// Notifications
bindRoute('/api/notifications', notificationsHandler);

// Admin routes
bindRoute('/api/admin/metrics', adminMetricsHandler);
bindRoute('/api/admin/users', adminUsersHandler);
bindRoute('/api/admin/settings', adminSettingsHandler);
bindRoute('/api/admin/moderation', adminModerationHandler);
bindRoute('/api/admin/ledger', adminLedgerHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✨ Kunda Space API Server listening on port ${PORT}`);
  });
}

export default app;
