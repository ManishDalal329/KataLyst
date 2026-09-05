import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Phone, KeyRound, Sparkles, ShieldCheck, UserCheck, Vote, Building2, Landmark } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { loginWithOtp, quickLoginAs } = useAuth();
  const [phone, setPhone] = useState('9900112233');
  const [otp, setOtp] = useState('123456');
  const [role, setRole] = useState<'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN'>('CUSTOMER');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithOtp(phone, otp, role, name || undefined);
      onSuccess(role);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (phoneNum: string, targetRole: 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN') => {
    setLoading(true);
    try {
      await quickLoginAs(phoneNum, targetRole);
      onSuccess(targetRole);
    } catch (err: any) {
      setError(err.message || 'Preset login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-700 shadow-2xl bg-slate-900/95">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-coop-500/10 border border-coop-500/30 text-coop-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-coop-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white">SahakarConnect Login</h3>
          <p className="text-xs text-slate-400 mt-1">Phone + Dev OTP Simulation (OTP: 123456)</p>
        </div>

        {/* Rapid One-Click Hackathon Presets */}
        <div className="mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-coop-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Quick Demo Logins</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePreset('9900112233', 'CUSTOMER')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-coop-500/10 hover:border-coop-500/40 border border-slate-800 text-left transition-all group"
            >
              <UserCheck className="w-4 h-4 text-coop-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-coop-400">Customer</div>
                <div className="text-[10px] text-slate-500">Priya (9900112233)</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9711000001', 'WORKER')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-slate-800 text-left transition-all group"
            >
              <Vote className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">Worker Member</div>
                <div className="text-[10px] text-slate-500">Amit (9711000001)</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9810011111', 'COOP_ADMIN')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-teal-500/10 hover:border-teal-500/40 border border-slate-800 text-left transition-all group"
            >
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-teal-400">Coop Admin</div>
                <div className="text-[10px] text-slate-500">Rajesh (9810011111)</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9999999999', 'GOV_ADMIN')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-indigo-500/10 hover:border-indigo-500/40 border border-slate-800 text-left transition-all group"
            >
              <Landmark className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">Gov Admin</div>
                <div className="text-[10px] text-slate-500">Ministry (9999999999)</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Manual Phone/OTP Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-coop-500"
                placeholder="Enter 10-digit phone"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Enter OTP (Dev: 123456)</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-coop-500 tracking-widest"
                placeholder="123456"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role Selection</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-coop-500"
            >
              <option value="CUSTOMER">Customer (Book Services)</option>
              <option value="WORKER">Worker Member (Fulfill Jobs)</option>
              <option value="COOP_ADMIN">Cooperative Admin (Manage Coop)</option>
              <option value="GOV_ADMIN">Government Platform Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-coop-600 to-emerald-500 hover:from-coop-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-coop-500/20 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In with OTP'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AuthModal;
