/**
 * NutriSnap — Backend Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID ES256)
 * & Persistent Scheduled Reminder Processing Engine.
 *
 * Implements:
 *  - Pure Node.js `node:crypto` VAPID P-256 key generation & ES256 JWT signing (RFC 8292)
 *  - Pure Node.js `node:crypto` Web Push payload encryption (`aes128gcm`, RFC 8291 & RFC 8188)
 *  - Firestore-backed push subscription registry (`push_subscriptions`) with 404/410 expiry cleanup
 *  - Idempotent scheduled reminder queue (`scheduled_reminders`) with diagnostic timestamps & retries
 */

import crypto from 'node:crypto';
import { getAdminDb, type Role } from './security.js';

export interface VapidKeys {
  publicKey: string;  // 65-byte uncompressed P-256 point (base64url)
  privateKey: string; // 32-byte raw P-256 private scalar (base64url)
  subject: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface StoredPushSubscription {
  id: string;
  uid: string;
  role: Role;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  active: boolean;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  lastDeliveredAt?: string;
  lastError?: string;
}

export interface PushNotificationPayload {
  id: string;
  title: string;
  message: string;
  link?: string;
  tag?: string;
  type?: string;
  recipientRole?: Role | 'all';
  recipientId?: string;
  diagnostics?: {
    createdAt: string;
    scheduledFor?: string;
    processingStartedAt: string;
    pushDispatchedAt: string;
    attempt?: number;
  };
}

export interface ScheduledReminderRecord {
  id: string;
  idempotencyKey: string;
  recipientId: string;
  recipientRole: Role;
  title: string;
  message: string;
  link: string;
  type: 'MEAL_REMINDER' | 'HYDRATION_REMINDER' | 'CONSULTATION_REMINDER' | 'CUSTOM_REMINDER';
  mealSlot?: string;
  status: 'pending' | 'processing' | 'retry_scheduled' | 'sent' | 'delivered_no_active_sub' | 'failed' | 'cancelled';
  createdAt: string;
  scheduledFor: string;
  processingStartedAt?: string;
  pushDispatchedAt?: string;
  completedAt?: string;
  deliveryLatencyMs?: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  deliveredSubIds: string[];
  sentCount?: number;
  failedCount?: number;
  expiredRemovedCount?: number;
  lastError?: string;
}

export interface PushDispatchSummary {
  notificationId: string;
  totalSubscriptions: number;
  sentCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  expiredRemovedCount: number;
  deliveredSubIds: string[];
  diagnostics: {
    createdAt: string;
    scheduledFor?: string;
    processingStartedAt: string;
    pushDispatchedAt: string;
    completedAt: string;
    deliveryLatencyMs: number;
  };
  errors: Array<{ subId: string; statusCode?: number; message: string }>;
}

const MAX_REMINDER_RETRIES = 3;
const RETRY_BACKOFF_MS = [15_000, 60_000, 300_000]; // 15s, 1m, 5m

// In-memory fallback stores used alongside Firestore (and in offline unit tests)
const memorySubscriptions = new Map<string, StoredPushSubscription>();
const memoryReminders = new Map<string, ScheduledReminderRecord>();
let cachedVapidKeys: VapidKeys | null = null;

export interface WebPushTransportResponse {
  statusCode: number;
  body?: string;
}

export type WebPushTransport = (
  endpoint: string,
   options: {
    headers: Record<string, string>;
    body: Buffer;
  }
) => Promise<WebPushTransportResponse>;

interface WebPushTestHooks {
  transport?: WebPushTransport;
  useMemoryOnly?: boolean;
}

let webPushHooks: WebPushTestHooks = {};

export function __setWebPushTestHooks(hooks: WebPushTestHooks) {
  webPushHooks = hooks;
}

export function __resetWebPushMemoryForTests() {
  memorySubscriptions.clear();
  memoryReminders.clear();
  cachedVapidKeys = null;
  webPushHooks = {};
}

export function __getMemoryRemindersForTests(): ScheduledReminderRecord[] {
  return Array.from(memoryReminders.values());
}

export function __getMemorySubscriptionsForTests(): StoredPushSubscription[] {
  return Array.from(memorySubscriptions.values());
}

// ─── BASE64URL HELPERS ───────────────────────────────────────────────────────

export function toBase64Url(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function fromBase64Url(str: string): Buffer {
  const clean = str.trim().replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (clean.length % 4)) % 4);
  return Buffer.from(clean + pad, 'base64');
}

