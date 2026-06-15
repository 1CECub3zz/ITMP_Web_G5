import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/api/firebase-config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            // 💥 Defensive fix: check for email first, default to 'Brewer' if none
            full_name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Brewer'),
          });
          setAuthError(null);
        } else {
          setUser(null);
          setAuthError(null); // Not authenticated is a normal state, not an error
        }
      } catch (error) {
        console.error("Auth context processing error:", error);
      } finally {
        // 💥 Force close the loading spinner no matter what happens!
        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUserAuth = useCallback(async () => user, [user]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authChecked,
    authError,
    checkUserAuth,
  }), [authChecked, authError, isLoadingAuth, user, checkUserAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}