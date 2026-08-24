import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domain not authorized. Please add this URL to Firebase Authorized Domains.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        // user just closed it, ignore
      } else {
        setError(err.message || "Failed to sign in. Have you enabled Google Auth in Firebase?");
      }
    }
  };

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