// ─── VAPID KEY GENERATION & RFC 8292 ES256 SIGNING ──────────────────────────

export function generateVapidKeys(subject = 'mailto:support@nutrisnap.co.in'): VapidKeys {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: toBase64Url(ecdh.getPublicKey()),
    privateKey: toBase64Url(ecdh.getPrivateKey()),
    subject,
  };
}

export async function getOrCreateVapidKeys(): Promise<VapidKeys> {
  const envPub = process.env.VAPID_PUBLIC_KEY?.trim() || process.env.VITE_VAPID_PUBLIC_KEY?.trim();
  const envPriv = process.env.VAPID_PRIVATE_KEY?.trim();
  const envSub = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@nutrisnap.co.in';

  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv, subject: envSub };
  }

  if (cachedVapidKeys) {
    return cachedVapidKeys;
  }

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const docRef = db.collection('dietician_notes').doc('system_vapid_config');
      const snap = await docRef.get();
      if (snap.exists) {
        const data = snap.data() as any;
        if (data?.publicKey && data?.privateKey) {
          cachedVapidKeys = {
            publicKey: data.publicKey,
            privateKey: data.privateKey,
            subject: data.subject || envSub,
          };
          return cachedVapidKeys;
        }
      }

      const generated = generateVapidKeys(envSub);
      await docRef.set({
        ...generated,
        isSystemConfig: true,
        updatedAt: new Date().toISOString(),
      });
      cachedVapidKeys = generated;
      return generated;
    } catch {
      // Fallback to in-memory generated keys if Firestore is unavailable in test mode
    }
  }

  cachedVapidKeys = generateVapidKeys(envSub);
  return cachedVapidKeys;
}

export function createVapidAuthHeader(
  endpoint: string,
  vapid: VapidKeys,
  expirationEpochSeconds?: number
): { authorization: string; cryptoKey: string; jwt: string } {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const exp = expirationEpochSeconds ?? Math.floor(Date.now() / 1000) + 12 * 3600;

  const pubBytes = fromBase64Url(vapid.publicKey);
  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error('Invalid VAPID public key: expected 65-byte uncompressed P-256 point');
  }

  const x = toBase64Url(pubBytes.subarray(1, 33));
  const y = toBase64Url(pubBytes.subarray(33, 65));
  const d = toBase64Url(fromBase64Url(vapid.privateKey));

  const privateKeyObj = crypto.createPrivateKey({
    key: { kty: 'EC', crv: 'P-256', x, y, d },
    format: 'jwk',
  });

  const headerSegment = toBase64Url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' }), 'utf8'));
  const payloadSegment = toBase64Url(
    Buffer.from(JSON.stringify({ aud, exp, sub: vapid.subject }), 'utf8')
  );
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const signature = crypto.sign('sha256', Buffer.from(signingInput, 'ascii'), {
    key: privateKeyObj,
    dsaEncoding: 'ieee-p1363',
  });

  const jwt = `${signingInput}.${toBase64Url(signature)}`;
  return {
    authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
    cryptoKey: `p256ecdsa=${vapid.publicKey}`,
    jwt,
  };
}

// ─── RFC 8291 (aes128gcm) WEB PUSH PAYLOAD ENCRYPTION ────────────────────────

export function encryptWebPushPayload(
  plaintextUtf8: string,
  subscriberKeys: { p256dh: string; auth: string }
): {
  body: Buffer;
  salt: Buffer;
  serverPublicKey: Buffer;
} {
  const uaPublic = fromBase64Url(subscriberKeys.p256dh);
  const authSecret = fromBase64Url(subscriberKeys.auth);

  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
    throw new Error('Invalid subscriber p256dh key: must be 65-byte uncompressed P-256 public key');
  }
  if (authSecret.length < 16) {
    throw new Error('Invalid subscriber auth secret: must be at least 16 bytes');
  }

  const asEcdh = crypto.createECDH('prime256v1');
  asEcdh.generateKeys();
  const asPublic = asEcdh.getPublicKey();
  const ecdhSecret = asEcdh.computeSecret(uaPublic);

  const salt = crypto.randomBytes(16);

  // RFC 8291 Section 3.3: IKM via HKDF-SHA256(salt=authSecret, ikm=ecdhSecret, info="WebPush: info\0" || uaPublic || asPublic, L=32)
  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'ascii'),
    uaPublic,
    asPublic,
  ]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', ecdhSecret, authSecret, keyInfo, 32));

  // RFC 8188 Section 2.2 & 2.3: CEK (16 bytes) and Nonce (12 bytes)
  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

  // Pad record with final record delimiter 0x02
  const paddedPlaintext = Buffer.concat([
    Buffer.from(plaintextUtf8, 'utf8'),
    Buffer.from([0x02]),
  ]);

  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(paddedPlaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // RFC 8188 Section 2.1 header: salt (16) || rs (4, uint32BE = 4096) || idlen (1 = 65) || keyid (65 = asPublic)
  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(4096, 0);
  const idLenBuf = Buffer.from([asPublic.length]);

  const body = Buffer.concat([salt, rsBuf, idLenBuf, asPublic, encrypted, authTag]);
  return {
    body,
    salt,
    serverPublicKey: asPublic,
  };
}

