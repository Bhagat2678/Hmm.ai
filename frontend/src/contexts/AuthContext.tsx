import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthChange = () => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      setIsAuthenticated(!!token);
    };

    window.addEventListener('auth_change', handleAuthChange);
    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, []);

  const login = (token: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth_change'));
    }
  };

  const logout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth_change'));
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
