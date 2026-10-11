// =====================================================================
// KUNDA SPACE: LOCAL EXPRESS API RUNNER (Emulates Vercel Serverless Functions)
// =====================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import API route handlers
import registerHandler from './api/auth/register';
import loginHandler from './api/auth/login';
import meHandler from './api/auth/me';
import verifyEmailHandler from './api/auth/verify-email';
import forgotPasswordHandler from './api/auth/forgot-password';
import resetPasswordHandler from './api/auth/reset-password';
import uploadHandler from './api/upload/index';
import tutorialsHandler from './api/tutorials/index';
import discoverHandler from './api/members/discover';
import interactionHandler from './api/members/interaction';
import matchesHandler from './api/members/matches';
import conversationsHandler from './api/messages/conversations';
import sendHandler from './api/messages/send';
import unlockContactHandler from './api/messages/unlock-contact';
import balanceHandler from './api/wallet/balance';
import transactionsHandler from './api/wallet/transactions';
import initPaymentHandler from './api/payments/initialize';
import webhookHandler from './api/payments/webhook';
import verifyPaymentHandler from './api/payments/verify';
import plansHandler from './api/subscriptions/plans';
import subscribeHandler from './api/subscriptions/subscribe';
import notificationsHandler from './api/notifications/index';
import adminMetricsHandler from './api/admin/metrics';
import adminUsersHandler from './api/admin/users';
import adminSettingsHandler from './api/admin/settings';
import adminModerationHandler from './api/admin/moderation';
import adminLedgerHandler from './api/admin/ledger';

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

// Auth routes
app.all('/api/auth/register', wrap(registerHandler));
app.all('/api/auth/login', wrap(loginHandler));
app.all('/api/auth/me', wrap(meHandler));
app.all('/api/auth/verify-email', wrap(verifyEmailHandler));
app.all('/api/auth/forgot-password', wrap(forgotPasswordHandler));
app.all('/api/auth/reset-password', wrap(resetPasswordHandler));

// Uploads (Google Drive) & Tutorials
app.all('/api/upload', wrap(uploadHandler));
app.all('/api/tutorials', wrap(tutorialsHandler));

// Members & Matching routes
app.all('/api/members/discover', wrap(discoverHandler));
app.all('/api/members/interaction', wrap(interactionHandler));
app.all('/api/members/matches', wrap(matchesHandler));

// Messaging & Contact Unlock
app.all('/api/messages/conversations', wrap(conversationsHandler));
app.all('/api/messages/send', wrap(sendHandler));
app.all('/api/messages/unlock-contact', wrap(unlockContactHandler));

// Wallet & Ledger
app.all('/api/wallet/balance', wrap(balanceHandler));
app.all('/api/wallet/transactions', wrap(transactionsHandler));

// Payments (Flutterwave)
app.all('/api/payments/initialize', wrap(initPaymentHandler));
app.all('/api/payments/webhook', wrap(webhookHandler));
app.all('/api/payments/verify', wrap(verifyPaymentHandler));

// Subscriptions
app.all('/api/subscriptions/plans', wrap(plansHandler));
app.all('/api/subscriptions/subscribe', wrap(subscribeHandler));

// Notifications
app.all('/api/notifications', wrap(notificationsHandler));

// Admin routes
app.all('/api/admin/metrics', wrap(adminMetricsHandler));
app.all('/api/admin/users', wrap(adminUsersHandler));
app.all('/api/admin/settings', wrap(adminSettingsHandler));
app.all('/api/admin/moderation', wrap(adminModerationHandler));
app.all('/api/admin/ledger', wrap(adminLedgerHandler));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`✨ Kunda Space API Server listening on port ${PORT}`);
});
