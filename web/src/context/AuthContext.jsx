import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const AUTH_KEY = 'vault-auth-pin';         // hashed PIN stored here
const SESSION_KEY = 'vault-session';       // session token (expires in 24h)
const SESSION_TTL = 24 * 60 * 60 * 1000;  // 24 hours in ms

/** Simple deterministic hash (not cryptographic, good enough for local PIN) */
const hashPin = async (pin) => {
  const encoder = new TextEncoder();
  const data = encoder.encode('vault_salt_2024_' + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/** Generate a random session token */
const generateToken = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider = ({ children }) => {
  // null = loading, true = logged in, false = logged out
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasPin, setHasPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const storedPin = localStorage.getItem(AUTH_KEY);
    setHasPin(!!storedPin);

    if (!storedPin) {
      // No PIN set yet → user goes to onboarding/setup PIN
      setIsAuthenticated(false);
      return;
    }

    // Check if session is still valid
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (session && session.token && Date.now() < session.expiresAt) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        localStorage.removeItem(SESSION_KEY);
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  /** Set a new PIN (first time or change) */
  const setupPin = useCallback(async (pin) => {
    setLoading(true);
    setError('');
    try {
      const hashed = await hashPin(pin);
      localStorage.setItem(AUTH_KEY, hashed);

      // Auto-login after setup
      const token = generateToken();
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        token,
        expiresAt: Date.now() + SESSION_TTL,
      }));

      setHasPin(true);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Failed to set PIN. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Login with PIN */
  const login = useCallback(async (pin) => {
    setLoading(true);
    setError('');
    try {
      const storedHash = localStorage.getItem(AUTH_KEY);
      if (!storedHash) {
        setError('No PIN set. Please set up a PIN first.');
        return false;
      }

      const inputHash = await hashPin(pin);
      if (inputHash !== storedHash) {
        setError('Incorrect PIN. Try again.');
        return false;
      }

      // Create new session
      const token = generateToken();
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        token,
        expiresAt: Date.now() + SESSION_TTL,
      }));

      setIsAuthenticated(true);
      setError('');
      return true;
    } catch (err) {
      setError('Login failed. Try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Logout */
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  /** Change PIN */
  const changePin = useCallback(async (currentPin, newPin) => {
    setLoading(true);
    setError('');
    try {
      const storedHash = localStorage.getItem(AUTH_KEY);
      const currentHash = await hashPin(currentPin);
      if (currentHash !== storedHash) {
        setError('Current PIN is incorrect.');
        return false;
      }
      await setupPin(newPin);
      return true;
    } catch {
      setError('Failed to change PIN.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setupPin]);

  /** Remove PIN entirely (disable auth) */
  const removePin = useCallback(async (currentPin) => {
    const storedHash = localStorage.getItem(AUTH_KEY);
    const hash = await hashPin(currentPin);
    if (hash !== storedHash) {
      setError('Incorrect PIN.');
      return false;
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SESSION_KEY);
    setHasPin(false);
    setIsAuthenticated(true); // keep logged in but no pin
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      hasPin,
      error,
      loading,
      setError,
      login,
      logout,
      setupPin,
      changePin,
      removePin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
