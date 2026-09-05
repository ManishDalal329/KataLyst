import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, Phone, KeyRound, Sparkles, ShieldCheck, UserCheck, Vote, Building2, Landmark, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { loginWithOtp, quickLoginAs } = useAuth();
  const { t } = useTranslation();
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
      const loggedUser = await loginWithOtp(phone, otp, role, name || undefined);
      onSuccess(loggedUser.role || role);
    } catch (err: any) {
      setError(err.message || t('auth_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = async (phoneNum: string, targetRole: 'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN') => {
    setLoading(true);
    setError('');
    try {
      const loggedUser = await quickLoginAs(phoneNum, targetRole);
      onSuccess(loggedUser.role || targetRole);
    } catch (err: any) {
      setError(err.message || t('auth_failed'));
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
          aria-label={t('close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8B7355]/20 border border-[#8B7355]/40 text-[#D5CCBF] mx-auto flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-[#FAF8F5]" />
          </div>
          <h3 className="text-xl font-extrabold text-white">{t('login_modal_title')}</h3>
          <p className="text-xs text-slate-400 mt-1">{t('login_modal_sub')}</p>
        </div>

        {/* Rapid One-Click Presets */}
        <div className="mb-6 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {t('quick_logins_title')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePreset('9900112233', 'CUSTOMER')}
              disabled={loading}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-[#8B7355]/20 hover:border-[#8B7355]/50 border border-slate-800 text-left transition-all group disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300">{t('role_customer')}</div>
                <div className="text-[10px] text-slate-400">{t('preset_customer_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9711000001', 'WORKER')}
              disabled={loading}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-slate-800 text-left transition-all group disabled:opacity-50"
            >
              <Vote className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">{t('role_worker')}</div>
                <div className="text-[10px] text-slate-400">{t('preset_worker_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9810011111', 'COOP_ADMIN')}
              disabled={loading}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-teal-500/20 hover:border-teal-500/50 border border-slate-800 text-left transition-all group disabled:opacity-50"
            >
              <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-teal-300">{t('role_coop_admin')}</div>
                <div className="text-[10px] text-slate-400">{t('preset_coop_desc')}</div>
              </div>
            </button>

            <button
              onClick={() => handlePreset('9999999999', 'GOV_ADMIN')}
              disabled={loading}
              className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-indigo-500/20 hover:border-indigo-500/50 border border-slate-800 text-left transition-all group disabled:opacity-50"
            >
              <Landmark className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">{t('role_gov_admin')}</div>
                <div className="text-[10px] text-slate-400">{t('preset_gov_desc')}</div>
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t('phone_label')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                placeholder={t('phone_placeholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t('otp_label')}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 tracking-widest"
                placeholder={t('otp_placeholder')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t('role_label')}
            </label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="CUSTOMER">{t('role_opt_customer')}</option>
              <option value="WORKER">{t('role_opt_worker')}</option>
              <option value="COOP_ADMIN">{t('role_opt_coop')}</option>
              <option value="GOV_ADMIN">{t('role_opt_gov')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('authenticating')}</span>
              </>
            ) : (
              <span>{t('signin_btn')}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AuthModal;
