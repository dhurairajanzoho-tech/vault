import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const AlertBanner = ({ alerts = [] }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!alerts.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {alerts.map((alert, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            background: alert.type === 'exceeded'
              ? 'rgba(244,67,54,0.1)' : 'rgba(255,152,0,0.1)',
            border: `1px solid ${alert.type === 'exceeded' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)'}`,
            fontSize: 13,
            color: c.text,
          }}
        >
          <span style={{ fontSize: 16 }}>{alert.type === 'exceeded' ? '🚨' : '⚠️'}</span>
          <span>{alert.message}</span>
          <div style={{
            marginLeft: 'auto',
            fontSize: 12,
            fontWeight: 700,
            color: alert.type === 'exceeded' ? '#F44336' : '#FF9800',
          }}>
            {alert.percent?.toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
};
