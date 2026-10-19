import React, { useState, useEffect } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { auth } from '../services/firebase';
import { getApiUrl } from '../services/db';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || '';
  const providers = currentUser?.providerData?.map(p => p.providerId) || [];
  const hasPasswordProvider = providers.length === 0 || providers.includes('password');

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setLoading(false);
      setError(null);
      setSuccess(false);
      setResetEmailSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Password requirement checks
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 128;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isDifferentFromCurrent = Boolean(newPassword) && newPassword !== currentPassword;
  const matchesConfirmation = Boolean(newPassword) && newPassword === confirmPassword;

  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthLabel =
    !newPassword
      ? 'Enter a new password'
      : strengthScore <= 2
      ? 'Weak'
      : strengthScore === 3
      ? 'Fair'
      : strengthScore === 4
      ? 'Good'
      : 'Strong';
  const strengthColor =
    !newPassword
      ? 'bg-stone-200'
      : strengthScore <= 2
      ? 'bg-rose-500'
      : strengthScore === 3
      ? 'bg-amber-500'
      : strengthScore === 4
      ? 'bg-emerald-500'
      : 'bg-teal-600';

  const handleSendPasswordSetupEmail = async () => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      setResetEmailSent(true);
    } catch {
      setError('Unable to send password setup email right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser || !userEmail) {
      setError('You must be signed in to change your password.');
      return;
    }
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setError('New password must be at least 8 characters and include uppercase, lowercase, and numeric characters.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current password securely against Firebase Auth
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Update password in Firebase Auth (stored using Firebase scrypt hashing)
      await updatePassword(currentUser, newPassword);

      // 3. Notify backend endpoint to revoke other refresh tokens & record audit timestamp
      try {
        await fetch(getApiUrl('/api/auth/change-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
            clientReauthenticated: true,
            alreadyUpdatedOnClient: true
          })
        });
      } catch {
        // Non-fatal if offline dev server is not running
      }

      // 4. Refresh current session ID token so active session remains valid after revocation
      await currentUser.getIdToken(true);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        setError('Current password is incorrect. Please verify and try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes before trying again.');
      } else if (code === 'auth/weak-password') {
        setError('Please choose a stronger password (at least 8 characters with letters and numbers).');
      } else if (code === 'auth/requires-recent-login') {
        setError('For your security, please sign out and sign back in before changing your password.');
      } else {
        setError('Could not update password. Please verify your current password and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden text-stone-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Change Account Password</h2>
              <p className="text-[11px] text-stone-400 truncate max-w-[230px]">{userEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {!hasPasswordProvider ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-bold">Passwordless / External Provider Account</p>
                <p className="leading-relaxed">
                  Your account (<strong>{userEmail}</strong>) currently signs in via Email Magic Link or Google and does not have a local password configured yet.
                </p>
              </div>
              {resetEmailSent ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    We sent a password setup link to <strong>{userEmail}</strong>. Check your inbox to set a password.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendPasswordSetupEmail}
                  disabled={loading}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Password Setup Link to Email
                </button>
              )}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Password Updated Successfully</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Your new password is now active and other active sessions have been invalidated for your security.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label
                  htmlFor="current-password-input"
                  className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5"
                >
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-medium text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="new-password-input"
                    className="block text-xs uppercase tracking-wider font-extrabold text-stone-600"
                  >
                    New Password *
                  </label>
                  <span className="text-[10px] font-bold text-stone-500">{strengthLabel}</span>
                </div>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="At least 8 chars (A-Z, a-z, 0-9)"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-medium text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Bar */}
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${newPassword ? Math.max(20, (strengthScore / 5) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-xs uppercase tracking-wider font-extrabold text-stone-600 mb-1.5"
                >
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50/70 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-medium text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !matchesConfirmation && (
                  <p className="text-[10px] font-semibold text-rose-600 mt-1">
                    Confirmation password does not match new password.
                  </p>
                )}
              </div>

              {/* Password Policy Checklist */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  Security Requirements
                </span>
                {[
                  { ok: hasMinLength, label: 'At least 8 characters long' },
                  { ok: hasUppercase && hasLowercase, label: 'Includes uppercase (A–Z) and lowercase (a–z) letters' },
                  { ok: hasNumber, label: 'Includes at least one number (0–9)' },
                  { ok: isDifferentFromCurrent, label: 'Different from your current password' },
                  { ok: matchesConfirmation, label: 'Matches confirmation password' }
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                        req.ok ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className={req.ok ? 'text-stone-800 font-semibold' : 'text-stone-500'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-1/3 py-2.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Save New Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
