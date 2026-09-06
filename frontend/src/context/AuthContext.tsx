import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  SessionUser,
  StoredUser,
  getCurrentUser,
  signup,
  login,
  logout as logoutSession,
  authenticateWithGoogle,
  authenticateWithOtp,
  updateUserProfile
} from '../lib/auth';

export interface User extends SessionUser {
  lang_pref?: string;
  workerProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithOtp: (phone: string, otp: string, role?: string, name?: string) => Promise<void>;
  loginWithGoogle: (googleUser: { email: string; name: string; picture?: string }, role: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string, role: string, name?: string, isSignUp?: boolean, orgName?: string) => Promise<void>;
  quickLoginAs: (phone: string, role?: string, name?: string) => Promise<void>;
  updateProfile: (updatedFields: Partial<StoredUser>) => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session state from sahakar_session on page load
  useEffect(() => {
    const sessionUser = getCurrentUser();
    const storedToken = localStorage.getItem('sahakar_token');
    if (sessionUser) {
      setUser(sessionUser);
      setToken(storedToken || 'session_token_' + sessionUser.id);
    } else {
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);

  const loginWithOtp = async (phone: string, otp: string, role?: string, name?: string) => {
    const mappedRole = (role || 'CUSTOMER') as UserRole;
    const { user: sessionUser, token: authToken } = await authenticateWithOtp(phone, otp, mappedRole, name);
    setUser(sessionUser);
    setToken(authToken);
  };

  const loginWithGoogle = async (googleUser: { email: string; name: string; picture?: string }, role: string) => {
    const mappedRole = (role || 'CUSTOMER') as UserRole;
    const sessionUser = await authenticateWithGoogle(googleUser, mappedRole);
    setUser(sessionUser);
    setToken('session_token_' + sessionUser.id);
  };

  const loginWithEmail = async (
    email: string,
    pass: string,
    role: string,
    name?: string,
    isSignUp?: boolean,
    orgName?: string
  ) => {
    const mappedRole = (role || 'CUSTOMER') as UserRole;
    let sessionUser: SessionUser;

    if (isSignUp) {
      const displayName = name || email.split('@')[0] || 'Sahakar Member';
      sessionUser = await signup({
        name: displayName,
        email,
        password: pass,
        role: mappedRole,
        orgName
      });
    } else {
      sessionUser = await login(email, pass);
    }

    setUser(sessionUser);
    setToken('session_token_' + sessionUser.id);
  };

  const quickLoginAs = async (phone: string, role?: string, name?: string) => {
    await loginWithOtp(phone, '123456', role, name);
  };

  const updateProfile = (updatedFields: Partial<StoredUser>) => {
    if (!user) return;
    const updated = updateUserProfile(user.id, updatedFields);
    setUser(updated);
  };

  const logout = () => {
    logoutSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loginWithOtp, loginWithGoogle, loginWithEmail, quickLoginAs, updateProfile, logout, isLoading, getRoleRoute }}
    >
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
