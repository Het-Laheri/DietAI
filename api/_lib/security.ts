// Shared server-side security helpers for Vercel functions (and server.ts).
// Files under api/_lib are not exposed as routes by Vercel (leading underscore).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT_JSON  full service-account JSON (or FIREBASE_SERVICE_ACCOUNT_BASE64)
// Optional:
//   FIRESTORE_DATABASE_ID          defaults to the app's named database
//   ALLOWED_ORIGINS                comma-separated list of browser origins allowed by CORS
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export type Role = 'dietician' | 'patient';
export interface Caller {
  uid: string;
  role: Role;
  email?: string;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const DEFAULT_DATABASE_ID = 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf';
const DEFAULT_ALLOWED_ORIGINS = ['https://www.nutrisnap.co.in', 'https://nutrisnap.co.in'];
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

// ── Test hooks (used only by the test suite; never set in production) ──────────
interface TestHooks {
  verifyIdToken?: (token: string) => Promise<{ uid: string; email?: string }>;
  getRole?: (uid: string) => Promise<Role | null>;
  verifyCurrentPassword?: (email: string, currentPassword: string) => Promise<boolean>;
  updatePasswordAndRevoke?: (uid: string, newPassword: string) => Promise<void>;
  recordPasswordUpdate?: (uid: string, iso: string) => Promise<void>;
  isUserSubscribedOrVip?: (uid: string) => Promise<boolean>;
}
let testHooks: TestHooks = {};
export function __setSecurityTestHooks(hooks: TestHooks) {
  testHooks = hooks;
}
export function __getSecurityTestHooks(): TestHooks {
  return testHooks;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new HttpError(500, `Server misconfigured: ${name} is not set`);
  }
  return value;
}

function loadServiceAccount(): Record<string, any> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      : '');
  if (!raw) {
    throw new HttpError(500, 'Server misconfigured: FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(500, 'Server misconfigured: service account JSON is invalid');
  }
}

let adminApp: App | null = null;
export function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps().find(a => a.name === 'nutrisnap-admin');
  if (existing) {
    adminApp = existing;
    return adminApp;
  }
  const sa = loadServiceAccount();
  adminApp = initializeApp({ credential: cert(sa as any), projectId: sa.project_id }, 'nutrisnap-admin');
  return adminApp;
}

let adminDb: Firestore | null = null;
/** Test-only: replace the Admin Firestore with an in-memory fake. */
export function __setAdminDbForTests(db: unknown) {
  adminDb = db as Firestore;
}
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp(), process.env.FIRESTORE_DATABASE_ID || DEFAULT_DATABASE_ID);
  return adminDb;
}

function headerValue(req: any, name: string): string {
  const v = req?.headers?.[name] ?? req?.headers?.[name.toLowerCase()];
  return Array.isArray(v) ? String(v[0] || '') : String(v || '');
}

export function allowedOrigins(): string[] {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const base = configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
  return process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' ? base : [...base, ...DEV_ORIGINS];
}

/**
 * Applies a restrictive CORS policy. Same-origin requests need no CORS headers;
 * cross-origin browsers are only allowed from the app's own origins.
 * Returns true when the request was a preflight that has been answered.
 */
export function applyCors(req: any, res: any, methods: string[]): boolean {
  const origin = headerValue(req, 'origin');
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(origin && allowedOrigins().includes(origin) ? 204 : 403).end();
    return true;
  }
  return false;
}

async function lookupRole(uid: string): Promise<Role | null> {
  if (testHooks.getRole) return testHooks.getRole(uid);
  const snap = await getAdminDb().collection('users').doc(uid).get();
  const role = snap.exists ? snap.get('role') : null;
  return role === 'dietician' || role === 'patient' ? role : null;
}

/** Verifies the Firebase ID token in the Authorization header and resolves the caller's role. */
export async function getCaller(req: any): Promise<Caller> {
  const header = headerValue(req, 'authorization');
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, 'Authentication required');
  let decoded: { uid: string; email?: string };
  try {
    decoded = testHooks.verifyIdToken
      ? await testHooks.verifyIdToken(match[1])
      : await getAuth(getAdminApp()).verifyIdToken(match[1]);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, 'Invalid or expired session');
  }
  const role = await lookupRole(decoded.uid);
  if (!role) throw new HttpError(403, 'Account has no role assigned');
  return { uid: decoded.uid, role, email: decoded.email };
}

export function parseBody(req: any): any {
  let body = req?.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString('utf-8')); } catch { body = {}; }
  }
  return body && typeof body === 'object' ? body : {};
}

/** Sends a JSON error without leaking internals. */
export function sendError(res: any, err: unknown) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[api] unexpected error:', err instanceof Error ? err.message : err);
  return res.status(500).json({ error: 'Internal server error' });
}

/**
 * Standard guard for a handler: CORS, method check, authentication and role check.
 * Returns the caller, or null if a response has already been sent.
 */
export async function guard(
  req: any,
  res: any,
  opts: { methods: string[]; roles?: Role[] }
): Promise<Caller | null> {
  if (applyCors(req, res, opts.methods)) return null;
  if (!opts.methods.includes(req.method)) {
    res.status(405).json({ error: `Method not allowed. Use ${opts.methods.join(' or ')}.` });
    return null;
  }
  try {
    const caller = await getCaller(req);
    if (opts.roles && !opts.roles.includes(caller.role)) {
      throw new HttpError(403, 'Not allowed for this account');
    }
    return caller;
  } catch (err) {
    sendError(res, err);
    return null;
  }
}

/** A patient may only act on their own records; a dietician may act on any patient. */
export function assertCanAccessPatient(caller: Caller, patientId: string | undefined | null) {
  if (!patientId || typeof patientId !== 'string') throw new HttpError(400, 'patientId is required');
  if (caller.role === 'dietician') return;
  if (caller.uid !== patientId) throw new HttpError(403, 'Not allowed to access another patient');
}

/** Evaluates whether a Firestore user/profile document has active VIP or subscription entitlement. */
export function isDataSubscribedOrVip(data: Record<string, any> | undefined | null): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.isVip === true || data.isTestPatient === true) return true;
  const sub = data.subscription;
  if (sub && typeof sub === 'object' && sub.status === 'active') {
    if (!sub.endDate) return true;
    const endMs = new Date(sub.endDate).getTime();
    if (!Number.isNaN(endMs) && endMs >= Date.now()) return true;
  }
  return false;
}

/**
 * Server-side entitlement check for premium/VIP endpoints.
 * Dieticians are always permitted; patients must have an active subscription or VIP flag in Firestore.
 */
export async function assertSubscribedOrVip(caller: Caller): Promise<void> {
  if (caller.role === 'dietician') return;
  if (testHooks.isUserSubscribedOrVip) {
    const allowed = await testHooks.isUserSubscribedOrVip(caller.uid);
    if (allowed) return;
    throw new HttpError(403, 'Active VIP subscription required for this feature');
  }
  const db = getAdminDb();
  const [userSnap, profileSnap] = await Promise.all([
    db.collection('users').doc(caller.uid).get(),
    db.collection('patient_profiles').doc(caller.uid).get(),
  ]);
  const userData = userSnap.exists ? (userSnap.data() as Record<string, any>) : null;
  const profileData = profileSnap.exists ? (profileSnap.data() as Record<string, any>) : null;
  if (isDataSubscribedOrVip(userData) || isDataSubscribedOrVip(profileData)) {
    return;
  }
  throw new HttpError(403, 'Active VIP subscription required for this feature');
}

