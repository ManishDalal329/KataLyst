import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Briefcase, Vote, Layers, BarChart3, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    {
      id: '/',
      label: t('nav_home'),
      Icon: Home,
      onClick: () => navigate('/'),
    },
    {
      id: '/services',
      label: t('nav_services'),
      Icon: Briefcase,
      onClick: () => navigate('/services'),
    },
    {
      id: '/worker',
      label: t('nav_worker_app'),
      Icon: Vote,
      onClick: () => {
        if (!user || user.role !== 'WORKER') {
          quickLoginAs('9711000001', 'WORKER');
        }
        navigate('/worker');
      },
    },
    {
      id: '/coop',
      label: t('nav_coop_admin'),
      Icon: Layers,
      onClick: () => {
        if (!user || user.role !== 'COOP_ADMIN') {
          quickLoginAs('9810011111', 'COOP_ADMIN');
        }
        navigate('/coop');
      },
    },
    {
      id: '/admin',
      label: t('nav_gov_admin'),
      Icon: BarChart3,
      onClick: () => {
        if (!user || user.role !== 'GOV_ADMIN') {
          quickLoginAs('9999999999', 'GOV_ADMIN');
        }
        navigate('/admin');
      },
    },
  ];

  // Group contiguous items into active pop-out pills vs. inactive shared capsules
  const groups: { isActive: boolean; items: typeof navItems }[] = [];
  navItems.forEach((item) => {
    const isActive = location.pathname === item.id || (item.id === '/' && location.pathname === '');
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.isActive === isActive) {
      lastGroup.items.push(item);
    } else {
      groups.push({ isActive, items: [item] });
    }
  });

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-full border border-[#E8E2D9] bg-[#FAF8F5]/95 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 lg:gap-6 shadow-sm">

        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2.5 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-full bg-[#8B7355] flex items-center justify-center shadow-md shadow-[#8B7355]/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#FAF8F5] stroke-[2.5]" />
          </div>
          <div className="shrink-0">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#2B2824]">
              Sahakar<span className="text-[#8B7355]">Connect</span>
            </span>
          </div>
        </div>

        {/* Center Dynamic Segmented Pop-out Navigation */}
        <nav className="hidden md:flex items-center space-x-1.5 shrink-0">
          {groups.map((group, groupIdx) =>
            group.isActive ? (
              // Active Pop-out Pill
              <div key={groupIdx} className="flex items-center shrink-0">
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="px-3.5 py-1.5 rounded-2xl bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md shadow-[#6B4F3B]/25 flex items-center space-x-1.5 transition-all transform scale-[1.02] whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.5] text-white shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Inactive Shared Container Pill Capsule
              <div
                key={groupIdx}
                className="bg-[#F4F0EA] border border-[#E8E2D9] rounded-2xl p-1 flex items-center space-x-0.5 shrink-0"
              >
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6E675F] hover:text-[#2B2824] hover:bg-white/80 transition-all flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#8B7355] shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </nav>

        {/* Right Tools: Language Toggle & User Auth */}
        <div className="flex items-center space-x-2 shrink-0">

          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#F4F0EA] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-xs font-semibold text-[#2B2824] transition-all shrink-0 whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#8B7355] shrink-0" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Profile / Login Route Button */}
          {user ? (
            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden lg:flex flex-col items-end max-w-[130px] xl:max-w-[180px]">
                <span className="text-xs font-bold text-[#2B2824] truncate w-full text-right">{user.name}</span>
                <span className="text-[10px] text-[#8B7355] font-semibold uppercase truncate w-full text-right">{user.role}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-full bg-[#F4F0EA] hover:bg-red-50 hover:text-red-600 border border-[#E8E2D9] text-[#6E675F] transition-all shrink-0"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all transform active:scale-95 shrink-0 whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{t('login')}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;


