// =====================================================================
// POST /api/auth/reset-password - Complete Password Reset
// =====================================================================
import { hashPassword } from '../../_lib/auth';
import { memoryStore, query } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, code, token, newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    if (!email && !token) {
      return res.status(400).json({ success: false, error: 'Email address or reset token is required' });
    }

    let user = null;
    if (token) {
      user = memoryStore.users.find((u) => u.resetToken === token);
    } else if (email) {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found or recovery token is invalid' });
    }

    // Check expiration
    if (user.resetExpiresAt && new Date(user.resetExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'Reset code has expired. Please request a new one.' });
    }

    // Verify code or token
    const isCodeMatch = code && user.resetCode === code.toString().trim();
    const isTokenMatch = token && user.resetToken === token;

    if (!isCodeMatch && !isTokenMatch) {
      return res.status(400).json({ success: false, error: 'Invalid reset code. Please check your email.' });
    }

    // Hash new password and save
    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    user.resetCode = null;
    user.resetToken = null;
    user.resetExpiresAt = null;

    // Update in PostgreSQL if connected
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
}
