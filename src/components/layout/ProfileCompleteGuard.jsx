import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useMyProfile from '@/hooks/useMyProfile';
import { useAuth } from '@/lib/AuthContext';

// Routes that are accessible even with an incomplete profile
const EXEMPT_PATHS = ['/my-profile', '/onboarding', '/support'];

export default function ProfileCompleteGuard({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const { profile, isLoading } = useMyProfile();
  const location = useLocation();

  if (isLoadingAuth || isLoading) return null;

  // Not authenticated → go to landing page, not onboarding
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isExempt = EXEMPT_PATHS.some(path => location.pathname.startsWith(path));

  // No profile at all → send to onboarding
  if (!isExempt && !profile) {
    return <Navigate to="/onboarding" replace />;
  }

  // Profile exists but missing required fields → send to my-profile to finish
  if (!isExempt && profile && (!profile.display_name || !profile.gender)) {
    return <Navigate to="/my-profile" replace />;
  }

  return children;
}