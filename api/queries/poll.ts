import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

const app = getApps().some(a => a.name === 'admin_poll_backend')
  ? getApps().find(a => a.name === 'admin_poll_backend')!
  : initializeApp(firebaseConfig, 'admin_poll_backend');

const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf');

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    try {
      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
      }
    } catch (authErr: any) {
      console.warn('Poll backend auth note:', authErr?.message || authErr);
    }

    // Fetch latest queries
    let queriesList: any[] = [];
    try {
      const qSnap = await getDocs(collection(db, 'queries'));
      queriesList = qSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.warn('Queries poll err:', e);
    }

    // Fetch latest notes / notifications
    let notesList: any[] = [];
    try {
      const nSnap = await getDocs(collection(db, 'dietician_notes'));
      notesList = nSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {}

    let directNotifs: any[] = [];
    try {
      const dnSnap = await getDocs(collection(db, 'notifications'));
      directNotifs = dnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {}

    return res.status(200).json({
      success: true,
      queries: queriesList,
      notes: notesList,
      notifications: directNotifs,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Polling failed',
      details: error?.message || String(error)
    });
  }
}