/**
 * Decrypts an RFC 8291 `aes128gcm` payload given the subscriber's ECDH private key and auth secret.
 * Used in automated verification tests to prove end-to-end cryptographic integrity.
 */
export function decryptWebPushPayload(
  encryptedBody: Buffer,
  subscriberPrivateKey: Buffer,
  subscriberPublicKey: Buffer,
  authSecret: Buffer
): string {
  const salt = encryptedBody.subarray(0, 16);
  const idLen = encryptedBody[20];
  const asPublic = encryptedBody.subarray(21, 21 + idLen);
  const ciphertextAndTag = encryptedBody.subarray(21 + idLen);
  const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.length - 16);
  const authTag = ciphertextAndTag.subarray(ciphertextAndTag.length - 16);

  const uaEcdh = crypto.createECDH('prime256v1');
  uaEcdh.setPrivateKey(subscriberPrivateKey);
  const ecdhSecret = uaEcdh.computeSecret(asPublic);

  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'ascii'),
    subscriberPublicKey,
    asPublic,
  ]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', ecdhSecret, authSecret, keyInfo, 32));

  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

  const decipher = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(authTag);
  const padded = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  // Strip trailing 0x02 delimiter
  const delimiterIndex = padded.lastIndexOf(0x02);
  if (delimiterIndex === -1) {
    throw new Error('Missing RFC 8291 0x02 record delimiter');
  }
  return padded.subarray(0, delimiterIndex).toString('utf8');
}

// ─── PUSH SUBSCRIPTION REGISTRY ─────────────────────────────────────────────

export function computeSubscriptionId(endpoint: string): string {
  return 'sub_' + crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

export async function savePushSubscription(params: {
  uid: string;
  role: Role;
  subscription: PushSubscriptionInput;
  userAgent?: string;
}): Promise<StoredPushSubscription> {
  const { uid, role, subscription, userAgent } = params;
  if (
    !subscription ||
    typeof subscription.endpoint !== 'string' ||
    !subscription.endpoint.startsWith('http') ||
    !subscription.keys ||
    typeof subscription.keys.p256dh !== 'string' ||
    typeof subscription.keys.auth !== 'string'
  ) {
    throw new Error('Invalid Web Push subscription: endpoint, keys.p256dh, and keys.auth are required');
  }

  const subId = computeSubscriptionId(subscription.endpoint);
  const nowIso = new Date().toISOString();

  const record: StoredPushSubscription = {
    id: subId,
    uid,
    role,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    userAgent: userAgent ? String(userAgent).slice(0, 250) : undefined,
    active: true,
    failureCount: 0,
    createdAt: memorySubscriptions.get(subId)?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  memorySubscriptions.set(subId, record);

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      await db.collection('push_subscriptions').doc(subId).set(record, { merge: true });
    } catch (err) {
      console.warn('[WebPush] Firestore push_subscriptions save note:', err);
    }
  }

  return record;
}

export async function removePushSubscription(endpointOrSubId: string, callerUid?: string): Promise<boolean> {
  const subId = endpointOrSubId.startsWith('sub_')
    ? endpointOrSubId
    : computeSubscriptionId(endpointOrSubId);

  const existing = memorySubscriptions.get(subId);
  if (existing && callerUid && existing.uid !== callerUid) {
    return false;
  }
  memorySubscriptions.delete(subId);

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const ref = db.collection('push_subscriptions').doc(subId);
      const snap = await ref.get();
      if (snap.exists) {
        if (callerUid && snap.data()?.uid && snap.data()?.uid !== callerUid) {
          return false;
        }
        await ref.delete();
      }
    } catch (err) {
      console.warn('[WebPush] Firestore push_subscriptions delete note:', err);
    }
  }
  return true;
}

