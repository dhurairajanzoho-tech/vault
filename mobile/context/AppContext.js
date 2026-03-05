import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const API_URL_KEY = 'vault-api-url';
const DEFAULT_API_URL = 'http://localhost:3001';

export const AppProvider = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(null);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('UPI');

  useEffect(() => {
    (async () => {
      const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
      if (savedUrl) setApiUrl(savedUrl);
      const payment = await AsyncStorage.getItem('vault-default-payment');
      if (payment) setDefaultPaymentMethod(payment);
      checkConfig(savedUrl || DEFAULT_API_URL);
    })();
  }, []);

  const checkConfig = async (url = apiUrl) => {
    try {
      const res = await fetch(`${url}/api/setup/status`);
      const data = await res.json();
      setIsConfigured(data.configured);
    } catch {
      setIsConfigured(false);
    }
  };

  const saveApiUrl = async (url) => {
    setApiUrl(url);
    await AsyncStorage.setItem(API_URL_KEY, url);
    await checkConfig(url);
  };

  const saveDefaultPayment = async (method) => {
    setDefaultPaymentMethod(method);
    await AsyncStorage.setItem('vault-default-payment', method);
  };

  return (
    <AppContext.Provider value={{
      isConfigured, setIsConfigured, apiUrl, saveApiUrl,
      defaultPaymentMethod, saveDefaultPayment, checkConfig,
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
