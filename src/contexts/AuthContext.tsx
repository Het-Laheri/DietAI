import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../services/db';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: () => void;
    
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        profileUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as User);
          } else {
            // Auto-heal fallback for demo / test accounts
            const emailLower = (firebaseUser.email || '').toLowerCase();
            if (emailLower.includes('testpatient') || emailLower === 'admin@aidiet.com') {
              const isDietician = emailLower.includes('admin');
              const fallbackUser: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: isDietician ? 'dietician' : 'patient',
                name: firebaseUser.displayName || (isDietician ? 'Lead Dietician' : 'Demo VIP Patient'),
                createdAt: new Date()
              };
              setProfile(fallbackUser);
            } else {
              setProfile(null);
            }
          }
          clearTimeout(timeout);
          setLoading(false);
        }, (err) => {
          console.error('Profile snapshot error:', err);
          const emailLower = (firebaseUser.email || '').toLowerCase();
          if (emailLower.includes('testpatient') || emailLower === 'admin@aidiet.com') {
            const isDietician = emailLower.includes('admin');
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isDietician ? 'dietician' : 'patient',
              name: firebaseUser.displayName || (isDietician ? 'Lead Dietician' : 'Demo VIP Patient'),
              createdAt: new Date()
            });
          }
          clearTimeout(timeout);
          setLoading(false);
        });
      } else {
        if (profileUnsubscribe) profileUnsubscribe();
        setProfile(null);
        clearTimeout(timeout);
        setLoading(false);
      }
    }, (err) => {
      console.error('Auth state error:', err);
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
