export type UserRole = 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN';

export interface AddressItem {
  id: string;
  label: string; // e.g. "Home", "Work", "Other"
  address: string;
  isDefault?: boolean;
}

export interface PaymentOptionItem {
  id: string;
  type: 'UPI' | 'CARD';
  nickname: string; // e.g. "HDFC Credit Card" or "Google Pay"
  details: string; // e.g. "**** 4321" or "user@upi" (NO full card numbers/CVVs!)
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  orgName?: string;
  phone?: string;
  profilePicture?: string;
  bio?: string;
  isAadhaarVerified?: boolean;
  aadhaarNumber?: string;
  aadhaarDoc?: string;

  // Customer specific
  savedAddresses?: AddressItem[];
  savedPaymentOptions?: PaymentOptionItem[];

  // Worker specific
  domains?: string[];
  activeShift?: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  rateTiers?: {
    low: number;
    moderate: number;
    high: number;
  };
  coopAffiliation?: string;

  // Org specific
  registeredAddress?: string;
  registrationNo?: string;
  verificationStatus?: string;

  createdAt: string;
}

export interface SessionUser extends Omit<Partial<StoredUser>, 'passwordHash'> {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const USERS_STORAGE_KEY = 'sahakar_users';
const SESSION_STORAGE_KEY = 'sahakar_session';

/**
 * SHA-256 password hashing helper via Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('SubtleCrypto digest failed, falling back to string hash', e);
    }
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'simple_hash_' + Math.abs(hash).toString(16);
}

/**
 * Retrieve all registered users from localStorage
 */
export function getUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse sahakar_users from localStorage', e);
    return [];
  }
}

/**
 * Save users array to localStorage
 */
export function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save sahakar_users to localStorage', e);
  }
}

/**
 * Get current logged in session user
 */
export function getCurrentUser(): SessionUser | null {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse sahakar_session from localStorage', e);
    return null;
  }
}

/**
 * Save current session user to localStorage
 */
export function setSession(user: SessionUser): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('sahakar_user', JSON.stringify(user));
    localStorage.setItem('sahakar_token', 'session_token_' + user.id);
  } catch (e) {
    console.error('Failed to set sahakar_session in localStorage', e);
  }
}

/**
 * Clear active user session (logout) without clearing registered users
 */
export function logout(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('sahakar_user');
    localStorage.removeItem('sahakar_token');
  } catch (e) {
    console.error('Failed to clear sahakar_session', e);
  }
}

/**
 * Update profile data for a specific user and refresh active session
 */
export function updateUserProfile(userId: string, updatedFields: Partial<StoredUser>): SessionUser {
  const users = getUsers();
  let index = users.findIndex((u) => u.id === userId);

  if (index === -1) {
    const session = getCurrentUser();
    if (session) {
      index = users.findIndex((u) => u.email === session.email);
    }
  }

  if (index === -1) {
    throw new Error('User account not found');
  }

  users[index] = { ...users[index], ...updatedFields };
  saveUsers(users);

  const updatedSession: SessionUser = { ...users[index] };
  delete (updatedSession as any).passwordHash;
  setSession(updatedSession);
  return updatedSession;
}

/**
 * Register a new user with duplicate email check & password hashing
 */
export async function signup(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  orgName?: string;
  phone?: string;
}): Promise<SessionUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  const users = getUsers();

  const existingUser = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (existingUser) {
    throw new Error('An account with this email already exists. Please log in instead.');
  }

  const passwordHash = await hashPassword(params.password);
  const newUser: StoredUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: params.name.trim(),
    email: cleanEmail,
    passwordHash,
    role: params.role,
    orgName: params.orgName?.trim(),
    phone: params.phone?.trim() || cleanEmail,
    coopAffiliation: params.role === 'WORKER' ? 'North Delhi Labour Cooperative Society' : undefined,
    registrationNo: params.role === 'COOP_ADMIN' || params.role === 'GOV_ADMIN' ? 'COOP-DEL-2024-8891' : undefined,
    verificationStatus: params.role === 'COOP_ADMIN' || params.role === 'GOV_ADMIN' ? 'VERIFIED & APPROVED' : undefined,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const sessionUser: SessionUser = { ...newUser };
  delete (sessionUser as any).passwordHash;

  setSession(sessionUser);
  return sessionUser;
}

/**
 * Authenticate user with email and password
 */
export async function login(email: string, password: string): Promise<SessionUser> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();

  const user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error('No account found with this email.');
  }

  const inputHash = await hashPassword(password);
  if (user.passwordHash !== inputHash) {
    throw new Error('Incorrect password.');
  }

  const sessionUser: SessionUser = { ...user };
  delete (sessionUser as any).passwordHash;

  setSession(sessionUser);
  return sessionUser;
}

/**
 * Authenticate or auto-create account for Google login
 */
export async function authenticateWithGoogle(
  googleUser: { email: string; name: string; picture?: string },
  role: UserRole
): Promise<SessionUser> {
  const cleanEmail = googleUser.email.trim().toLowerCase();
  const users = getUsers();

  let user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);
  if (!user) {
    const dummyHash = await hashPassword('google_oauth_protected');
    user = {
      id: 'g_' + Math.random().toString(36).substring(2, 9),
      name: googleUser.name,
      email: cleanEmail,
      passwordHash: dummyHash,
      role: role || 'CUSTOMER',
      phone: cleanEmail,
      profilePicture: googleUser.picture,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  }

  const sessionUser: SessionUser = { ...user };
  delete (sessionUser as any).passwordHash;

  setSession(sessionUser);
  return sessionUser;
}

/**
 * Authenticate or auto-create account for OTP login
 */
export async function authenticateWithOtp(
  phone: string,
  otp: string,
  role?: UserRole,
  name?: string
): Promise<SessionUser> {
  const cleanPhone = phone.trim();
  const users = getUsers();
  const defaultRole = role || 'CUSTOMER';

  let user = users.find((u) => u.phone === cleanPhone || u.email === cleanPhone);
  if (!user) {
    const dummyHash = await hashPassword('otp_login_protected');
    const defaultName = name || (defaultRole === 'WORKER' ? 'Worker Member' : defaultRole === 'COOP_ADMIN' ? 'Coop Admin' : 'User Member');
    user = {
      id: 'otp_' + Math.random().toString(36).substring(2, 9),
      name: defaultName,
      email: `${cleanPhone}@phone.sahakar`,
      passwordHash: dummyHash,
      role: defaultRole,
      phone: cleanPhone,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
  }

  const sessionUser: SessionUser = { ...user };
  delete (sessionUser as any).passwordHash;

  setSession(sessionUser);
  return sessionUser;
}
