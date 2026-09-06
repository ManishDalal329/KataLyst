import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CustomerPortal from './components/CustomerPortal';
import WorkerPortal from './components/WorkerPortal';
import CoopAdminPortal from './components/CoopAdminPortal';
import GovAdminPortal from './components/GovAdminPortal';
import ProfilePage from './components/ProfilePage';
import Login from './components/Login';
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

// Main Site Layout (Navbar + Page Contents + Footer)
export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartBooking = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'CUSTOMER') {
      navigate('/services');
    } else if (user.role === 'WORKER') {
      navigate('/worker');
    } else if (user.role === 'COOP_ADMIN') {
      navigate('/coop');
    } else if (user.role === 'GOV_ADMIN') {
      navigate('/admin');
    }
  };

  const handleExploreGov = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'GOV_ADMIN') {
      navigate('/admin');
    } else if (user.role === 'COOP_ADMIN') {
      navigate('/coop');
    } else if (user.role === 'WORKER') {
      navigate('/worker');
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public Home Route accessible to all */}
          <Route
            path="/"
            element={
              <LandingPage
                onStartBooking={handleStartBooking}
                onExploreGov={handleExploreGov}
              />
            }
          />

          {/* Role-Specific Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'WORKER', 'COOP_ADMIN', 'GOV_ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* User / Customer Only Route */}
          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerPortal />
              </ProtectedRoute>
            }
          />

          {/* Worker Only Route */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerPortal />
              </ProtectedRoute>
            }
          />

          {/* Org / Cooperative Admin Route */}
          <Route
            path="/coop"
            element={
              <ProtectedRoute allowedRoles={['COOP_ADMIN', 'GOV_ADMIN']}>
                <CoopAdminPortal />
              </ProtectedRoute>
            }
          />

          {/* Government Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['GOV_ADMIN']}>
                <GovAdminPortal />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-6 text-center text-xs text-[var(--text-secondary)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-[var(--text-primary)]">KataLyst</strong> • Cooperative Gig Services Platform
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Dedicated Standalone Route for Login / Signup (No Navbar, No Footer) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />

            {/* All Main Web Pages */}
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
