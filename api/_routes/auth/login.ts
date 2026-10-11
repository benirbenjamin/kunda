// =====================================================================
// POST /api/auth/login - Secure login endpoint
// =====================================================================
import { comparePassword, generateToken } from '../../_lib/auth';
import { memoryStore, query } from '../../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    // Lookup user in DB or memoryStore
    let user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const dbRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        user = dbRes.rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Please verify your email and password.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: `Account suspended. Reason: ${user.suspensionReason || 'Violation of community safety policies'}. Contact support@kunda.space`,
      });
    }

    const isValid = await comparePassword(password, user.passwordHash || user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Please verify your email and password.' });
    }

    // Lookup associated profile
    let profile = memoryStore.profiles.find((p) => p.userId === user.id);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage || user.preferred_language,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage || user.preferred_language,
      },
      profile: profile || null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'An unexpected error occurred during login.' });
  }
}
