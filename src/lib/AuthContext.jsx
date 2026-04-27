import React, { createContext, useContext } from 'react';

// AUTH DISABLED — app is wide open. Re-enable by reverting this file
// and re-running supabase/schema.sql (which restores RLS).
const FAKE_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@local',
  full_name: 'Demo Admin',
  role: 'admin'
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const value = {
    user: FAKE_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: null,
    logout: () => {},
    navigateToLogin: () => {},
    checkAppState: () => {}
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
