import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CustomerPortal from './components/CustomerPortal';
import WorkerPortal from './components/WorkerPortal';
import CoopAdminPortal from './components/CoopAdminPortal';
import GovAdminPortal from './components/GovAdminPortal';
import './i18n/i18n';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <LandingPage
            onStartBooking={() => setActiveTab('services')}
            onExploreGov={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'services' && <CustomerPortal />}
        {activeTab === 'worker' && <WorkerPortal />}
        {activeTab === 'coop' && <CoopAdminPortal />}
        {activeTab === 'admin' && <GovAdminPortal />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SahakarConnect</strong> • Cooperative Gig Services Platform
          </div>
          <div>
            Smart India Hackathon 2026 • Problem Statement 26089 (Ministry of Cooperation)
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