export async function getActiveSubscriptionsForRecipient(params: {
  recipientRole?: Role | 'all';
  recipientId?: string;
}): Promise<StoredPushSubscription[]> {
  const { recipientRole, recipientId } = params;
  const combined = new Map<string, StoredPushSubscription>();

  for (const sub of memorySubscriptions.values()) {
    if (sub.active) combined.set(sub.id, sub);
  }

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const snap = await db.collection('push_subscriptions').where('active', '==', true).get();
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as StoredPushSubscription;
        if (data && data.endpoint && data.keys?.p256dh && data.keys?.auth) {
          combined.set(docSnap.id, { ...data, id: docSnap.id });
        }
      }
    } catch (err) {
      console.warn('[WebPush] Firestore push_subscriptions query note:', err);
    }
  }

  return Array.from(combined.values()).filter((sub) => {
    if (!sub.active) return false;
    if (recipientId) {
      return sub.uid === recipientId;
    }
    if (recipientRole && recipientRole !== 'all') {
      return sub.role === recipientRole;
    }
    return true;
  });
}

// ─── DEFAULT HTTP PUSH TRANSPORT (WITH RETRY FOR TRANSIENT ERRORS) ──────────

const defaultTransport: WebPushTransport = async (endpoint, { headers, body }) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: new Uint8Array(body),
  });
  const text = await res.text().catch(() => '');
  return { statusCode: res.status, body: text };
};

async function sendSingleWebPushWithRetry(
  sub: StoredPushSubscription,
  payloadJson: string,
  vapid: VapidKeys,
  maxTransientRetries = 2
): Promise<{ ok: boolean; statusCode: number; expired: boolean; error?: string }> {
  const transport = webPushHooks.transport || defaultTransport;
  const { body } = encryptWebPushPayload(payloadJson, sub.keys);
  const { authorization, cryptoKey } = createVapidAuthHeader(sub.endpoint, vapid);

  const headers: Record<string, string> = {
    Authorization: authorization,
    'Crypto-Key': cryptoKey,
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    TTL: String(60 * 60 * 24),
    Urgency: 'high',
  };

  let lastStatus = 0;
  let lastError = '';

  for (let attempt = 0; attempt <= maxTransientRetries; attempt++) {
    try {
      const res = await transport(sub.endpoint, { headers, body });
      lastStatus = res.statusCode;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return { ok: true, statusCode: res.statusCode, expired: false };
      }

      // 404 Not Found or 410 Gone => subscription has expired or been revoked by browser
      if (res.statusCode === 404 || res.statusCode === 410) {
        return {
          ok: false,
          statusCode: res.statusCode,
          expired: true,
          error: `Subscription expired (${res.statusCode})`,
        };
      }

      lastError = `Push service responded with HTTP ${res.statusCode}${res.body ? `: ${res.body.slice(0, 120)}` : ''}`;

      // Retry only on transient server/rate-limit errors (429, 500, 502, 503, 504)
      if (![429, 500, 502, 503, 504].includes(res.statusCode)) {
        break;
      }
    } catch (err: any) {
      lastStatus = 0;
      lastError = err?.message || String(err);
    }

    if (attempt < maxTransientRetries) {
      await new Promise((r) => setTimeout(r, 150 * Math.pow(2, attempt)));
    }
  }

  return { ok: false, statusCode: lastStatus, expired: false, error: lastError };
}

// ─── DISPATCH WEB PUSH TO RECIPIENT SUBSCRIPTIONS ────────────────────────────

