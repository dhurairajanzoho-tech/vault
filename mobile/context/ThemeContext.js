import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEMES = {
  blackGold: {
    id: 'blackGold',
    name: 'Black & Gold',
    colors: {
      background: '#0A0A0A',
      surface: '#141414',
      surfaceElevated: '#1C1C1C',
      accent: '#D4AF37',
      accentLight: 'rgba(212,175,55,0.15)',
      text: '#FFFFFF',
      subtext: '#888888',
      border: '#2A2A2A',
      cardBorder: 'rgba(212,175,55,0.2)',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
    preview: ['#0A0A0A', '#D4AF37'],
  },
  purpleRoseGold: {
    id: 'purpleRoseGold',
    name: 'Purple & Rose Gold',
    colors: {
      background: '#0D0A14',
      surface: '#1A1525',
      surfaceElevated: '#221C30',
      accent: '#C9A96E',
      accentLight: 'rgba(201,169,110,0.15)',
      secondary: '#7B2FBE',
      text: '#FFFFFF',
      subtext: '#9D8BB0',
      border: '#2E2640',
      cardBorder: 'rgba(201,169,110,0.2)',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
    preview: ['#0D0A14', '#C9A96E', '#7B2FBE'],
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState('blackGold');

  useEffect(() => {
    AsyncStorage.getItem('vault-theme').then(saved => {
      if (saved && THEMES[saved]) setThemeId(saved);
    });
  }, []);

  const switchTheme = async (id) => {
    if (THEMES[id]) {
      setThemeId(id);
      await AsyncStorage.setItem('vault-theme', id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeId], themeId, switchTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
