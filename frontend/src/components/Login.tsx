import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KatalystLogo } from './KatalystLogo';
import { ShieldCheck, UserCheck, HardHat, Building2, CheckCircle2, ArrowRight, Lock, Mail, User as UserIcon, Sparkles, X, KeyRound } from 'lucide-react';

interface LoginProps {
  onSuccess?: (role: string) => void;
  onNavigateHome?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateHome }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithGoogle, loginWithEmail, loginWithOtp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup');
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'WORKER' | 'ADMIN'>('CUSTOMER');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Sign-In Popup state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // Sync isSignUp state with URL path
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsSignUp(true);
    } else if (location.pathname === '/login') {
      setIsSignUp(false);
    }
  }, [location.pathname]);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      handleAuthComplete(user.role);
    }
  }, [user]);

  // Initialize Google GIS script if available
  useEffect(() => {
    const scriptId = 'google-gsi-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleAuthComplete = (mappedRole: string) => {
    if (onSuccess) {
      onSuccess(mappedRole);
    } else {
      if (mappedRole === 'WORKER') navigate('/worker');
      else if (mappedRole === 'COOP_ADMIN') navigate('/coop');
      else if (mappedRole === 'GOV_ADMIN') navigate('/admin');
      else navigate('/services');
    }
  };

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (isSignUp && selectedRole === 'ADMIN' && !orgName) {
      setError('Please enter your Organization / Cooperative Name');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'COOP_ADMIN' : selectedRole;
      const displayName = isSignUp 
        ? (selectedRole === 'ADMIN' && orgName ? `${fullName} (${orgName})` : fullName)
        : undefined;
      await loginWithEmail(email, password, mappedRole, displayName, isSignUp, orgName);
      handleAuthComplete(mappedRole);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    if (isSignUp && selectedRole === 'ADMIN' && !orgName) {
      setError('Please enter your Organization / Cooperative Name');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'COOP_ADMIN' : selectedRole;
      const displayName = isSignUp 
        ? (selectedRole === 'ADMIN' && orgName ? `${fullName} (${orgName})` : fullName)
        : undefined;
      await loginWithOtp(phone, otp, mappedRole, displayName);
      handleAuthComplete(mappedRole);
    } catch (err: any) {
      setError(err?.message || 'OTP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleSignInClick = () => {
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              const mappedRole = selectedRole === 'ADMIN' ? 'COOP_ADMIN' : selectedRole;
              await loginWithGoogle({
                email: payload.email,
                name: payload.name,
                picture: payload.picture
              }, mappedRole);
              handleAuthComplete(mappedRole);
            }
          }
        });
        (window as any).google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('Google GIS prompt failed, falling back to Interactive Google Selector Modal');
      }
    }

    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (acctEmail: string, acctName: string) => {
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'COOP_ADMIN' : selectedRole;
      await loginWithGoogle({
        email: acctEmail,
        name: acctName,
        picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
      }, mappedRole);
      handleAuthComplete(mappedRole);
    } catch (err: any) {
      setError('Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[var(--bg)] relative overflow-hidden flex items-center justify-center p-3 sm:p-5 my-auto font-sans transition-colors duration-200">
      {/* Subtle warm background ambient glow spheres */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container matching glass-panel style with max height restricted to 100vh */}
      <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] bg-[var(--surface)] backdrop-blur-xl rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-auto">
        
        {/* LEFT COLUMN: Auth Form */}
        <div className="lg:col-span-7 p-5 sm:p-8 md:p-9 flex flex-col justify-between relative overflow-y-auto">
          
          {/* Top Brand Logo */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer text-[var(--text-primary)] hover:opacity-90 transition-opacity"
                onClick={handleHomeClick}
              >
                <KatalystLogo className="h-9 w-auto" />
              </div>

              <button 
                onClick={handleHomeClick}
                className="px-3 py-1.5 rounded-full bg-[var(--border)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:opacity-80 transition-all flex items-center gap-1"
              >
                ← Back to Home
              </button>
            </div>

            {/* Title & Toggle */}
            <div className="mb-4 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {isSignUp ? 'Get started with KataLyst' : 'Welcome back to KataLyst'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="font-bold text-[var(--accent)] hover:underline underline-offset-4 transition-colors"
                >
                  {isSignUp ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </div>

            {/* ROLE SELECTION BAR (User, Worker, Admin) - Shown ONLY during Sign Up */}
            {isSignUp && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Select Your Role
                </label>
                
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                  {/* Role 1: User/Customer */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('CUSTOMER')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedRole === 'CUSTOMER'
                        ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-md scale-[1.02]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span className="truncate w-full text-center">User (Book)</span>
                  </button>

                  {/* Role 2: Worker */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('WORKER')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedRole === 'WORKER'
                        ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-md scale-[1.02]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <HardHat className="w-4 h-4 shrink-0" />
                    <span className="truncate w-full text-center">Worker (Job)</span>
                  </button>

                  {/* Role 3: Admin */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedRole === 'ADMIN'
                        ? 'bg-[var(--accent)] text-[var(--accent-cta-text)] shadow-md scale-[1.02]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate w-full text-center">Admin / Org</span>
                  </button>
                </div>

                {/* Dynamic Role Description Badge */}
                <div className="mt-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] px-3.5 py-1.5 rounded-lg border border-[var(--border)] flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="truncate">
                    {selectedRole === 'CUSTOMER' && 'Book verified gig workers and cooperative services on-demand.'}
                    {selectedRole === 'WORKER' && 'Join local worker cooperatives, earn fair wages & receive insurance.'}
                    {selectedRole === 'ADMIN' && 'Access administrative dashboard for Government & Cooperative oversight.'}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Auth Method Switcher (Email vs Phone OTP) */}
            <div className="flex items-center justify-between mb-2.5 text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Sign in using:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`underline-offset-2 ${authMethod === 'email' ? 'text-[var(--accent)] font-bold underline decoration-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}
                >
                  Email & Password
                </button>
                <span className="text-[var(--border)]">|</span>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`underline-offset-2 ${authMethod === 'phone' ? 'text-[var(--accent)] font-bold underline decoration-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'}`}
                >
                  Phone & OTP
                </button>
              </div>
            </div>

            {/* FORM BODY */}
            {authMethod === 'email' ? (
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Aarjav Shukla"
                        required={isSignUp}
                        className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {isSignUp && selectedRole === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Organization / Cooperative Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. North Delhi Labour Cooperative Society"
                        required={isSignUp && selectedRole === 'ADMIN'}
                        className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Enter your email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="your password"
                      required
                      className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-cta-text)] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <span>{loading ? 'Processing...' : isSignUp ? 'Continue' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneOtpSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                    />
                  </div>
                )}

                {isSignUp && selectedRole === 'ADMIN' && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Organization / Cooperative Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. North Delhi Labour Cooperative Society"
                        required={isSignUp && selectedRole === 'ADMIN'}
                        className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9900112233"
                    required
                    className="w-full px-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all shadow-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">Enter OTP (Dev OTP: 123456)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--accent)]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full pl-10 pr-3.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all tracking-widest shadow-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-cta-text)] font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}

            {/* OR DIVIDER */}
            <div className="my-3.5 flex items-center justify-center">
              <div className="h-px bg-[var(--border)] flex-1" />
              <span className="px-3 text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">OR</span>
              <div className="h-px bg-[var(--border)] flex-1" />
            </div>

            {/* GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[var(--bg)] hover:bg-[var(--border)]/40 border border-[var(--border)] hover:border-[var(--accent)]/40 text-[var(--text-primary)] font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 group"
            >
              {/* Google Official Multicolor SVG Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.04.0 12s.47 3.8 1.29 5.42l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Terms Footer */}
          <div className="mt-4 text-center text-[10px] text-[var(--text-secondary)]">
            By continuing, you agree to KataLyst's{' '}
            <a href="#terms" className="underline hover:text-[var(--accent)]">Terms of Service</a> and{' '}
            <a href="#privacy" className="underline hover:text-[var(--accent)]">Privacy Policy</a>.
          </div>
        </div>

        {/* RIGHT COLUMN: Luxurious warm dark visual matching KataLyst theme */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2B2824] via-[#3E3027] to-[#543D2D] p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden text-white border-t lg:border-t-0 lg:border-l border-[#8B7355]/20">
          
          {/* Top subtle location header */}
          <div className="flex items-center justify-between text-xs text-[#D5CCBF]/70 z-10">
            <span className="font-mono text-[11px] tracking-wider uppercase opacity-90">KataLyst</span>
            <span className="font-mono text-[11px] opacity-80">Delhi · v1.0</span>
          </div>

          {/* Center Golden Iridescent Lotus Visual */}
          <div className="relative my-auto flex flex-col items-center justify-center py-6 z-10">
            
            {/* Ambient Background Glow Spheres */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-[#8B7355]/30 via-[#6B4F3B]/30 to-[#D5CCBF]/20 blur-3xl animate-pulse" />
            <div className="absolute w-40 h-40 rounded-full bg-[#8B7355]/15 blur-2xl -top-4 -right-4" />

            {/* Glowing Lotus SVG Illustration matching Sahakar gold palette */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center animate-float">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_30px_rgba(139,115,85,0.45)]">
                <defs>
                  {/* Warm Golden Lotus Gradients */}
                  <linearGradient id="lotusGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#8B7355" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#6B4F3B" stopOpacity="0.75" />
                  </linearGradient>

                  <linearGradient id="lotusGlass1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#E8E2D9" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#D5CCBF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="lotusGlass2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D5CCBF" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#8B7355" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#FAF8F5" stopOpacity="0.85" />
                  </linearGradient>

                  <radialGradient id="lotusCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
                    <stop offset="40%" stopColor="#8B7355" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#543D2D" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Glass Petals */}
                <path
                  d="M100,160 C50,150 20,110 30,70 C50,95 80,120 100,160 Z"
                  fill="url(#lotusGlass1)"
                  stroke="rgba(213,204,191,0.7)"
                  strokeWidth="0.75"
                />
                <path
                  d="M100,160 C150,150 180,110 170,70 C150,95 120,120 100,160 Z"
                  fill="url(#lotusGlass2)"
                  stroke="rgba(213,204,191,0.7)"
                  strokeWidth="0.75"
                />

                {/* Mid Petals */}
                <path
                  d="M100,155 C65,130 40,85 55,45 C75,75 90,110 100,155 Z"
                  fill="url(#lotusGlass2)"
                  stroke="rgba(254,240,138,0.7)"
                  strokeWidth="1"
                />
                <path
                  d="M100,155 C135,130 160,85 145,45 C125,75 110,110 100,155 Z"
                  fill="url(#lotusGlass1)"
                  stroke="rgba(254,240,138,0.7)"
                  strokeWidth="1"
                />

                {/* Center Blooming Heart Petals */}
                <path
                  d="M100,150 C80,110 65,60 85,25 C95,55 98,100 100,150 Z"
                  fill="url(#lotusGold)"
                  stroke="rgba(254,240,138,0.9)"
                  strokeWidth="1.2"
                />
                <path
                  d="M100,150 C120,110 135,60 115,25 C105,55 102,100 100,150 Z"
                  fill="url(#lotusGold)"
                  stroke="rgba(254,240,138,0.9)"
                  strokeWidth="1.2"
                />

                {/* Central Glowing Core */}
                <circle cx="100" cy="115" r="24" fill="url(#lotusCore)" />
                <circle cx="100" cy="115" r="8" fill="#FFFBEB" className="animate-ping opacity-75" />

                {/* Glowing Stem */}
                <path
                  d="M100,160 C98,175 102,190 100,200"
                  stroke="url(#lotusGold)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Glowing Text tag under 3D graphic */}
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5]/10 border border-[#FAF8F5]/20 backdrop-blur-md text-[11px] font-medium text-[#F4F0EA] shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-[#FDE68A] animate-spin" />
                Cooperative Innovation Ecosystem
              </span>
            </div>
          </div>

          {/* Bottom Tagline matching main website */}
          <div className="z-10 text-center lg:text-left text-xs text-[#D5CCBF]/70 font-mono tracking-tight">
            Designed by humans · Evolved by AI
          </div>
        </div>

      </div>

      {/* INTERACTIVE GOOGLE AUTH SELECTOR MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[var(--surface)] rounded-2xl p-6 shadow-2xl border border-[var(--border)] relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--border)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.04.0 12s.47 3.8 1.29 5.42l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Sign in with Google</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Choose an account to continue to <strong>KataLyst</strong> as{' '}
                <span className="font-bold text-[var(--accent)]">{selectedRole}</span>
              </p>
            </div>

            {/* Quick Demo Google Accounts */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleSelectGoogleAccount('aarjav.shukla@gmail.com', 'Aarjav Shukla')}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg)] flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">Aarjav Shukla</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">aarjav.shukla@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectGoogleAccount('katalyst.user@gmail.com', 'KataLyst User')}
                className="w-full p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg)] flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-xs flex items-center justify-center shrink-0">
                  K
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)]">KataLyst User</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">katalyst.user@gmail.com</div>
                </div>
              </button>
            </div>

            {/* Custom Google Account Input */}
            <div className="pt-3 border-t border-[var(--border)]">
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Or enter any Google Email:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => {
                    setGoogleEmailInput(e.target.value);
                    if (!googleNameInput) setGoogleNameInput(e.target.value.split('@')[0]);
                  }}
                  placeholder="your.email@gmail.com"
                  className="flex-1 px-3 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (googleEmailInput) {
                      handleSelectGoogleAccount(googleEmailInput, googleNameInput || googleEmailInput.split('@')[0]);
                    }
                  }}
                  className="px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-cta-text)] text-xs font-bold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
