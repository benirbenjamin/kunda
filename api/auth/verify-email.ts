// =====================================================================
// POST /api/auth/verify-email - Verify Email by Code or Link Token
// =====================================================================
import { memoryStore, query } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, code, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({ success: false, error: 'Email address or verification token is required' });
    }

    let user = null;
    if (token) {
      user = memoryStore.users.find((u) => u.verificationToken === token);
    } else if (email) {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // If already verified
    if (user.emailVerified) {
      return res.status(200).json({ success: true, message: 'Email is already verified.' });
    }

    // Verify matching code or token
    const isCodeMatch = code && user.verificationCode === code.toString().trim();
    const isTokenMatch = token && user.verificationToken === token;

    if (!isCodeMatch && !isTokenMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired confirmation code. Please check your email or request a new code.',
      });
    }

    // Mark verified
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationToken = null;

    // Update in PostgreSQL if connected
    await query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);

    return res.status(200).json({
      success: true,
      message: 'Congratulations! Your email address has been verified. Welcome to Kunda Space.',
    });
  } catch (err: any) {
    console.error('Verify email API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify email address' });
  }
}
