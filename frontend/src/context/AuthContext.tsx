import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN';
  lang_pref?: string;
  workerProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithOtp: (phone: string, otp: string, role?: string, name?: string) => Promise<void>;
  quickLoginAs: (phone: string, role?: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sahakar_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('sahakar_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('sahakar_user');
        localStorage.removeItem('sahakar_token');
      }
    }
    setIsLoading(false);
  }, [token]);

  const loginWithOtp = async (phone: string, otp: string, role?: string, name?: string) => {
    const data = await fetchApi('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role, name })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sahakar_token', data.token);
    localStorage.setItem('sahakar_user', JSON.stringify(data.user));
  };

  const quickLoginAs = async (phone: string, role?: string, name?: string) => {
    await loginWithOtp(phone, '123456', role, name);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sahakar_token');
    localStorage.removeItem('sahakar_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithOtp, quickLoginAs, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
