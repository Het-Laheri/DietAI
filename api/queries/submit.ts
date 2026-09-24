import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

// Initialize dedicated backend app instance
const app = getApps().some(a => a.name === 'admin_query_backend')
  ? getApps().find(a => a.name === 'admin_query_backend')!
  : initializeApp(firebaseConfig, 'admin_query_backend');

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
    const { patientId, patientName, question, source, status, date } = req.body || {};

    if (!question || !patientId) {
      return res.status(400).json({ error: 'Missing required query fields (question and patientId)' });
    }

    // Authenticate as administrative dietician to ensure authorized Firestore write
    try {
      await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
    } catch (authErr: any) {
      console.warn('Auth note:', authErr?.message || authErr);
    }

    const docData = {
      patientId,
      patientName: patientName || 'Patient',
      question: question.trim(),
      source: source || 'app',
      status: status || 'pending',
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'queries'), docData);

    // Create system notification for dietician in background
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'SYSTEM',
        patientId,
        patientName: patientName || 'Patient',
        message: `New clinical consultation query from ${patientName || 'Patient'}: "${question.slice(0, 45)}..."`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (notifErr) {
      console.warn('Notification log:', notifErr);
    }

    return res.status(200).json({
      success: true,
      id: docRef.id,
      message: 'Query successfully received by lead dietician'
    });
  } catch (error: any) {
    console.error('Error submitting query:', error);
    return res.status(500).json({
      error: 'Failed to submit query',
      details: error?.message || String(error)
    });
  }
}
