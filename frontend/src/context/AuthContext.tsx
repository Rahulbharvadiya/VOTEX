import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, invite?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('votex-auth')
    : null;

  useEffect(() => {
    // Check initial auth state
    api.auth
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    // Listen to unauthorized event
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('votex-unauthorized', handleUnauthorized);

    // Cross-tab logout broadcast listener
    if (channel) {
      channel.onmessage = (msg) => {
        if (msg.data === 'logout') {
          setUser(null);
        }
      };
    }

    return () => {
      window.removeEventListener('votex-unauthorized', handleUnauthorized);
      if (channel) channel.close();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, invite?: string) => {
    const res = await api.auth.register(email, pass, invite);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      if (channel) {
        channel.postMessage('logout');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
