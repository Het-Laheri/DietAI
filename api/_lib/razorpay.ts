import https from 'https';
import crypto from 'crypto';
import { requireEnv } from './security.js';

export function razorpayKeys() {
  return {
    keyId: requireEnv('RAZORPAY_KEY_ID'),
    keySecret: requireEnv('RAZORPAY_KEY_SECRET'),
  };
}

type RazorpayRequestFn = (method: 'GET' | 'POST', path: string, body?: unknown) => Promise<{ statusCode: number; data: any }>;
let requestOverride: RazorpayRequestFn | null = null;
/** Test-only: intercept Razorpay API calls. */
export function __setRazorpayRequestForTests(fn: RazorpayRequestFn | null) {
  requestOverride = fn;
}

export function razorpayRequest(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ statusCode: number; data: any }> {
  if (requestOverride) return requestOverride(method, path, body);
  const { keyId, keySecret } = razorpayKeys();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const payload = body === undefined ? '' : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        port: 443,
        path,
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode || 500, data: JSON.parse(raw) });
          } catch {
            resolve({ statusCode: res.statusCode || 500, data: null });
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Razorpay request timed out')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Constant-time check of Razorpay's checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function isValidCheckoutSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  if (![orderId, paymentId, signature].every(v => typeof v === 'string' && v.length > 0 && v.length < 200)) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf-8');
  const b = Buffer.from(signature, 'utf-8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
