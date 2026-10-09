import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Author, AuthorRole } from '../api/types';

export type SessionUser = Pick<Author, 'id' | 'nickname' | 'role'>;

interface AuthContextValue {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const SESSION_KEY = 'yakamoz-session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession(): SessionUser | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as SessionUser | null;
    if (value && typeof value.id === 'string' && typeof value.nickname === 'string' && ['author', 'reviewer', 'admin'].includes(value.role)) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const login = useCallback((value: SessionUser) => {
    setUser(value);
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function hasTopicManagementRole(role: AuthorRole | undefined): boolean {
  return role === 'author' || role === 'reviewer' || role === 'admin';
}
