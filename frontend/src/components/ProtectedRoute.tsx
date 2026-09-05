import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth, getRoleRoute } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Array<'CUSTOMER' | 'WORKER' | 'COOP_ADMIN' | 'GOV_ADMIN'>;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B7355]" />
        <p className="text-sm font-semibold text-[#857E75]">{t('loading')}</p>
      </div>
    );
  }

  // Not logged in: redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but role not permitted for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const targetRoute = getRoleRoute(user.role);

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-[#E8E2D9] bg-white shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-9 h-9 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#2B2824]">{t('access_denied_title')}</h2>
            <p className="text-xs text-[#6E675F] leading-relaxed">
              {t('access_denied_desc')}
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-red-100/60 text-red-700 text-[11px] font-bold uppercase tracking-wider">
              {t('signed_in_as')}: {user.name} ({user.role})
            </div>
          </div>

          <div>
            <Link
              to={targetRoute}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#6B4F3B] hover:bg-[#543D2D] text-white font-bold text-xs shadow-md transition-all transform active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('return_to_dashboard')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
