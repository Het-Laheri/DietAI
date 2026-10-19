import { FieldValue } from 'firebase-admin/firestore';
import { guard, getAdminDb, parseBody, sendError, HttpError } from '../_lib/security.js';
import { dispatchWebPushToRecipient } from '../_lib/webPush.js';

const ALLOWED_STATUSES = new Set(['pending', 'viewed', 'answered']);

// POST /api/queries/reply   (dietician only)
// Body: { queryId, reply?, status?, action?: 'delete' }
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'], roles: ['dietician'] });
  if (!caller) return;

  try {
    const { queryId, reply, status, action } = parseBody(req);
    if (!queryId || typeof queryId !== 'string') throw new HttpError(400, 'Missing queryId');

    const db = getAdminDb();
    const ref = db.collection('queries').doc(queryId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Query not found');

    if (action === 'delete') {
      await ref.delete();
      return res.status(200).json({ success: true, message: 'Query deleted' });
    }

    const updates: Record<string, any> = {};
    if (reply !== undefined) {
      if (typeof reply !== 'string' || reply.length > 8000) throw new HttpError(400, 'Invalid reply');
      updates.reply = reply;
      updates.repliedAt = FieldValue.serverTimestamp();
    }
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.has(status)) throw new HttpError(400, 'Invalid status');
      updates.status = status;
    }
    if (!Object.keys(updates).length) throw new HttpError(400, 'Nothing to update');
    await ref.update(updates);

    const targetPatientId = snap.get('patientId');
    if (reply && targetPatientId) {
      try {
        const notifId = `notif_reply_${queryId}_${Date.now()}`;
        const title = 'Dietician Answered Your Query 🩺';
        const message = `Your dietician replied: "${String(reply).slice(0, 80)}${String(reply).length > 80 ? '...' : ''}"`;
        const pushSummary = await dispatchWebPushToRecipient({
          id: notifId,
          title,
          message,
          link: '/patient/inbox',
          tag: notifId,
          type: 'QUERY_ANSWERED',
          recipientRole: 'patient',
          recipientId: String(targetPatientId),
        });

        await db.collection('notifications').doc(notifId).set({
          recipientRole: 'patient',
          recipientId: targetPatientId,
          patientId: targetPatientId,
          patientName: snap.get('patientName') || '',
          type: 'QUERY_ANSWERED',
          title,
          message,
          link: '/patient/inbox',
          read: false,
          pushDispatched: pushSummary.sentCount > 0,
          diagnostics: pushSummary.diagnostics,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch {
        console.warn('[queries/reply] notification not created');
      }
    }

    return res.status(200).json({ success: true, message: 'Query updated successfully' });
  } catch (err) {
    return sendError(res, err);
  }
}
