// =====================================================================
// POST /api/auth/forgot-password - Request Password Reset Email
// =====================================================================
import crypto from 'crypto';
import { memoryStore, query } from '../../_lib/db';
import { sendPasswordResetEmail } from '../../_lib/email';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = crypto.randomBytes(32).toString('hex');

      user.resetCode = resetCode;
      user.resetToken = resetToken;
      user.resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      const profile = memoryStore.profiles.find((p) => p.userId === user.id);
      const displayName = profile?.displayName || 'Kunda Space Member';

      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      try {
        await sendPasswordResetEmail(user.email, displayName, resetCode, resetToken, appUrl);
      } catch (emailErr) {
        console.warn('Password reset email dispatch error:', emailErr);
      }

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit reset code and recovery link have been dispatched.',
        resetCode, // Returned for instant prototype testing
      });
    }

    // Anti-account enumeration: Return generic success even if user not found
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit reset code and recovery link have been dispatched.',
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process password reset' });
  }
}
