import { FieldValue } from 'firebase-admin/firestore';
import { guard, getAdminDb, parseBody, sendError, HttpError } from '../_lib/security.js';
import { dispatchWebPushToRecipient } from '../_lib/webPush.js';

const MAX_QUESTION_LENGTH = 4000;

// POST /api/queries/submit
// A patient submits a consultation query for themselves. A dietician may log one on a patient's behalf.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['POST'] });
  if (!caller) return;

  try {
    const { patientId, patientName, question, source, date } = parseBody(req);
    const text = typeof question === 'string' ? question.trim() : '';
    if (!text) throw new HttpError(400, 'Question text is required');
    if (text.length > MAX_QUESTION_LENGTH) throw new HttpError(400, 'Question is too long');

    // Patients can only submit for themselves; the client-supplied patientId is ignored for them.
    const finalPatientId = caller.role === 'patient' ? caller.uid : String(patientId || '');
    if (!finalPatientId) throw new HttpError(400, 'patientId is required');
    const finalPatientName = String(patientName || 'Patient').slice(0, 120);

    const db = getAdminDb();
    const docRef = await db.collection('queries').add({
      patientId: finalPatientId,
      patientName: finalPatientName,
      question: text,
      source: typeof source === 'string' ? source.slice(0, 40) : 'app',
      status: 'pending', // server-controlled; clients cannot pre-answer their own query
      date: typeof date === 'string' ? date.slice(0, 40) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: FieldValue.serverTimestamp(),
    });

    try {
      const notifId = `notif_query_${docRef.id}`;
      const title = 'New Patient Consultation Query 💬';
      const message = `${finalPatientName} asked: "${text.slice(0, 90)}"`;
      const pushSummary = await dispatchWebPushToRecipient({
        id: notifId,
        title,
        message,
        link: '/dietician/inbox',
        tag: notifId,
        type: 'QUERY_SUBMITTED',
        recipientRole: 'dietician',
      });

      await db.collection('notifications').doc(notifId).set({
        recipientRole: 'dietician',
        type: 'QUERY_SUBMITTED',
        title,
        patientId: finalPatientId,
        patientName: finalPatientName,
        message,
        link: '/dietician/inbox',
        read: false,
        pushDispatched: pushSummary.sentCount > 0,
        diagnostics: pushSummary.diagnostics,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (notifErr) {
      console.warn('[queries/submit] notification not created');
    }

    return res.status(200).json({ success: true, id: docRef.id, message: 'Query successfully received by lead dietician' });
  } catch (err) {
    return sendError(res, err);
  }
}
