import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CustomerPortal from './components/CustomerPortal';
import WorkerPortal from './components/WorkerPortal';
import CoopAdminPortal from './components/CoopAdminPortal';
import GovAdminPortal from './components/GovAdminPortal';
import Login from './components/Login';
import './i18n/i18n';

// Main Site Layout (Navbar + Page Contents + Footer)
export const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2824]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                onStartBooking={() => navigate('/services')}
                onExploreGov={() => navigate('/admin')}
              />
            }
          />
          <Route path="/services" element={<CustomerPortal />} />
          <Route path="/worker" element={<WorkerPortal />} />
          <Route path="/coop" element={<CoopAdminPortal />} />
          <Route path="/admin" element={<GovAdminPortal />} />
        </Routes>
      </main>

      <footer className="border-t border-[#E8E2D9] bg-[#FAF8F5] py-6 text-center text-xs text-[#857E75]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-[#2B2824]">SahakarConnect</strong> • Cooperative Gig Services Platform
          </div>
          <div>
            Ministry of Cooperation • Worker Cooperative Platform
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
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
  );
};

export default App;
