import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  User,
  Permission,
  AuthContextValue,
  LoginCredentials,
  ChangePasswordRequest,
} from '../types/auth';
import { authRepository } from '../lib/db/repositories';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authRepository.getCurrentSession();
        if (session) {
          setUser(session.user);
          setPermissions(session.permissions);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authRepository.signIn(credentials);
      setUser(result.user);
      setPermissions(result.permissions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authRepository.signOut();
      setUser(null);
      setPermissions([]);
    } catch (err) {
      console.error('Failed to sign out:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (request: ChangePasswordRequest) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    await authRepository.changePassword(user.id, request);
    // Update user state to reflect password change
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    return perms.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    return perms.every(p => permissions.includes(p));
  }, [permissions]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const session = await authRepository.getCurrentSession();
      if (session) {
        setUser(session.user);
        setPermissions(session.permissions);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signOut,
    changePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
  }), [
    user,
    permissions,
    isLoading,
    error,
    signIn,
    signOut,
    changePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
