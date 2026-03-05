import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, buildThemeFromAccent } from '../../../shared/constants/themes.js';

const ThemeContext = createContext(null);

const camelToKebab = (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase();

/** Apply a color map to CSS custom properties on :root */
const applyColors = (colors) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${camelToKebab(key)}`, value);
  });
  root.style.setProperty('--transition-theme', '300ms ease');
  document.body.style.background = colors.background;
  document.body.style.color = colors.text;
};

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    try { return localStorage.getItem('vault-theme') || DEFAULT_THEME; } catch { return DEFAULT_THEME; }
  });
  const [customAccent, setCustomAccentState] = useState(() => {
    try { return localStorage.getItem('vault-custom-accent') || '#D4AF37'; } catch { return '#D4AF37'; }
  });
  const [bgMode, setBgModeState] = useState(() => {
    try { return localStorage.getItem('vault-bg-mode') || 'dark'; } catch { return 'dark'; }
  });
  const [fontSize, setFontSizeState] = useState(() => {
    try { return localStorage.getItem('vault-font-size') || 'default'; } catch { return 'default'; }
  });

  // Derive the active theme object
  const theme = (() => {
    if (themeId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom',
        accent: customAccent,
        bgMode,
        colors: buildThemeFromAccent(customAccent, bgMode),
      };
    }
    const base = THEMES[themeId] || THEMES[DEFAULT_THEME];
    if (bgMode !== 'dark') {
      return { ...base, bgMode, colors: buildThemeFromAccent(base.accent, bgMode) };
    }
    return base;
  })();

  // Apply CSS vars whenever theme changes
  useEffect(() => {
    applyColors(theme.colors);
  }, [theme]);

  // Font size
  useEffect(() => {
    document.body.dataset.fontSize = fontSize;
    const fontSizeMap = { compact: '13px', default: '14px', comfortable: '15px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize] || '14px');
  }, [fontSize]);

  const switchTheme = useCallback((id) => {
    if (THEMES[id]) {
      setThemeId(id);
      try { localStorage.setItem('vault-theme', id); } catch {}
    }
  }, []);

  const setAccentColor = useCallback((hex) => {
    setCustomAccentState(hex);
    setThemeId('custom');
    try {
      localStorage.setItem('vault-custom-accent', hex);
      localStorage.setItem('vault-theme', 'custom');
    } catch {}
  }, []);

  const switchBgMode = useCallback((mode) => {
    setBgModeState(mode);
    try { localStorage.setItem('vault-bg-mode', mode); } catch {}
  }, []);

  const switchFontSize = useCallback((size) => {
    setFontSizeState(size);
    try { localStorage.setItem('vault-font-size', size); } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      themeId,
      customAccent,
      bgMode,
      fontSize,
      switchTheme,
      setAccentColor,
      switchBgMode,
      switchFontSize,
      themes: THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
