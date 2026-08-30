import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "careclarity-e67bb",
  appId: "1:84746597643:web:cce300194b200eb5cbde0e",
  apiKey: "AIzaSyCuHfs4FyxUCMlAcZyT5tjsKr43BYba99M",
  authDomain: "careclarity-e67bb.firebaseapp.com",
  storageBucket: "careclarity-e67bb.firebasestorage.app",
  messagingSenderId: "84746597643",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, "ai-studio-3cc137c8-6ab4-4be2-ac21-f3bc2e0fcecf");

