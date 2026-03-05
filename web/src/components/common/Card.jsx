import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Card = ({ children, style, className, onClick, hover = true, accentTop = false }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div
      onClick={onClick}
      className={[
        'card',
        hover && onClick ? 'card-hover' : '',
        accentTop ? 'card-accent-top' : '',
        className || '',
      ].filter(Boolean).join(' ')}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, icon }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: c.accentLight,
            border: `1px solid ${c.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: c.subtext,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
          }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11.5, color: c.subtext, marginTop: 1.5, opacity: 0.7 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const StatCard = ({ label, value, sub, icon, color, style }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div className="card" style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: color ? `${color}18` : c.accentLight,
          border: `1px solid ${color ? `${color}30` : c.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700,
        color: color || c.accent,
        letterSpacing: '-0.03em',
        lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ fontSize: 11, color: c.subtext, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: c.subtext, marginTop: 5, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
};