export async function dispatchWebPushToRecipient(
  payload: PushNotificationPayload,
  options?: { alreadyDeliveredSubIds?: string[]; createdAt?: string; scheduledFor?: string }
): Promise<PushDispatchSummary> {
  const processingStartedAt = new Date().toISOString();
  const createdAt = options?.createdAt || payload.diagnostics?.createdAt || processingStartedAt;
  const scheduledFor = options?.scheduledFor || payload.diagnostics?.scheduledFor;
  const alreadyDelivered = new Set<string>(options?.alreadyDeliveredSubIds || []);

  const vapid = await getOrCreateVapidKeys();
  const subscriptions = await getActiveSubscriptionsForRecipient({
    recipientRole: payload.recipientRole,
    recipientId: payload.recipientId,
  });

  const pushDispatchedAt = new Date().toISOString();
  const fullPayload = {
    id: payload.id,
    title: payload.title || 'NutriSnap Health Alert',
    body: payload.message,
    message: payload.message,
    url: payload.link || (payload.recipientRole === 'dietician' ? '/dietician/inbox' : '/patient/meals'),
    link: payload.link || (payload.recipientRole === 'dietician' ? '/dietician/inbox' : '/patient/meals'),
    tag: payload.tag || payload.id,
    type: payload.type || 'ALERT',
    diagnostics: {
      createdAt,
      scheduledFor,
      processingStartedAt,
      pushDispatchedAt,
    },
  };
  const payloadJson = JSON.stringify(fullPayload);

  let sentCount = 0;
  let skippedDuplicateCount = 0;
  let failedCount = 0;
  let expiredRemovedCount = 0;
  const deliveredSubIds = Array.from(alreadyDelivered);
  const errors: Array<{ subId: string; statusCode?: number; message: string }> = [];

  for (const sub of subscriptions) {
    // Duplicate prevention per subscription
    if (alreadyDelivered.has(sub.id)) {
      skippedDuplicateCount++;
      continue;
    }

    const result = await sendSingleWebPushWithRetry(sub, payloadJson, vapid);
    if (result.ok) {
      sentCount++;
      alreadyDelivered.add(sub.id);
      deliveredSubIds.push(sub.id);
      const nowIso = new Date().toISOString();
      sub.lastDeliveredAt = nowIso;
      sub.failureCount = 0;
      memorySubscriptions.set(sub.id, sub);
      if (!webPushHooks.useMemoryOnly) {
        try {
          await getAdminDb()
            .collection('push_subscriptions')
            .doc(sub.id)
            .set({ lastDeliveredAt: nowIso, failureCount: 0 }, { merge: true });
        } catch {}
      }
    } else if (result.expired) {
      expiredRemovedCount++;
      await removePushSubscription(sub.id);
      errors.push({ subId: sub.id, statusCode: result.statusCode, message: result.error || 'Expired' });
    } else {
      failedCount++;
      sub.failureCount = (sub.failureCount || 0) + 1;
      sub.lastError = result.error;
      memorySubscriptions.set(sub.id, sub);
      errors.push({ subId: sub.id, statusCode: result.statusCode, message: result.error || 'Push failed' });
    }
  }

  const completedAt = new Date().toISOString();
  const referenceMs = scheduledFor
    ? new Date(scheduledFor).getTime()
    : new Date(createdAt).getTime();
  const deliveryLatencyMs = Math.max(0, new Date(completedAt).getTime() - (Number.isFinite(referenceMs) ? referenceMs : Date.now()));

  return {
    notificationId: payload.id,
    totalSubscriptions: subscriptions.length,
    sentCount,
    skippedDuplicateCount,
    failedCount,
    expiredRemovedCount,
    deliveredSubIds,
    diagnostics: {
      createdAt,
      scheduledFor,
      processingStartedAt,
      pushDispatchedAt,
      completedAt,
      deliveryLatencyMs,
    },
    errors,
  };
}

// ─── SCHEDULED REMINDERS QUEUE & PROCESSOR ──────────────────────────────────

export async function scheduleReminder(input: {
  recipientId: string;
  recipientRole: Role;
  title: string;
  message: string;
  link?: string;
  type?: ScheduledReminderRecord['type'];
  mealSlot?: string;
  scheduledFor: string; // ISO string
  idempotencyKey?: string;
}): Promise<{ reminder: ScheduledReminderRecord; deduplicated: boolean }> {
  const scheduledDate = new Date(input.scheduledFor);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error('Invalid scheduledFor timestamp');
  }

  const scheduledIso = scheduledDate.toISOString();
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    `${input.recipientId}_${input.type || 'CUSTOM_REMINDER'}_${input.mealSlot || 'general'}_${scheduledIso.slice(0, 16)}`;

  const reminderId =
    'rem_' + crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 28);

  // Duplicate prevention: check if reminder with same idempotencyKey already exists
  const existingMem = memoryReminders.get(reminderId);
  if (existingMem && existingMem.status !== 'cancelled') {
    return { reminder: existingMem, deduplicated: true };
  }

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const snap = await db.collection('scheduled_reminders').doc(reminderId).get();
      if (snap.exists) {
        const existingData = snap.data() as ScheduledReminderRecord;
        if (existingData.status !== 'cancelled') {
          memoryReminders.set(reminderId, existingData);
          return { reminder: existingData, deduplicated: true };
        }
      }
    } catch {}
  }

  const nowIso = new Date().toISOString();
  const record: ScheduledReminderRecord = {
    id: reminderId,
    idempotencyKey,
    recipientId: input.recipientId,
    recipientRole: input.recipientRole,
    title: input.title.trim(),
    message: input.message.trim(),
    link: input.link || (input.recipientRole === 'dietician' ? '/dietician/inbox' : '/patient/meals'),
    type: input.type || 'MEAL_REMINDER',
    mealSlot: input.mealSlot,
    status: 'pending',
    createdAt: nowIso,
    scheduledFor: scheduledIso,
    retryCount: 0,
    maxRetries: MAX_REMINDER_RETRIES,
    deliveredSubIds: [],
  };

  memoryReminders.set(reminderId, record);

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      await db.collection('scheduled_reminders').doc(reminderId).set(record);
    } catch (err) {
      console.warn('[WebPush] Firestore scheduled_reminders write note:', err);
    }
  }

  return { reminder: record, deduplicated: false };
}

