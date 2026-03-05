import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Income } from './pages/Income';
import { Budget } from './pages/Budget';
import { Recurring } from './pages/Recurring';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { SideHustle } from './pages/SideHustle';
import { Wallet } from './pages/Wallet';
import { Onboarding } from './pages/Onboarding';
import { LoginScreen } from './pages/LoginScreen';
import { SetupPin } from './pages/SetupPin';
import './styles/globals.css';

/** Full-screen loading spinner shown while auth/app state is resolving */
const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-background)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
      <div style={{
        fontSize: 24, fontWeight: 800, color: 'var(--color-accent)',
        letterSpacing: '-0.02em',
      }}>Vault</div>
      <div style={{
        width: 40, height: 4, background: 'var(--color-accent)',
        borderRadius: 2, margin: '16px auto 0',
        animation: 'loading 1s ease infinite',
      }} />
    </div>
    <style>{`
      @keyframes loading {
        0%, 100% { opacity: 1; transform: scaleX(1); }
        50% { opacity: 0.5; transform: scaleX(0.5); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

/** Main app routes — only rendered when user is authenticated */
const MainApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="income" element={<Income />} />
        <Route path="budget" element={<Budget />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="sidehustle" element={<SideHustle />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="stats" element={<Stats />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

/**
 * Auth gate: sits between ThemeProvider and the main app.
 * Decides which screen to show based on auth + app state.
 *
 * Decision tree:
 *  isConfigured === null  → LoadingScreen  (app config still loading)
 *  isAuthenticated === null → LoadingScreen (auth state still loading)
 *  !isConfigured          → Onboarding     (first-time setup)
 *  !hasPin                → SetupPin       (app configured but no PIN yet)
 *  !isAuthenticated       → LoginScreen    (PIN set, session expired)
 *  else                   → MainApp        (fully authenticated)
 */
const AppGate = () => {
  const { isConfigured } = useApp();
  const { isAuthenticated, hasPin } = useAuth();

  // Still resolving either app config or auth session
  if (isConfigured === null || isAuthenticated === null) {
    return <LoadingScreen />;
  }

  // First-time setup — Notion databases not configured yet
  if (!isConfigured) {
    return <Onboarding />;
  }

  // App is configured but no PIN has been set yet
  if (!hasPin) {
    return <SetupPin onComplete={() => {/* AuthContext auto-logs in after setupPin */}} />;
  }

  // PIN exists but session is expired / logged out
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // All good — show the main dashboard
  return <MainApp />;
};

const App = () => (
  <ThemeProvider>
    <AppProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </AppProvider>
  </ThemeProvider>
);

export default App;
