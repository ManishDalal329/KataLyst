import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KatalystLogo } from './KatalystLogo';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { ShieldCheck, User as UserIcon, LogOut, Globe, Briefcase, Vote, Layers, BarChart3, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Build role-specific navigation items array (DOM-level conditional filtering)
  const navItems = [
    {
      id: '/',
      label: t('nav_home'),
      Icon: Home,
      onClick: () => navigate('/'),
      show: true, // Everyone sees Home
    },
    {
      id: '/services',
      label: t('nav_services'),
      Icon: Briefcase,
      onClick: () => navigate('/services'),
      show: user?.role === 'CUSTOMER', // User role only
    },
    {
      id: '/worker',
      label: t('nav_worker_app'),
      Icon: Vote,
      onClick: () => navigate('/worker'),
      show: user?.role === 'WORKER', // Worker role only
    },
    {
      id: '/coop',
      label: t('nav_coop_admin'),
      Icon: Layers,
      onClick: () => navigate('/coop'),
      show: user?.role === 'COOP_ADMIN' || user?.role === 'GOV_ADMIN', // Org role
    },
    {
      id: '/admin',
      label: t('nav_gov_admin'),
      Icon: BarChart3,
      onClick: () => navigate('/admin'),
      show: user?.role === 'GOV_ADMIN', // Government Admin role
    },
  ].filter((item) => item.show);

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
      <div className="glass-panel rounded-full px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 lg:gap-6 shadow-sm transition-colors duration-200">

        {/* Brand Logo */}
        <div
          className="flex items-center shrink-0 cursor-pointer text-[var(--text-primary)] hover:opacity-90 transition-opacity"
          onClick={() => navigate('/')}
        >
          <KatalystLogo className="h-9 w-auto" />
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
                    <Link
                      key={item.id}
                      onClick={item.onClick}
                      className="px-3.5 py-1.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all transform scale-[1.02] whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2.5] text-[var(--accent-cta-text)] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // Inactive Shared Container Pill Capsule
              <div
                key={groupIdx}
                className="bg-[var(--border)] border border-[var(--border)] rounded-2xl p-1 flex items-center space-x-0.5 shrink-0"
              >
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <Link
                      key={item.id}
                      onClick={item.onClick}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </nav>

        {/* Right Tools: Theme Toggle, Language Toggle & User Auth */}
        <div className="flex items-center space-x-2 shrink-0">

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] transition-all shrink-0 whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Profile Button / Login Route Button */}
          {user ? (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] transition-all cursor-pointer group shrink-0"
                title="View & Edit Profile"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-[11px] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start max-w-[120px] xl:max-w-[160px]">
                  <div className="flex items-center space-x-1 w-full">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate text-left group-hover:text-[var(--accent)] transition-colors">
                      {user.name}
                    </span>
                    {user.isAadhaarVerified && (
                      <span title="Aadhaar Verified Member" className="flex items-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--accent)] font-semibold uppercase truncate w-full text-left">
                    {user.role === 'CUSTOMER' ? 'User' : user.role === 'WORKER' ? 'Worker' : 'Org Admin'}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-full bg-[var(--surface)] hover:bg-red-500/10 hover:text-red-500 border border-[var(--border)] text-[var(--text-secondary)] transition-all shrink-0"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-cta-text)] font-bold text-xs shadow-md transition-all transform active:scale-95 shrink-0 whitespace-nowrap"
            >
              <UserIcon className="w-3.5 h-3.5 text-[var(--accent-cta-text)] shrink-0" />
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
    </header>
  );
};

export default Navbar;
