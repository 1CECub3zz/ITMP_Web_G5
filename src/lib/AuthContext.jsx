import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/api/localClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setAuthError(currentUser ? null : { type: 'auth_required' });
      setAuthChecked(true);
      return currentUser;
    } catch (error) {
      setUser(null);
      setAuthError({ type: error.type || 'auth_required' });
      setAuthChecked(true);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    isLoadingPublicSettings: false,
    authChecked,
    authError,
    checkUserAuth,
  }), [authChecked, authError, checkUserAuth, isLoadingAuth, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
