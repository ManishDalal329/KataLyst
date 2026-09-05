import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, HardHat, Building2, CheckCircle2, ArrowRight, Lock, Mail, User as UserIcon, Sparkles, X, KeyRound } from 'lucide-react';

interface LoginProps {
  onSuccess?: (role: string) => void;
  onNavigateHome?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateHome }) => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithEmail, loginWithOtp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'WORKER' | 'ADMIN'>('CUSTOMER');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Sign-In Popup state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

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
    setLoading(true);
    setError('');

    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'GOV_ADMIN' : selectedRole;
      await loginWithEmail(email, password, mappedRole, isSignUp ? fullName : undefined, isSignUp);
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
    setLoading(true);
    setError('');

    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'GOV_ADMIN' : selectedRole;
      await loginWithOtp(phone, otp, mappedRole, fullName || undefined);
      handleAuthComplete(mappedRole);
    } catch (err: any) {
      setError(err?.message || 'OTP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleSignInClick = () => {
    // Check if Google GIS object is loaded & client ID exists in env
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response.credential) {
              // Parse JWT token from Google
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              const mappedRole = selectedRole === 'ADMIN' ? 'GOV_ADMIN' : selectedRole;
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

    // Interactive Google OAuth modal fallback
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (acctEmail: string, acctName: string) => {
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const mappedRole = selectedRole === 'ADMIN' ? 'GOV_ADMIN' : selectedRole;
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
    <div className="min-h-screen w-full bg-[#111015] flex items-center justify-center p-3 sm:p-6 md:p-8 my-auto font-sans">
      {/* Container matching split-screen style from reference image */}
      <div className="w-full max-w-5xl bg-[#FAF9F6] rounded-3xl border border-[#E8E2D9] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        
        {/* LEFT COLUMN: Auth Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between relative bg-pattern-texture">
          
          {/* Top Brand Logo */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer group"
                onClick={handleHomeClick}
              >
                <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className="font-extrabold text-lg text-[#1E1E1E] tracking-tight block leading-none">
                    Sahakar<span className="text-[#8B7355]">Connect</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#8B7355] tracking-wide uppercase">
                    Cooperative Platform
                  </span>
                </div>
              </div>

              <button 
                onClick={handleHomeClick}
                className="text-xs font-semibold text-[#7E7870] hover:text-[#1E1E1E] transition-colors"
              >
                ← Back to Home
              </button>
            </div>

            {/* Title & Toggle */}
            <div className="mb-6 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1E1E] tracking-tight">
                {isSignUp ? 'Get started with Sahakar' : 'Welcome back to Sahakar'}
              </h1>
              <p className="text-xs sm:text-sm text-[#7E7870] mt-1.5 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="font-bold text-[#1E1E1E] underline underline-offset-4 hover:text-[#8B7355] transition-colors"
                >
                  {isSignUp ? 'Log in' : 'Sign up'}
                </button>
              </p>
            </div>

            {/* ROLE SELECTION BAR (User, Worker, Admin) */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#6E675F] uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#F0EDE6] rounded-2xl border border-[#E3DDD3]">
                {/* Role 1: User/Customer */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('CUSTOMER')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === 'CUSTOMER'
                      ? 'bg-[#1E1E1E] text-white shadow-md scale-[1.02]'
                      : 'text-[#6E675F] hover:text-[#1E1E1E] hover:bg-white/50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate w-full text-center">User (Book)</span>
                </button>

                {/* Role 2: Worker */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('WORKER')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === 'WORKER'
                      ? 'bg-[#1E1E1E] text-white shadow-md scale-[1.02]'
                      : 'text-[#6E675F] hover:text-[#1E1E1E] hover:bg-white/50'
                  }`}
                >
                  <HardHat className="w-4 h-4 shrink-0" />
                  <span className="truncate w-full text-center">Worker (Job)</span>
                </button>

                {/* Role 3: Admin */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === 'ADMIN'
                      ? 'bg-[#1E1E1E] text-white shadow-md scale-[1.02]'
                      : 'text-[#6E675F] hover:text-[#1E1E1E] hover:bg-white/50'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate w-full text-center">Admin / Org</span>
                </button>
              </div>

              {/* Dynamic Role Description Badge */}
              <div className="mt-2 text-[11px] text-[#7E7870] bg-[#F5F2EC] px-3 py-1.5 rounded-lg border border-[#E8E2D9] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7355] shrink-0" />
                <span>
                  {selectedRole === 'CUSTOMER' && 'Book verified gig workers and cooperative services on-demand.'}
                  {selectedRole === 'WORKER' && 'Join local worker cooperatives, earn fair wages & receive insurance.'}
                  {selectedRole === 'ADMIN' && 'Access administrative dashboard for Government & Cooperative oversight.'}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Auth Method Switcher (Email vs Phone OTP) */}
            <div className="flex items-center justify-between mb-3 text-xs font-semibold">
              <span className="text-[#6E675F]">Sign in using:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`underline-offset-2 ${authMethod === 'email' ? 'text-[#1E1E1E] font-bold underline' : 'text-[#8B7355]'}`}
                >
                  Email & Password
                </button>
                <span className="text-[#C5BEB3]">|</span>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`underline-offset-2 ${authMethod === 'phone' ? 'text-[#1E1E1E] font-bold underline' : 'text-[#8B7355]'}`}
                >
                  Phone & OTP
                </button>
              </div>
            </div>

            {/* FORM BODY */}
            {authMethod === 'email' ? (
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[#4A453E] mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-[#9E978E]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Aarjav Shukla"
                        required={isSignUp}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] placeholder-[#B0A99F] focus:outline-none focus:border-[#1E1E1E] focus:ring-1 focus:ring-[#1E1E1E] transition-all shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#4A453E] mb-1">Enter your email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#9E978E]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] placeholder-[#B0A99F] focus:outline-none focus:border-[#1E1E1E] focus:ring-1 focus:ring-[#1E1E1E] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A453E] mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#9E978E]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="your password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] placeholder-[#B0A99F] focus:outline-none focus:border-[#1E1E1E] focus:ring-1 focus:ring-[#1E1E1E] transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-[#262626] hover:bg-[#000000] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{loading ? 'Processing...' : isSignUp ? 'Continue' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            ) : (
              <form onSubmit={handlePhoneOtpSubmit} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-[#4A453E] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] shadow-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#4A453E] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9900112233"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] shadow-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A453E] mb-1">Enter OTP (Dev OTP: 123456)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-[#9E978E]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DCD3] rounded-xl text-xs sm:text-sm text-[#1E1E1E] focus:outline-none focus:border-[#1E1E1E] tracking-widest shadow-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-[#262626] hover:bg-[#000000] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{loading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}

            {/* OR DIVIDER */}
            <div className="my-5 flex items-center justify-center">
              <div className="h-px bg-[#E3DDD3] flex-1" />
              <span className="px-3 text-[11px] font-bold text-[#A39C90] uppercase tracking-wider">OR</span>
              <div className="h-px bg-[#E3DDD3] flex-1" />
            </div>

            {/* GOOGLE SIGN IN BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#F7F5F0] border border-[#E0D9CE] hover:border-[#C5BEB3] text-[#2B2824] font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 group"
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
          <div className="mt-6 text-center text-[10px] text-[#A39C90]">
            By continuing, you agree to SahakarConnect's{' '}
            <a href="#terms" className="underline hover:text-[#1E1E1E]">Terms of Service</a> and{' '}
            <a href="#privacy" className="underline hover:text-[#1E1E1E]">Privacy Policy</a>.
          </div>
        </div>

        {/* RIGHT COLUMN: Dark aesthetic lotus visual matching reference artwork */}
        <div className="lg:col-span-5 bg-[#050507] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden text-white border-t lg:border-t-0 lg:border-l border-slate-800">
          
          {/* Top subtle location header */}
          <div className="flex items-center justify-between text-xs text-slate-400 z-10">
            <span className="font-mono text-[11px] tracking-wider uppercase opacity-80">SahakarConnect</span>
            <span className="font-mono text-[11px] opacity-70">Delhi · v1.0</span>
          </div>

          {/* Center 3D Iridescent Glass Lotus Visual */}
          <div className="relative my-auto flex flex-col items-center justify-center py-10 z-10">
            
            {/* Ambient Background Glow Spheres */}
            <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
            <div className="absolute w-48 h-48 rounded-full bg-blue-500/10 blur-2xl -top-4 -right-4" />

            {/* Glowing Lotus SVG Illustration matching glass texture */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center animate-float">
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_35px_rgba(251,191,36,0.35)]">
                <defs>
                  {/* Iridescent Lotus Gradients */}
                  <linearGradient id="lotusGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.6" />
                  </linearGradient>

                  <linearGradient id="lotusGlass1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="40%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#F472B6" stopOpacity="0.3" />
                  </linearGradient>

                  <linearGradient id="lotusGlass2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#A7F3D0" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  </linearGradient>

                  <radialGradient id="lotusCore" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
                    <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Glass Petals */}
                <path
                  d="M100,160 C50,150 20,110 30,70 C50,95 80,120 100,160 Z"
                  fill="url(#lotusGlass1)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="0.75"
                />
                <path
                  d="M100,160 C150,150 180,110 170,70 C150,95 120,120 100,160 Z"
                  fill="url(#lotusGlass2)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="0.75"
                />

                {/* Mid Petals */}
                <path
                  d="M100,155 C65,130 40,85 55,45 C75,75 90,110 100,155 Z"
                  fill="url(#lotusGlass2)"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1"
                />
                <path
                  d="M100,155 C135,130 160,85 145,45 C125,75 110,110 100,155 Z"
                  fill="url(#lotusGlass1)"
                  stroke="rgba(255,255,255,0.8)"
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
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-medium text-amber-200/90 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Cooperative Innovation Ecosystem
              </span>
            </div>
          </div>

          {/* Bottom Tagline matching screenshot */}
          <div className="z-10 text-center lg:text-left text-xs text-slate-400/80 font-mono tracking-tight">
            Designed by humans · Evolved by AI
          </div>
        </div>

      </div>

      {/* INTERACTIVE GOOGLE AUTH SELECTOR MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-all"
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
              <h3 className="text-base font-bold text-slate-800">Sign in with Google</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an account to continue to <strong>SahakarConnect</strong> as{' '}
                <span className="font-bold text-[#8B7355]">{selectedRole}</span>
              </p>
            </div>

            {/* Quick Demo Google Accounts */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleSelectGoogleAccount('aarjav.shukla@gmail.com', 'Aarjav Shukla')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Aarjav Shukla</div>
                  <div className="text-[11px] text-slate-500 truncate">aarjav.shukla@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => handleSelectGoogleAccount('sahakar.user@gmail.com', 'Sahakar User')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  S
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Sahakar User</div>
                  <div className="text-[11px] text-slate-500 truncate">sahakar.user@gmail.com</div>
                </div>
              </button>
            </div>

            {/* Custom Google Account Input */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Or enter any Google Email:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => {
                    setGoogleEmailInput(e.target.value);
                    if (!googleNameInput) setGoogleNameInput(e.target.value.split('@')[0]);
                  }}
                  placeholder="your.email@gmail.com"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (googleEmailInput) {
                      handleSelectGoogleAccount(googleEmailInput, googleNameInput || googleEmailInput.split('@')[0]);
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
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
