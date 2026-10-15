import { FieldValue } from 'firebase-admin/firestore';
import { guard, getAdminDb, sendError } from '../_lib/security.js';

// DELETE (or POST) /api/knowledge/clear   (dietician only)
// Empties the clinical recipe knowledge base.
export default async function handler(req: any, res: any) {
  const caller = await guard(req, res, { methods: ['DELETE', 'POST'], roles: ['dietician'] });
  if (!caller) return;

  try {
    await getAdminDb().collection('dietician_notes').doc('clinical_knowledge_base').set({
      recipes: [],
      count: 0,
      clearedAt: FieldValue.serverTimestamp(),
      clearedBy: caller.uid,
    });
    return res.status(200).json({ success: true, message: 'Knowledge base database cleared successfully.' });
  } catch (err) {
    return sendError(res, err);
  }
}
