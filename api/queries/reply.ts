import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

const app = getApps().some(a => a.name === 'admin_reply_backend')
  ? getApps().find(a => a.name === 'admin_reply_backend')!
  : initializeApp(firebaseConfig, 'admin_reply_backend');

const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf');

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { queryId, reply, status, action } = req.body || {};

    if (!queryId) {
      return res.status(400).json({ error: 'Missing queryId' });
    }

    try {
      await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
    } catch (authErr: any) {
      console.warn('Auth note:', authErr?.message || authErr);
    }

    if (action === 'delete') {
      await deleteDoc(doc(db, 'queries', queryId));
      return res.status(200).json({ success: true, message: 'Query deleted' });
    }

    const updates: Record<string, any> = {};
    if (reply !== undefined) updates.reply = reply;
    if (status !== undefined) updates.status = status;

    await updateDoc(doc(db, 'queries', queryId), updates);

    return res.status(200).json({
      success: true,
      message: 'Query updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating query:', error);
    return res.status(500).json({
      error: 'Failed to update query',
      details: error?.message || String(error)
    });
  }
}
