import { guard, parseBody } from '../_lib/security.js';
import {
  savePushSubscription,
  removePushSubscription,
  ensureDailyMealRemindersForPatient,
} from '../_lib/webPush.js';

export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, {
    methods: ['POST', 'DELETE'],
  });
  if (!caller) return;

  try {
    const body = parseBody(req);
    if (req.method === 'DELETE') {
      const endpointOrId =
        typeof body?.endpoint === 'string'
          ? body.endpoint
          : typeof body?.subId === 'string'
          ? body.subId
          : '';
      if (!endpointOrId) {
        res.status(400).json({ error: 'endpoint or subId is required' });
        return;
      }
      const removed = await removePushSubscription(endpointOrId, caller.uid);
      res.status(200).json({ ok: true, removed });
      return;
    }

    const rawSub = body?.subscription || body;
    if (
      !rawSub ||
      typeof rawSub.endpoint !== 'string' ||
      !rawSub.keys ||
      typeof rawSub.keys.p256dh !== 'string' ||
      typeof rawSub.keys.auth !== 'string'
    ) {
      res.status(400).json({
        error: 'Valid Web Push subscription with endpoint, keys.p256dh, and keys.auth is required',
      });
      return;
    }

    const stored = await savePushSubscription({
      uid: caller.uid,
      role: caller.role,
      subscription: {
        endpoint: rawSub.endpoint,
        expirationTime: rawSub.expirationTime ?? null,
        keys: {
          p256dh: rawSub.keys.p256dh,
          auth: rawSub.keys.auth,
        },
      },
      userAgent:
        typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    });

    // Automatically ensure upcoming daily meal reminders are scheduled for patients
    let dailyRemindersScheduled = 0;
    if (caller.role === 'patient') {
      const tzOffset =
        typeof body?.timezoneOffsetMinutes === 'number'
          ? body.timezoneOffsetMinutes
          : undefined;
      const ensured = await ensureDailyMealRemindersForPatient({
        uid: caller.uid,
        timezoneOffsetMinutes: tzOffset,
      });
      dailyRemindersScheduled = ensured.scheduled.length;
    }

    res.status(200).json({
      ok: true,
      subscriptionId: stored.id,
      role: stored.role,
      updatedAt: stored.updatedAt,
      dailyRemindersScheduled,
    });
  } catch (err: any) {
    console.error('[api/notifications/subscribe] Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to save push subscription.' });
  }
}
