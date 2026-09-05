import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Sparkles, Layers, Vote, BarChart3, Briefcase } from 'lucide-react';
import AuthModal from './AuthModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, quickLoginAs } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-coop-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-coop-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">Sahakar<span className="text-coop-400">Connect</span></span>
              <span className="bg-coop-500/10 border border-coop-500/30 text-coop-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                SIH 2026 #26089
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Ministry of Cooperation • Worker Cooperative Platform</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'home'
                ? 'bg-slate-800 text-coop-400 font-semibold shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            {t('nav_home')}
          </button>
          
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'services'
                ? 'bg-slate-800 text-coop-400 font-semibold shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{t('nav_services')}</span>
          </button>

          <button
            onClick={() => {
              if (!user || user.role !== 'WORKER') {
                quickLoginAs('9711000001', 'WORKER');
              }
              setActiveTab('worker');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'worker'
                ? 'bg-slate-800 text-coop-400 font-semibold shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Vote className="w-4 h-4 text-emerald-400" />
            <span>{t('nav_worker_app')}</span>
          </button>

          <button
            onClick={() => {
              if (!user || user.role !== 'COOP_ADMIN') {
                quickLoginAs('9810011111', 'COOP_ADMIN');
              }
              setActiveTab('coop');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'coop'
                ? 'bg-slate-800 text-coop-400 font-semibold shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>{t('nav_coop_admin')}</span>
          </button>

          <button
            onClick={() => {
              if (!user || user.role !== 'GOV_ADMIN') {
                quickLoginAs('9999999999', 'GOV_ADMIN');
              }
              setActiveTab('admin');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-slate-800 text-coop-400 font-semibold shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{t('nav_gov_admin')}</span>
          </button>
        </nav>

        {/* Right Tools: Language Toggle & User Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-coop-400" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Profile / Quick Login */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-coop-400 font-semibold uppercase">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 text-slate-400 transition-all"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-coop-600 to-emerald-500 hover:from-coop-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-coop-500/20 transition-all transform active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>{t('login')}</span>
            </button>
          )}

        </div>
      </div>

      {/* Auth Modal Trigger */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(role) => {
            setShowAuthModal(false);
            if (role === 'WORKER') setActiveTab('worker');
            else if (role === 'COOP_ADMIN') setActiveTab('coop');
            else if (role === 'GOV_ADMIN') setActiveTab('admin');
            else setActiveTab('services');
          }}
        />
      )}
    </header>
  );
};

export default Navbar;
