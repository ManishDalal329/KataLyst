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
  loginWithOtp: (phone: string, otp: string, role?: string, name?: string) => Promise<User>;
  quickLoginAs: (phone: string, role?: string, name?: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  getRoleRoute: (role?: string) => string;
}

export const getRoleRoute = (role?: string): string => {
  switch (role) {
    case 'WORKER':
      return '/worker';
    case 'COOP_ADMIN':
      return '/coop-admin';
    case 'GOV_ADMIN':
      return '/gov-portal';
    case 'CUSTOMER':
    default:
      return '/customer';
  }
};

// Helper to check if a JWT is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('sahakar_token');
    if (savedToken && isTokenExpired(savedToken)) {
      localStorage.removeItem('sahakar_token');
      localStorage.removeItem('sahakar_user');
      return null;
    }
    return savedToken;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        const savedUser = localStorage.getItem('sahakar_user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            logout();
          }
        }
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [token]);

  // Listen for global session expiration dispatched by fetchApi
  useEffect(() => {
    const handleExpired = () => {
      logout();
    };
    window.addEventListener('sahakar:session_expired', handleExpired);
    return () => {
      window.removeEventListener('sahakar:session_expired', handleExpired);
    };
  }, []);

  const loginWithOtp = async (phone: string, otp: string, role?: string, name?: string): Promise<User> => {
    const data = await fetchApi('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, role, name })
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sahakar_token', data.token);
    localStorage.setItem('sahakar_user', JSON.stringify(data.user));
    return data.user;
  };

  const quickLoginAs = async (phone: string, role?: string, name?: string): Promise<User> => {
    return await loginWithOtp(phone, '123456', role, name);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sahakar_token');
    localStorage.removeItem('sahakar_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithOtp, quickLoginAs, logout, isLoading, getRoleRoute }}>
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
