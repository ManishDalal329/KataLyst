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
  loginWithGoogle: (googleUser: { email: string; name: string; picture?: string }, role: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string, role: string, name?: string, isSignUp?: boolean) => Promise<void>;
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
    try {
      const data = await fetchApi('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, role, name })
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sahakar_token', data.token);
      localStorage.setItem('sahakar_user', JSON.stringify(data.user));
    } catch (err) {
      // Fallback for offline/demo mode
      const mockUser: User = {
        id: 'usr_' + Date.now(),
        name: name || (role === 'WORKER' ? 'Amit Kumar' : role === 'COOP_ADMIN' ? 'Rajesh Coop' : role === 'GOV_ADMIN' ? 'Gov Official' : 'User Member'),
        phone: phone || '9900112233',
        role: (role as any) || 'CUSTOMER',
        lang_pref: 'en'
      };
      const mockToken = 'jwt-token-' + Date.now();
      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('sahakar_token', mockToken);
      localStorage.setItem('sahakar_user', JSON.stringify(mockUser));
    }
  };

  const loginWithGoogle = async (googleUser: { email: string; name: string; picture?: string }, role: string) => {
    const mappedRole = (role || 'CUSTOMER') as User['role'];
    const newUser: User = {
      id: 'g_' + Math.random().toString(36).substring(2, 9),
      name: googleUser.name,
      phone: googleUser.email,
      role: mappedRole,
      lang_pref: 'en'
    };
    const tokenStr = 'google_jwt_' + Date.now();
    setToken(tokenStr);
    setUser(newUser);
    localStorage.setItem('sahakar_token', tokenStr);
    localStorage.setItem('sahakar_user', JSON.stringify(newUser));
  };

  const loginWithEmail = async (email: string, _pass: string, role: string, name?: string, isSignUp?: boolean) => {
    const mappedRole = (role || 'CUSTOMER') as User['role'];
    const userName = name || email.split('@')[0] || 'Sahakar Member';
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: userName,
      phone: email,
      role: mappedRole,
      lang_pref: 'en'
    };
    const tokenStr = 'email_jwt_' + Date.now();
    setToken(tokenStr);
    setUser(newUser);
    localStorage.setItem('sahakar_token', tokenStr);
    localStorage.setItem('sahakar_user', JSON.stringify(newUser));
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
    <AuthContext.Provider value={{ user, token, loginWithOtp, loginWithGoogle, loginWithEmail, quickLoginAs, logout, isLoading }}>
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
