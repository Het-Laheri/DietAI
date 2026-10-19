import { getAuth } from 'firebase-admin/auth';
import {
  guard,
  parseBody,
  sendError,
  HttpError,
  getAdminApp,
  getAdminDb,
  __getSecurityTestHooks
} from '../_lib/security.js';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const attemptBuckets = new Map<string, { count: number; resetAt: number }>();

export function __resetChangePasswordRateLimitForTests() {
  attemptBuckets.clear();
}

function checkRateLimit(key: string): void {
  const now = Date.now();
  const bucket = attemptBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    attemptBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (bucket.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many password change attempts. Please wait 15 minutes and try again.');
  }
  bucket.count += 1;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePasswordChangeInput(input: {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
}): PasswordValidationResult {
  const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : '';
  const newPassword = typeof input.newPassword === 'string' ? input.newPassword : '';
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : '';

  if (!currentPassword) {
    return { valid: false, error: 'Current password is required.' };
  }
  if (!newPassword) {
    return { valid: false, error: 'New password is required.' };
  }
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your new password.' };
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'New password and confirmation do not match.' };
  }
  if (newPassword === currentPassword) {
    return { valid: false, error: 'New password must be different from your current password.' };
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return { valid: false, error: 'New password must be between 8 and 128 characters long.' };
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return {
      valid: false,
      error: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.'
    };
  }
  return { valid: true };
}

export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'] });
  if (!caller) return;

  try {
    checkRateLimit(`uid:${caller.uid}`);

    const body = parseBody(req);
    const validation = validatePasswordChangeInput({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword
    });

    if (!validation.valid) {
      throw new HttpError(400, validation.error || 'Invalid password input.');
    }

    const currentPassword = String(body.currentPassword);
    const newPassword = String(body.newPassword);
    const hooks = __getSecurityTestHooks();

    // 1. Verify current password on the server
    if (hooks.verifyCurrentPassword) {
      const ok = await hooks.verifyCurrentPassword(caller.email || '', currentPassword);
      if (!ok) {
        throw new HttpError(401, 'Current password is incorrect.');
      }
    } else if (process.env.FIREBASE_WEB_API_KEY) {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: caller.email,
            password: currentPassword,
            returnSecureToken: false
          })
        }
      );
      if (!verifyRes.ok) {
        throw new HttpError(401, 'Current password is incorrect.');
      }
    } else if (!body.clientReauthenticated) {
      throw new HttpError(401, 'Current password verification is required.');
    }

    // 2. Update password in Firebase Auth (hashed with Firebase scrypt) & revoke old refresh tokens
    if (hooks.updatePasswordAndRevoke) {
      await hooks.updatePasswordAndRevoke(caller.uid, newPassword);
    } else if (!body.alreadyUpdatedOnClient) {
      const adminAuth = getAuth(getAdminApp());
      await adminAuth.updateUser(caller.uid, { password: newPassword });
      await adminAuth.revokeRefreshTokens(caller.uid);
    } else {
      const adminAuth = getAuth(getAdminApp());
      await adminAuth.revokeRefreshTokens(caller.uid);
    }

    // 3. Record password update metadata (never store any password)
    const nowIso = new Date().toISOString();
    if (hooks.recordPasswordUpdate) {
      await hooks.recordPasswordUpdate(caller.uid, nowIso);
    } else {
      await getAdminDb()
        .collection('users')
        .doc(caller.uid)
        .set({ passwordUpdatedAt: nowIso }, { merge: true });
    }

    return res.status(200).json({
      success: true,
      passwordUpdatedAt: nowIso,
      sessionsRevoked: true
    });
  } catch (err) {
    return sendError(res, err);
  }
}
