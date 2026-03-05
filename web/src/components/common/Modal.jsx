import React, { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Modal = ({ isOpen, onClose, title, children, width = 520 }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.surface,
          border: `1px solid ${c.cardBorder}`,
          borderRadius: 20,
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 250ms ease',
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${c.accentLight}`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${c.border}`,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: c.subtext, fontSize: 20, lineHeight: 1, padding: 4,
              borderRadius: 6, transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = c.text}
            onMouseLeave={e => e.currentTarget.style.color = c.subtext}
          >✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
