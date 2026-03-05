import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ILLUSTRATIONS = {
  expenses: (color) => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <rect x="20" y="20" width="80" height="60" rx="8" fill={`${color}22`} stroke={`${color}44`} strokeWidth="1.5"/>
      <rect x="30" y="35" width="40" height="6" rx="3" fill={`${color}55`}/>
      <rect x="30" y="48" width="60" height="4" rx="2" fill={`${color}33`}/>
      <rect x="30" y="58" width="50" height="4" rx="2" fill={`${color}33`}/>
      <circle cx="95" cy="25" r="14" fill={`${color}33`} stroke={`${color}66`} strokeWidth="1.5"/>
      <text x="95" y="30" textAnchor="middle" fontSize="14" fill={color}>?</text>
    </svg>
  ),
  income: (color) => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <circle cx="60" cy="50" r="35" fill={`${color}22`} stroke={`${color}44`} strokeWidth="1.5"/>
      <text x="60" y="57" textAnchor="middle" fontSize="28" fill={color}>₹</text>
      <path d="M45 75 Q60 85 75 75" stroke={`${color}66`} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  stats: (color) => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <rect x="15" y="60" width="16" height="25" rx="3" fill={`${color}55`}/>
      <rect x="38" y="45" width="16" height="40" rx="3" fill={`${color}77`}/>
      <rect x="61" y="30" width="16" height="55" rx="3" fill={`${color}99`}/>
      <rect x="84" y="50" width="16" height="35" rx="3" fill={`${color}66`}/>
      <line x1="10" y1="88" x2="110" y2="88" stroke={`${color}44`} strokeWidth="1.5"/>
    </svg>
  ),
  budget: (color) => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <circle cx="60" cy="50" r="30" fill="none" stroke={`${color}33`} strokeWidth="12"/>
      <circle cx="60" cy="50" r="30" fill="none" stroke={`${color}88`} strokeWidth="12" strokeDasharray="60 130" strokeLinecap="round" transform="rotate(-90 60 50)"/>
      <text x="60" y="55" textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>Set limits</text>
    </svg>
  ),
};

export const EmptyState = ({ type = 'expenses', title, message, action }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const defaultMessages = {
    expenses: { title: 'No expenses yet', message: 'Start tracking by adding your first expense.' },
    income: { title: 'No income entries', message: 'Add income entries to track your earnings.' },
    stats: { title: 'No data to show', message: 'Add some expenses and income to see statistics.' },
    budget: { title: 'No budget limits set', message: 'Set monthly limits to control your spending.' },
  };

  const msg = defaultMessages[type] || defaultMessages.expenses;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: 16,
      opacity: 0.8,
    }}>
      {ILLUSTRATIONS[type]?.(c.accent)}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: c.text, marginBottom: 6 }}>
          {title || msg.title}
        </div>
        <div style={{ fontSize: 13, color: c.subtext, maxWidth: 280, lineHeight: 1.5 }}>
          {message || msg.message}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8,
            background: c.accent,
            color: '#000',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
