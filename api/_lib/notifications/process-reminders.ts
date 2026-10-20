import crypto from 'node:crypto';
import { applyCors, guard } from '../security.js';
import { processDueReminders } from '../webPush.js';

function isAuthorizedCronRequest(req: any): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const authHeader = req?.headers?.authorization ?? req?.headers?.Authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length !== cronSecret.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'utf8'), Buffer.from(cronSecret, 'utf8'));
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res, ['GET', 'POST'])) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Authorize either via CRON_SECRET (Vercel Cron / external scheduler) or Firebase ID token
  const cronAuthorized = isAuthorizedCronRequest(req);
  if (!cronAuthorized) {
    const caller = await guard(req, res, { methods: ['GET', 'POST'] });
    if (!caller) return;
  }

  try {
    const triggeredAt = new Date().toISOString();
    const summary = await processDueReminders();
    res.status(200).json({
      ok: true,
      triggeredAt,
      authMode: cronAuthorized ? 'cron_secret' : 'firebase_auth',
      ...summary,
    });
  } catch (err: any) {
    console.error('[api/notifications/process-reminders] Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to process due reminders.' });
  }
}
