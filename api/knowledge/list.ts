import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDoc } from 'firebase/firestore';
import { DEFAULT_CLINICAL_RECIPES } from '../../src/services/defaultRecipes';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

    let recipes = DEFAULT_CLINICAL_RECIPES;

    try {
      const snap = await getDoc(doc(db, 'dietician_notes', 'clinical_knowledge_base'));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.recipes) && data.recipes.length >= 200) {
          recipes = data.recipes;
        }
      }
    } catch (firestoreErr) {
      console.warn('Firestore read fallback to default clinical recipes:', firestoreErr);
    }

    return res.status(200).json({
      count: recipes.length,
      recipes,
      sample: recipes.slice(0, 10)
    });
  } catch (error: any) {
    console.error('Error in /api/knowledge/list:', error);
    return res.status(200).json({
      count: DEFAULT_CLINICAL_RECIPES.length,
      recipes: DEFAULT_CLINICAL_RECIPES,
      sample: DEFAULT_CLINICAL_RECIPES.slice(0, 10)
    });
  }
}
