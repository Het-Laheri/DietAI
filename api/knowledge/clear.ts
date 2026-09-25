import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'careclarity-e67bb',
  appId: '1:84746597643:web:cce300194b200eb5cbde0e',
  apiKey: 'AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M',
  authDomain: 'careclarity-e67bb.firebaseapp.com',
  storageBucket: 'careclarity-e67bb.firebasestorage.app',
  messagingSenderId: '84746597643',
};

const app = getApps().some(a => a.name === 'admin_knowledge_backend')
  ? getApps().find(a => a.name === 'admin_knowledge_backend')!
  : initializeApp(firebaseConfig, 'admin_knowledge_backend');

const auth = getAuth(app);
const db = initializeFirestore(app, {}, 'ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf');

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    try {
      if (!auth.currentUser) {
        await signInWithEmailAndPassword(auth, 'admin@aidiet.com', 'Admin123!');
      }
    } catch (e) {
      console.warn('Backend auth attempt notice:', e);
    }

    await setDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'), {
      recipes: [],
      count: 0,
      clearedAt: serverTimestamp()
    });

    return res.status(200).json({ success: true, message: 'Knowledge base database cleared successfully.' });
  } catch (error: any) {
    console.error('Error clearing knowledge base:', error);
    return res.status(500).json({ error: 'Failed to clear database', details: error.message });
  }
}
