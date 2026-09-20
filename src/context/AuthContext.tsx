import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isDemoMode: boolean;
  loginDemo: (name?: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT_DEMO_USER: AppUser = {
  uid: 'demo_user_expenseiq',
  email: 'alex.rivera@expenseiq.dev',
  displayName: 'Alex Rivera',
  isDemo: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    // Check if user previously chosen or demo user
    const saved = localStorage.getItem('expenseiq_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return isFirebaseConfigured ? null : DEFAULT_DEMO_USER;
  });
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      if (!user) {
        setUser(DEFAULT_DEMO_USER);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const appUser: AppUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          isDemo: false,
        };
        setUser(appUser);
        localStorage.setItem('expenseiq_user', JSON.stringify(appUser));
      } else {
        // In demo fallback or logged out
        const saved = localStorage.getItem('expenseiq_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.isDemo) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch { /* ignore */ }
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginDemo = (name: string = 'Alex Rivera') => {
    const demoUser: AppUser = {
      uid: 'demo_user_expenseiq',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@expenseiq.dev`,
      displayName: name,
      isDemo: true,
    };
    setUser(demoUser);
    localStorage.setItem('expenseiq_user', JSON.stringify(demoUser));
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured. Using Demo Mode.');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured. Using Demo Mode.');
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    localStorage.removeItem('expenseiq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode: !isFirebaseConfigured || (user?.isDemo ?? false),
        loginDemo,
        loginWithEmail,
        signupWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
