import type { QuerySnapshot } from 'firebase-admin/firestore';
import { guard, getAdminDb, sendError } from '../_lib/security.js';

const MAX_DOCS = 300;

// GET /api/queries/poll
// Change-signal endpoint used by the notification engine.
// Requires a Firebase ID token. Dieticians receive all items; patients only their own.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['GET'] });
  if (!caller) return;

  try {
    const db = getAdminDb();
    const toList = (snap: QuerySnapshot) => snap.docs.map(d => ({ ...d.data(), id: d.id }));

    let queries: any[];
    let notes: any[];
    let notifications: any[];

    if (caller.role === 'dietician') {
      const [q, n, dn] = await Promise.all([
        db.collection('queries').limit(MAX_DOCS).get(),
        db.collection('dietician_notes').where('isNotification', '==', true).limit(MAX_DOCS).get(),
        db.collection('notifications').limit(MAX_DOCS).get(),
      ]);
      queries = toList(q);
      notes = toList(n);
      notifications = toList(dn);
    } else {
      const [q, n, dn] = await Promise.all([
        db.collection('queries').where('patientId', '==', caller.uid).limit(MAX_DOCS).get(),
        db.collection('dietician_notes').where('patientId', '==', caller.uid).limit(MAX_DOCS).get(),
        db.collection('notifications').where('patientId', '==', caller.uid).limit(MAX_DOCS).get(),
      ]);
      queries = toList(q);
      notes = toList(n);
      notifications = toList(dn);
    }

    return res.status(200).json({ success: true, queries, notes, notifications, timestamp: Date.now() });
  } catch (err) {
    return sendError(res, err);
  }
}
