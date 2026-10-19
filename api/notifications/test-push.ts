import { guard, parseBody, type Role } from '../_lib/security.js';
import { dispatchWebPushToRecipient, scheduleReminder } from '../_lib/webPush.js';

export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, {
    methods: ['POST'],
  });
  if (!caller) return;

  try {
    const body = parseBody(req);
    const title =
      typeof body?.title === 'string' && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : 'NutriSnap Diagnostic Push';
    const message =
      typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim().slice(0, 500)
        : 'Background Web Push verified via RFC 8291 (aes128gcm) + VAPID ES256.';
    const link =
      typeof body?.link === 'string' && body.link.startsWith('/')
        ? body.link
        : caller.role === 'dietician'
        ? '/dietician/inbox'
        : '/patient/meals';

    const delaySeconds =
      typeof body?.delaySeconds === 'number' && Number.isFinite(body.delaySeconds)
        ? Math.max(0, Math.min(3600, body.delaySeconds))
        : 0;

    // Determine authorized target recipient
    let recipientId: string | undefined = caller.uid;
    let recipientRole: Role | 'all' = caller.role;

    if (caller.role === 'dietician') {
      if (typeof body?.recipientId === 'string' && body.recipientId.trim()) {
        recipientId = body.recipientId.trim();
        recipientRole = body?.recipientRole === 'dietician' ? 'dietician' : 'patient';
      } else if (body?.recipientRole === 'patient') {
        recipientId = undefined;
        recipientRole = 'patient';
      }
    } else {
      // A patient can send a test push to themselves OR notify the dietician of a patient event
      if (body?.recipientRole === 'dietician') {
        recipientId = undefined;
        recipientRole = 'dietician';
      } else {
        recipientId = caller.uid;
        recipientRole = 'patient';
      }
    }

    if (delaySeconds > 0) {
      const scheduledFor = new Date(Date.now() + delaySeconds * 1000).toISOString();
      const scheduled = await scheduleReminder({
        recipientId: recipientId || caller.uid,
        recipientRole: recipientRole === 'dietician' ? 'dietician' : 'patient',
        title,
        message,
        link,
        type: 'CUSTOM_REMINDER',
        scheduledFor,
        idempotencyKey: `test_push_${caller.uid}_${Date.now()}`,
      });

      res.status(200).json({
        ok: true,
        mode: 'scheduled',
        delaySeconds,
        reminder: scheduled.reminder,
      });
      return;
    }

    const notificationId =
      typeof body?.id === 'string' && body.id.trim()
        ? body.id.trim()
        : `push_${Date.now()}_${caller.uid.slice(0, 6)}`;

    const summary = await dispatchWebPushToRecipient({
      id: notificationId,
      title,
      message,
      link,
      tag: notificationId,
      type: typeof body?.type === 'string' ? body.type : 'TEST_PUSH',
      recipientRole,
      recipientId,
    });

    res.status(200).json({
      ok: true,
      mode: 'immediate',
      ...summary,
    });
  } catch (err: any) {
    console.error('[api/notifications/test-push] Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to dispatch Web Push.' });
  }
}
