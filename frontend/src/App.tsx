import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CustomerPortal from './components/CustomerPortal';
import WorkerPortal from './components/WorkerPortal';
import CoopAdminPortal from './components/CoopAdminPortal';
import GovAdminPortal from './components/GovAdminPortal';
import ProtectedRoute from './components/ProtectedRoute';
import './i18n/i18n';

const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <LandingPage
      onStartBooking={() => navigate('/customer')}
      onExploreGov={() => navigate('/gov-portal')}
    />
  );
};

export const AppContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2824]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public Home Page */}
          <Route path="/" element={<LandingPageWrapper />} />

          {/* Customer Portal: Home + Book Services Only */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />

          {/* Worker Member Dashboard */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerPortal />
              </ProtectedRoute>
            }
          />

          {/* Cooperative Admin Dashboard */}
          <Route
            path="/coop-admin"
            element={
              <ProtectedRoute allowedRoles={['COOP_ADMIN']}>
                <CoopAdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Government / Ministry Portal */}
          <Route
            path="/gov-portal"
            element={
              <ProtectedRoute allowedRoles={['GOV_ADMIN']}>
                <GovAdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-[#E8E2D9] bg-[#FAF8F5] py-6 text-center text-xs text-[#857E75]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-[#2B2824]">{t('footer_text')}</strong>
          </div>
          <div>
            {t('footer_sub')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
