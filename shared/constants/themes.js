/**
 * Vault Theme System
 * Each theme defines a full color palette.
 * Custom themes are generated dynamically from a user-picked accent color.
 * The ThemeContext also supports a "custom" theme slot built at runtime.
 */

/** Given a hex accent color, build a complete dark-theme color map */
export const buildThemeFromAccent = (accent, bgMode = 'dark') => {
  const bgMap = {
    dark:       { background: '#0d0d0d', surface: '#111111', surfaceElevated: '#161616' },
    darker:     { background: '#080808', surface: '#0e0e0e', surfaceElevated: '#131313' },
    pitchBlack: { background: '#000000', surface: '#0a0a0a', surfaceElevated: '#0f0f0f' },
  };
  const bg = bgMap[bgMode] || bgMap.dark;

  // Parse hex → rgb for rgba() usage
  const hex = accent.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return {
    ...bg,
    accent,
    accentRgb: `${r},${g},${b}`,
    accentLight: `rgba(${r},${g},${b},0.15)`,
    accentMid:   `rgba(${r},${g},${b},0.25)`,
    accentGlow:  `0 0 20px rgba(${r},${g},${b},0.3)`,
    accentGradient: `linear-gradient(135deg, ${accent}, rgba(${r},${g},${b},0.6))`,
    sidebarActive: `linear-gradient(90deg, rgba(${r},${g},${b},0.25) 0%, rgba(${r},${g},${b},0.05) 100%)`,
    text: '#FFFFFF',
    subtext: '#777777',
    subtextMid: '#999999',
    border: 'rgba(255,255,255,0.07)',
    borderMid: 'rgba(255,255,255,0.12)',
    success:  '#22c55e',
    warning:  '#eab308',
    error:    '#ec4899',
    info:     '#3b82f6',
    cardBorder: `rgba(${r},${g},${b},0.18)`,
    cardShadow: `0 4px 24px rgba(0,0,0,0.4)`,
    glassBg:    'rgba(255,255,255,0.03)',
    glassBorder:'rgba(255,255,255,0.08)',
  };
};

export const THEMES = {
  blackGold: {
    id: 'blackGold',
    name: 'Black & Gold',
    accent: '#D4AF37',
    bgMode: 'dark',
    preview: ['#D4AF37', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#D4AF37', 'dark'),
  },
  neonBlue: {
    id: 'neonBlue',
    name: 'Neon Blue',
    accent: '#3b82f6',
    bgMode: 'dark',
    preview: ['#3b82f6', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#3b82f6', 'dark'),
  },
  emeraldGreen: {
    id: 'emeraldGreen',
    name: 'Emerald',
    accent: '#10b981',
    bgMode: 'dark',
    preview: ['#10b981', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#10b981', 'dark'),
  },
  rosePink: {
    id: 'rosePink',
    name: 'Rose Pink',
    accent: '#ec4899',
    bgMode: 'dark',
    preview: ['#ec4899', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#ec4899', 'dark'),
  },
  violetPurple: {
    id: 'violetPurple',
    name: 'Violet',
    accent: '#8b5cf6',
    bgMode: 'dark',
    preview: ['#8b5cf6', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#8b5cf6', 'dark'),
  },
  orangeAmber: {
    id: 'orangeAmber',
    name: 'Amber',
    accent: '#f59e0b',
    bgMode: 'dark',
    preview: ['#f59e0b', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#f59e0b', 'dark'),
  },
  cyberCyan: {
    id: 'cyberCyan',
    name: 'Cyber Cyan',
    accent: '#06b6d4',
    bgMode: 'dark',
    preview: ['#06b6d4', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#06b6d4', 'dark'),
  },
  crimsonRed: {
    id: 'crimsonRed',
    name: 'Crimson',
    accent: '#ef4444',
    bgMode: 'dark',
    preview: ['#ef4444', '#0d0d0d', '#1a1a1a'],
    colors: buildThemeFromAccent('#ef4444', 'dark'),
  },
};

export const DEFAULT_THEME = 'blackGold';

/** Preset accent colors for the color picker grid */
export const ACCENT_PRESETS = [
  { color: '#D4AF37', label: 'Gold' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#10b981', label: 'Emerald' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#8b5cf6', label: 'Violet' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#06b6d4', label: 'Cyan' },
  { color: '#ef4444', label: 'Red' },
];