/**
 * Processes all due reminders (`scheduledFor <= nowIso`) across memory and Firestore.
 * Safe to invoke from Vercel Cron, the persistent backend loop in `server.ts`, or manual test triggers.
 */
export async function processDueReminders(nowOverrideIso?: string): Promise<{
  processedCount: number;
  sentCount: number;
  retryScheduledCount: number;
  noActiveSubCount: number;
  failedCount: number;
  results: Array<{
    reminderId: string;
    status: ScheduledReminderRecord['status'];
    sentCount: number;
    expiredRemovedCount: number;
    diagnostics: PushDispatchSummary['diagnostics'];
  }>;
}> {
  const nowIso = nowOverrideIso || new Date().toISOString();
  const nowMs = new Date(nowIso).getTime();

  const candidateMap = new Map<string, ScheduledReminderRecord>();
  for (const r of memoryReminders.values()) {
    if (r.status === 'pending' || r.status === 'retry_scheduled') {
      candidateMap.set(r.id, r);
    }
  }

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const [pendingSnap, retrySnap] = await Promise.all([
        db.collection('scheduled_reminders').where('status', '==', 'pending').get(),
        db.collection('scheduled_reminders').where('status', '==', 'retry_scheduled').get(),
      ]);
      for (const docSnap of [...pendingSnap.docs, ...retrySnap.docs]) {
        const data = docSnap.data() as ScheduledReminderRecord;
        if (data && data.id) {
          candidateMap.set(data.id, data);
        }
      }
    } catch (err) {
      console.warn('[WebPush] Firestore due reminders query note:', err);
    }
  }

  const dueReminders = Array.from(candidateMap.values()).filter((r) => {
    const dueMs = new Date(r.scheduledFor).getTime();
    if (dueMs > nowMs) return false;
    if (r.status === 'retry_scheduled' && r.nextRetryAt) {
      return new Date(r.nextRetryAt).getTime() <= nowMs;
    }
    return true;
  });

  let sentCount = 0;
  let retryScheduledCount = 0;
  let noActiveSubCount = 0;
  let failedCount = 0;
  const results: Array<{
    reminderId: string;
    status: ScheduledReminderRecord['status'];
    sentCount: number;
    expiredRemovedCount: number;
    diagnostics: PushDispatchSummary['diagnostics'];
  }> = [];

  for (const reminder of dueReminders) {
    // Idempotency guard: skip if already marked sent
    if (reminder.status === 'sent' || reminder.status === 'processing') {
      continue;
    }

    reminder.status = 'processing';
    reminder.processingStartedAt = new Date().toISOString();
    memoryReminders.set(reminder.id, reminder);

    const dispatchSummary = await dispatchWebPushToRecipient(
      {
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        link: reminder.link,
        tag: reminder.id,
        type: reminder.type,
        recipientRole: reminder.recipientRole,
        recipientId: reminder.recipientId,
      },
      {
        alreadyDeliveredSubIds: reminder.deliveredSubIds,
        createdAt: reminder.createdAt,
        scheduledFor: reminder.scheduledFor,
      }
    );

    reminder.pushDispatchedAt = dispatchSummary.diagnostics.pushDispatchedAt;
    reminder.completedAt = dispatchSummary.diagnostics.completedAt;
    reminder.deliveryLatencyMs = dispatchSummary.diagnostics.deliveryLatencyMs;
    reminder.deliveredSubIds = dispatchSummary.deliveredSubIds;
    reminder.sentCount = (reminder.sentCount || 0) + dispatchSummary.sentCount;
    reminder.failedCount = dispatchSummary.failedCount;
    reminder.expiredRemovedCount =
      (reminder.expiredRemovedCount || 0) + dispatchSummary.expiredRemovedCount;

    if (dispatchSummary.sentCount > 0 || reminder.deliveredSubIds.length > 0) {
      reminder.status = 'sent';
      sentCount++;
    } else if (dispatchSummary.totalSubscriptions === 0 || dispatchSummary.failedCount === 0) {
      // No active push subscriptions remaining (or all were expired 410 and cleaned up)
      reminder.status = 'delivered_no_active_sub';
      noActiveSubCount++;
    } else {
      // Transient delivery failure: schedule exponential backoff retry up to maxRetries
      reminder.retryCount = (reminder.retryCount || 0) + 1;
      reminder.lastError = dispatchSummary.errors[0]?.message || 'Push delivery failed';
      if (reminder.retryCount <= (reminder.maxRetries || MAX_REMINDER_RETRIES)) {
        reminder.status = 'retry_scheduled';
        const backoff = RETRY_BACKOFF_MS[Math.min(reminder.retryCount - 1, RETRY_BACKOFF_MS.length - 1)];
        reminder.nextRetryAt = new Date(Date.now() + backoff).toISOString();
        retryScheduledCount++;
      } else {
        reminder.status = 'failed';
        failedCount++;
      }
    }

    memoryReminders.set(reminder.id, reminder);

    // Persist reminder state and write in-app notification record (flagged with pushDispatched: true)
    if (!webPushHooks.useMemoryOnly) {
      try {
        const db = getAdminDb();
        await db.collection('scheduled_reminders').doc(reminder.id).set(reminder, { merge: true });

        if (reminder.status === 'sent' || reminder.status === 'delivered_no_active_sub') {
          const notifDoc = {
            id: reminder.id,
            recipientRole: reminder.recipientRole,
            recipientId: reminder.recipientId,
            patientId: reminder.recipientRole === 'patient' ? reminder.recipientId : undefined,
            type: 'SYSTEM',
            title: reminder.title,
            message: reminder.message,
            link: reminder.link,
            read: false,
            isNotification: true,
            pushDispatched: reminder.status === 'sent',
            diagnostics: dispatchSummary.diagnostics,
            createdAt: reminder.scheduledFor,
          };
          await db.collection('notifications').doc(reminder.id).set(notifDoc, { merge: true });
          await db.collection('dietician_notes').doc(reminder.id).set(notifDoc, { merge: true });
        }
      } catch (err) {
        console.warn('[WebPush] Firestore reminder completion write note:', err);
      }
    }

    results.push({
      reminderId: reminder.id,
      status: reminder.status,
      sentCount: dispatchSummary.sentCount,
      expiredRemovedCount: dispatchSummary.expiredRemovedCount,
      diagnostics: dispatchSummary.diagnostics,
    });
  }

  return {
    processedCount: results.length,
    sentCount,
    retryScheduledCount,
    noActiveSubCount,
    failedCount,
    results,
  };
}

