import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

/* ─── SVG Icon renderer ──────────────────────────────────────────────────── */
const SvgIcon = ({ paths, size = 16, strokeWidth = 1.7 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
  >
    {(Array.isArray(paths) ? paths : [paths]).map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);

/* ─── Icon paths (Lucide-style) ─────────────────────────────────────────── */
const ICONS = {
  dashboard: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  expenses:  ['M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M18 9l-3 3 3 3'],
  income:    ['M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  sidehustle:['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
  wallet:    ['M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z', 'M16 3H8L4 7h16l-4-4z', 'M16 14h.01'],
  budget:    ['M22 12h-4l-3 9L9 3l-3 9H2'],
  recurring: ['M1 4v6h6', 'M23 20v-6h-6', 'M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15'],
  stats:     ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  settings:  [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  lock: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
};

const NAV_MAIN = [
  { path: '/',           label: 'Dashboard',   iconKey: 'dashboard' },
  { path: '/wallet',     label: 'Wallet',      iconKey: 'wallet' },
  { path: '/expenses',   label: 'Expenses',    iconKey: 'expenses' },
  { path: '/income',     label: 'Income',      iconKey: 'income' },
  { path: '/sidehustle', label: 'Side Hustle', iconKey: 'sidehustle' },
  { path: '/budget',     label: 'Budget',      iconKey: 'budget' },
];

const NAV_OTHER = [
  { path: '/recurring',  label: 'Recurring',  iconKey: 'recurring' },
  { path: '/stats',      label: 'Statistics', iconKey: 'stats' },
  { path: '/settings',   label: 'Settings',   iconKey: 'settings' },
];

/* ─── Individual Nav Item ───────────────────────────────────────────────── */
const NavItem = ({ path, label, iconKey, c }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={path}
      end={path === '/'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 10px 9px 8px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        letterSpacing: '-0.01em',
        color: isActive ? '#ffffff' : hovered ? c.subtextMid : c.subtext,
        background: isActive
          ? c.sidebarActive
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isActive
          ? `3px solid ${c.accent}`
          : '3px solid transparent',
        transition: 'all 160ms ease',
        boxShadow: isActive ? `inset 0 0 24px rgba(${c.accentRgb},0.06)` : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: 28, height: 28,
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            background: isActive
              ? `rgba(${c.accentRgb},0.2)`
              : hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
            color: isActive ? c.accent : 'inherit',
            transition: 'all 160ms ease',
            filter: isActive ? `drop-shadow(0 0 5px rgba(${c.accentRgb},0.55))` : 'none',
          }}>
            <SvgIcon paths={ICONS[iconKey]} size={15} strokeWidth={isActive ? 2 : 1.6} />
          </div>

          <span style={{ flex: 1 }}>{label}</span>

          {isActive && (
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: c.accent,
              boxShadow: `0 0 7px ${c.accent}`,
              flexShrink: 0,
            }} />
          )}
        </>
      )}
    </NavLink>
  );
};

/* ─── Sidebar ───────────────────────────────────────────────────────────── */
export const Sidebar = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const c = theme.colors;
  const [lockHover, setLockHover] = useState(false);

  return (
    <aside style={{
      width: 224,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: c.surface,
      borderRight: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: '20px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: c.accentGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, flexShrink: 0,
          boxShadow: `0 0 18px rgba(${c.accentRgb},0.45)`,
        }}>🏦</div>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 800,
            color: c.accent,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}>Vault</div>
          <div style={{
            fontSize: 9.5,
            color: c.subtext,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>Budget Planner</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {/* MAIN section */}
        <div style={{
          fontSize: 9.5, fontWeight: 700, color: c.subtext,
          letterSpacing: '0.13em', textTransform: 'uppercase',
          padding: '2px 10px 7px',
          opacity: 0.55,
        }}>MAIN</div>

        {NAV_MAIN.map(item => <NavItem key={item.path} {...item} c={c} />)}

        <div style={{ height: 1, background: c.border, margin: '10px 6px', opacity: 0.5 }} />

        {/* OTHER section */}
        <div style={{
          fontSize: 9.5, fontWeight: 700, color: c.subtext,
          letterSpacing: '0.13em', textTransform: 'uppercase',
          padding: '2px 10px 7px',
          opacity: 0.55,
        }}>OTHER</div>

        {NAV_OTHER.map(item => <NavItem key={item.path} {...item} c={c} />)}
      </nav>

      {/* ── Bottom Section ── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 10px 14px',
        borderTop: `1px solid ${c.border}`,
      }}>
        {/* Notion status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 10px',
          borderRadius: 8,
          background: `rgba(${c.accentRgb},0.07)`,
          border: `1px solid rgba(${c.accentRgb},0.14)`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: c.success,
            boxShadow: `0 0 7px ${c.success}`,
            animation: 'pulse-dot 2.5s ease infinite',
          }} />
          <style>{`
            @keyframes pulse-dot {
              0%,100%{ opacity:1; }
              50%{ opacity:0.5; }
            }
          `}</style>
          <span style={{ fontSize: 10.5, color: c.subtextMid, flex: 1 }}>Notion Connected</span>
          <span style={{
            fontSize: 9, color: c.success,
            background: `rgba(${c.accentRgb},0.1)`,
            padding: '1px 5px', borderRadius: 4,
            fontWeight: 600, letterSpacing: '0.04em',
          }}>LIVE</span>
        </div>

        {/* User card with lock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 10px',
          borderRadius: 10,
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: c.accentGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#000',
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}>V</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: c.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>My Vault</div>
            <div style={{
              fontSize: 10, color: c.subtext,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>Personal Finance</div>
          </div>
          <button
            title="Lock Vault"
            onClick={logout}
            onMouseEnter={() => setLockHover(true)}
            onMouseLeave={() => setLockHover(false)}
            style={{
              width: 26, height: 26, borderRadius: 7,
              border: `1px solid ${lockHover ? 'rgba(236,72,153,0.45)' : c.border}`,
              background: lockHover ? 'rgba(236,72,153,0.12)' : 'transparent',
              color: lockHover ? '#ec4899' : c.subtext,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms ease',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <SvgIcon paths={ICONS.lock} size={13} strokeWidth={2} />
          </button>
        </div>

        <div style={{
          textAlign: 'center', fontSize: 9.5, color: c.subtext,
          marginTop: 8, opacity: 0.4, letterSpacing: '0.06em',
        }}>v1.0.0 · Vault</div>
      </div>
    </aside>
  );
};
