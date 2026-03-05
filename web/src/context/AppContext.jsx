import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(null); // null = loading
  const [setupStep, setSetupStep] = useState(0);
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('vault-categories');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(() => {
    return localStorage.getItem('vault-default-payment') || 'UPI';
  });

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setIsConfigured(data.configured);
    } catch {
      setIsConfigured(false);
    }
  };

  const saveCategories = (cats) => {
    setCategories(cats);
    localStorage.setItem('vault-categories', JSON.stringify(cats));
  };

  const saveDefaultPayment = (method) => {
    setDefaultPaymentMethod(method);
    localStorage.setItem('vault-default-payment', method);
  };

  return (
    <AppContext.Provider value={{
      isConfigured,
      setIsConfigured,
      setupStep,
      setSetupStep,
      categories,
      saveCategories,
      defaultPaymentMethod,
      saveDefaultPayment,
      checkConfiguration,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