export async function listRemindersForRecipient(params: {
  recipientId: string;
  isDietician?: boolean;
}): Promise<ScheduledReminderRecord[]> {
  const { recipientId, isDietician } = params;
  const combined = new Map<string, ScheduledReminderRecord>();

  for (const r of memoryReminders.values()) {
    if (isDietician || r.recipientId === recipientId) {
      combined.set(r.id, r);
    }
  }

  if (!webPushHooks.useMemoryOnly) {
    try {
      const db = getAdminDb();
      const query = isDietician
        ? db.collection('scheduled_reminders').limit(100)
        : db.collection('scheduled_reminders').where('recipientId', '==', recipientId).limit(50);
      const snap = await query.get();
      for (const docSnap of snap.docs) {
        const data = docSnap.data() as ScheduledReminderRecord;
        if (data && data.id) {
          combined.set(data.id, data);
        }
      }
    } catch (err) {
      console.warn('[WebPush] listRemindersForRecipient query note:', err);
    }
  }

  return Array.from(combined.values()).sort(
    (a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
  );
}

export async function cancelReminder(
  reminderId: string,
  callerUid: string,
  callerRole: Role
): Promise<{ cancelled: boolean; record?: ScheduledReminderRecord }> {
  let existing = memoryReminders.get(reminderId);

  if (!existing && !webPushHooks.useMemoryOnly) {
    try {
      const snap = await getAdminDb().collection('scheduled_reminders').doc(reminderId).get();
      if (snap.exists) {
        existing = snap.data() as ScheduledReminderRecord;
      }
    } catch {}
  }

  if (!existing) {
    return { cancelled: false };
  }
  if (callerRole !== 'dietician' && existing.recipientId !== callerUid) {
    return { cancelled: false };
  }

  existing.status = 'cancelled';
  existing.completedAt = new Date().toISOString();
  memoryReminders.set(reminderId, existing);

  if (!webPushHooks.useMemoryOnly) {
    try {
      await getAdminDb()
        .collection('scheduled_reminders')
        .doc(reminderId)
        .set({ status: 'cancelled', completedAt: existing.completedAt }, { merge: true });
    } catch {}
  }

  return { cancelled: true, record: existing };
}

export async function ensureDailyMealRemindersForPatient(params: {
  uid: string;
  timezoneOffsetMinutes?: number;
  nowOverrideIso?: string;
}): Promise<{ scheduled: ScheduledReminderRecord[]; deduplicatedCount: number }> {
  const { uid } = params;
  // Default to IST (UTC+5:30 => getTimezoneOffset() is -330) if not provided
  const tzOffsetMin =
    typeof params.timezoneOffsetMinutes === 'number' && Number.isFinite(params.timezoneOffsetMinutes)
      ? params.timezoneOffsetMinutes
      : -330;

  const nowUtcMs = params.nowOverrideIso ? new Date(params.nowOverrideIso).getTime() : Date.now();
  // Local wall-clock time represented in UTC fields: localMs = utcMs - tzOffsetMin * 60_000
  const localNow = new Date(nowUtcMs - tzOffsetMin * 60_000);
  const year = localNow.getUTCFullYear();
  const month = localNow.getUTCMonth();
  const day = localNow.getUTCDate();

  const slots: Array<{
    slot: string;
    hour: number;
    minute: number;
    title: string;
    message: string;
    type: ScheduledReminderRecord['type'];
  }> = [
    {
      slot: 'breakfast',
      hour: 8,
      minute: 30,
      title: 'Breakfast Reminder',
      message: 'Time to log your breakfast and stay on track with your daily nutrition plan.',
      type: 'MEAL_REMINDER',
    },
    {
      slot: 'lunch',
      hour: 13,
      minute: 0,
      title: 'Lunch Reminder',
      message: 'Remember to log your lunch meal and check your macro targets in NutriSnap.',
      type: 'MEAL_REMINDER',
    },
    {
      slot: 'hydration',
      hour: 16,
      minute: 30,
      title: 'Hydration & Evening Check-In',
      message: 'Take a moment to log your water intake and afternoon snack.',
      type: 'HYDRATION_REMINDER',
    },
    {
      slot: 'dinner',
      hour: 20,
      minute: 0,
      title: 'Dinner Reminder',
      message: 'Time to log your dinner and complete today’s nutrition tracking.',
      type: 'MEAL_REMINDER',
    },
  ];

  const scheduled: ScheduledReminderRecord[] = [];
  let deduplicatedCount = 0;

  for (const s of slots) {
    let slotLocalUtcMs = Date.UTC(year, month, day, s.hour, s.minute, 0, 0);
    let targetUtcMs = slotLocalUtcMs + tzOffsetMin * 60_000;

    // If this slot already passed today, schedule it for tomorrow's slot
    if (targetUtcMs <= nowUtcMs + 30_000) {
      slotLocalUtcMs += 24 * 60 * 60_000;
      targetUtcMs += 24 * 60 * 60_000;
    }

    const targetLocalDateStr = new Date(slotLocalUtcMs).toISOString().slice(0, 10);
    const idempotencyKey = `${uid}_${s.type}_${s.slot}_${targetLocalDateStr}`;

    const res = await scheduleReminder({
      recipientId: uid,
      recipientRole: 'patient',
      title: s.title,
      message: s.message,
      link: '/patient/meals',
      type: s.type,
      mealSlot: s.slot,
      scheduledFor: new Date(targetUtcMs).toISOString(),
      idempotencyKey,
    });

    scheduled.push(res.reminder);
    if (res.deduplicated) deduplicatedCount++;
  }

  return { scheduled, deduplicatedCount };
}

