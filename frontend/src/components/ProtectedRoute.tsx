import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/auth';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. If not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in but role not allowed, redirect to user's role-specific main page
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'WORKER') {
      return <Navigate to="/worker" replace />;
    } else if (user.role === 'COOP_ADMIN') {
      return <Navigate to="/coop" replace />;
    } else if (user.role === 'GOV_ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/services" replace />;
    }
  }

  // 3. User is logged in and authorized
  return children;
};

export default ProtectedRoute;
