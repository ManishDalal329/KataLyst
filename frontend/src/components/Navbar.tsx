import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Briefcase, Vote, Layers, BarChart3, Home, Menu, X } from 'lucide-react';
import AuthModal from './AuthModal';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Build role-specific navigation items
  const getNavItems = () => {
    if (!user) {
      return [
        {
          id: 'home',
          path: '/',
          label: t('nav_home'),
          Icon: Home,
        },
        {
          id: 'services',
          path: '/customer',
          label: t('nav_services'),
          Icon: Briefcase,
        },
        {
          id: 'worker',
          path: '/worker',
          label: t('nav_worker_app'),
          Icon: Vote,
        },
        {
          id: 'coop',
          path: '/coop-admin',
          label: t('nav_coop_admin'),
          Icon: Layers,
        },
        {
          id: 'admin',
          path: '/gov-portal',
          label: t('nav_gov_admin'),
          Icon: BarChart3,
        },
      ];
    }

    switch (user.role) {
      case 'CUSTOMER':
        return [
          {
            id: 'customer-home',
            path: '/',
            label: t('nav_home'),
            Icon: Home,
          },
          {
            id: 'customer-services',
            path: '/customer',
            label: t('nav_services'),
            Icon: Briefcase,
          }
        ];
      case 'WORKER':
        return [
          {
            id: 'worker-dashboard',
            path: '/worker',
            label: t('nav_worker_app'),
            Icon: Vote,
          }
        ];
      case 'COOP_ADMIN':
        return [
          {
            id: 'coop-dashboard',
            path: '/coop-admin',
            label: t('nav_coop_admin'),
            Icon: Layers,
          }
        ];
      case 'GOV_ADMIN':
        return [
          {
            id: 'gov-dashboard',
            path: '/gov-portal',
            label: t('nav_gov_admin'),
            Icon: BarChart3,
          }
        ];
      default:
        return [
          {
            id: 'home',
            path: '/',
            label: t('nav_home'),
            Icon: Home,
          }
        ];
    }
  };

  const navItems = getNavItems();

  // Group contiguous items into active pop-out pills vs. inactive shared capsules
  const groups: { isActive: boolean; items: typeof navItems }[] = [];
  navItems.forEach((item) => {
    const isActive = location.pathname === item.path;
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.isActive === isActive) {
      lastGroup.items.push(item);
    } else {
      groups.push({ isActive, items: [item] });
    }
  });

  const getBrandHomePath = () => {
    if (!user) return '/';
    switch (user.role) {
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

  return (
    <header className="sticky top-3 z-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-full border border-[#E8E2D9] bg-[#FAF8F5]/95 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 lg:gap-6 shadow-sm">
        
        {/* Brand Logo & Title */}
        <Link to={getBrandHomePath()} className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#8B7355] flex items-center justify-center shadow-md shadow-[#8B7355]/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#FAF8F5] stroke-[2.5]" />
          </div>
          <div className="shrink-0">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#2B2824]">
              Sahakar<span className="text-[#8B7355]">Connect</span>
            </span>
          </div>
        </Link>

        {/* Center Dynamic Segmented Pop-out Navigation */}
        <nav className="hidden md:flex items-center space-x-1.5 shrink-0">
          {groups.map((group, groupIdx) =>
            group.isActive ? (
              // Active Pop-out Pill
              <div key={groupIdx} className="flex items-center shrink-0">
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className="px-3.5 py-1.5 rounded-2xl bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md shadow-[#6B4F3B]/25 flex items-center space-x-1.5 transition-all transform scale-[1.02] whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.5] text-white shrink-0" />
                      <span>{item.label}</span>
                    </Link>
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
                    <Link
                      key={item.id}
                      to={item.path}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6E675F] hover:text-[#2B2824] hover:bg-white/80 transition-all flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#8B7355] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </nav>

        {/* Right Tools: Language Toggle, User Auth & Mobile Hamburger */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#F4F0EA] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-xs font-semibold text-[#2B2824] transition-all shrink-0 whitespace-nowrap"
            title={t('switch_lang')}
          >
            <Globe className="w-3.5 h-3.5 text-[#8B7355] shrink-0" />
            <span>{i18n.language === 'en' ? t('switch_to_hindi') : t('switch_to_english')}</span>
          </button>

          {/* User Profile / Login / Logout */}
          {user ? (
            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden lg:flex flex-col items-end max-w-[130px] xl:max-w-[180px]">
                <span className="text-xs font-bold text-[#2B2824] truncate w-full text-right">{user.name}</span>
                <span className="text-[10px] text-[#8B7355] font-semibold uppercase truncate w-full text-right">
                  {user.role === 'CUSTOMER' && t('role_customer')}
                  {user.role === 'WORKER' && t('role_worker')}
                  {user.role === 'COOP_ADMIN' && t('role_coop_admin')}
                  {user.role === 'GOV_ADMIN' && t('role_gov_admin')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-[#F4F0EA] hover:bg-red-50 hover:text-red-600 border border-[#E8E2D9] text-[#6E675F] transition-all shrink-0"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all transform active:scale-95 shrink-0 whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-white shrink-0" />
              <span>{t('login')}</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full bg-[#F4F0EA] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-[#2B2824] transition-all shrink-0"
            aria-label={mobileMenuOpen ? t('close_menu') : t('open_menu')}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl bg-[#FAF8F5]/98 border border-[#E8E2D9] shadow-xl backdrop-blur-xl animate-fadeIn space-y-3">
          {user && (
            <div className="pb-3 border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#2B2824]">{user.name}</div>
                <div className="text-[11px] text-[#8B7355] font-semibold uppercase">
                  {user.role === 'CUSTOMER' && t('role_customer')}
                  {user.role === 'WORKER' && t('role_worker')}
                  {user.role === 'COOP_ADMIN' && t('role_coop_admin')}
                  {user.role === 'GOV_ADMIN' && t('role_gov_admin')}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.Icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-all ${
                    isActive
                      ? 'bg-[#6B4F3B] text-white shadow-sm'
                      : 'text-[#6E675F] hover:bg-[#F4F0EA] hover:text-[#2B2824]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8B7355]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {!user && (
            <div className="pt-2 border-t border-[#E8E2D9]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#6B4F3B] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('login')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal Trigger */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(role) => {
            setShowAuthModal(false);
            if (role === 'WORKER') navigate('/worker');
            else if (role === 'COOP_ADMIN') navigate('/coop-admin');
            else if (role === 'GOV_ADMIN') navigate('/gov-portal');
            else navigate('/customer');
          }}
        />
      )}
    </header>
  );
};

export default Navbar;
