import { guard, parseBody } from '../security.js';
import {
  scheduleReminder,
  listRemindersForRecipient,
  cancelReminder,
  ensureDailyMealRemindersForPatient,
  type ScheduledReminderRecord,
} from '../webPush.js';

export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, {
    methods: ['GET', 'POST', 'DELETE'],
  });
  if (!caller) return;

  try {
    if (req.method === 'GET') {
      const reminders = await listRemindersForRecipient({
        recipientId: caller.uid,
        isDietician: caller.role === 'dietician',
      });
      res.status(200).json({ ok: true, reminders });
      return;
    }

    const body = parseBody(req);

    if (req.method === 'DELETE') {
      const reminderId =
        typeof body?.reminderId === 'string'
          ? body.reminderId
          : typeof req.query?.reminderId === 'string'
          ? req.query.reminderId
          : '';
      if (!reminderId) {
        res.status(400).json({ error: 'reminderId is required' });
        return;
      }
      const result = await cancelReminder(reminderId, caller.uid, caller.role);
      if (!result.cancelled) {
        res.status(404).json({ error: 'Reminder not found or unauthorized' });
        return;
      }
      res.status(200).json({ ok: true, reminder: result.record });
      return;
    }

    // POST
    const action = body?.action;
    if (action === 'ensure-daily-meal-reminders') {
      const targetUid =
        caller.role === 'dietician' && typeof body?.recipientId === 'string'
          ? body.recipientId
          : caller.uid;
      const tzOffset =
        typeof body?.timezoneOffsetMinutes === 'number'
          ? body.timezoneOffsetMinutes
          : undefined;

      const ensured = await ensureDailyMealRemindersForPatient({
        uid: targetUid,
        timezoneOffsetMinutes: tzOffset,
      });
      res.status(200).json({
        ok: true,
        scheduledCount: ensured.scheduled.length,
        deduplicatedCount: ensured.deduplicatedCount,
        reminders: ensured.scheduled,
      });
      return;
    }

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const scheduledFor = typeof body?.scheduledFor === 'string' ? body.scheduledFor.trim() : '';
    const delaySeconds =
      typeof body?.delaySeconds === 'number' && Number.isFinite(body.delaySeconds)
        ? Math.max(0, Math.min(86400 * 7, body.delaySeconds))
        : null;

    if (!title || !message) {
      res.status(400).json({ error: 'title and message are required' });
      return;
    }

    const effectiveScheduledFor =
      scheduledFor ||
      (delaySeconds !== null
        ? new Date(Date.now() + delaySeconds * 1000).toISOString()
        : new Date().toISOString());

    const recipientId =
      caller.role === 'dietician' && typeof body?.recipientId === 'string'
        ? body.recipientId
        : caller.uid;
    const recipientRole =
      caller.role === 'dietician' && body?.recipientRole === 'patient'
        ? 'patient'
        : caller.role;

    const allowedTypes: ScheduledReminderRecord['type'][] = [
      'MEAL_REMINDER',
      'HYDRATION_REMINDER',
      'CONSULTATION_REMINDER',
      'CUSTOM_REMINDER',
    ];
    const type: ScheduledReminderRecord['type'] = allowedTypes.includes(body?.type)
      ? body.type
      : 'MEAL_REMINDER';

    const result = await scheduleReminder({
      recipientId,
      recipientRole,
      title,
      message,
      link: typeof body?.link === 'string' ? body.link : undefined,
      type,
      mealSlot: typeof body?.mealSlot === 'string' ? body.mealSlot : undefined,
      scheduledFor: effectiveScheduledFor,
      idempotencyKey:
        typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
    });

    res.status(200).json({
      ok: true,
      deduplicated: result.deduplicated,
      reminder: result.reminder,
    });
  } catch (err: any) {
    console.error('[api/notifications/reminders] Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to manage reminders.' });
  }
}
