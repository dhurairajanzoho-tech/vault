import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const PIN_LENGTH = 4;

/** Single dot indicator */
const PinDot = ({ filled, accent }) => (
  <div style={{
    width: 16, height: 16, borderRadius: '50%',
    background: filled ? accent : 'transparent',
    border: `2px solid ${filled ? accent : 'rgba(255,255,255,0.2)'}`,
    transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: filled ? 'scale(1.15)' : 'scale(1)',
  }} />
);

/** Numpad key */
const NumKey = ({ value, onClick, accent, surface }) => (
  <button
    onClick={() => onClick(value)}
    style={{
      width: 72, height: 72, borderRadius: '50%',
      background: surface,
      border: `1px solid rgba(255,255,255,0.08)`,
      color: '#fff',
      fontSize: value === '⌫' ? 22 : 24,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      transition: 'all 120ms ease',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      lineHeight: 1,
      userSelect: 'none',
    }}
    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.background = accent + '33'; }}
    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = surface; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = surface; }}
  >
    <span>{value}</span>
    {value === '1' && <span style={{ fontSize: 9, opacity: 0, letterSpacing: 1 }}>   </span>}
    {value === '2' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>ABC</span>}
    {value === '3' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>DEF</span>}
    {value === '4' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>GHI</span>}
    {value === '5' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>JKL</span>}
    {value === '6' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>MNO</span>}
    {value === '7' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>PQRS</span>}
    {value === '8' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>TUV</span>}
    {value === '9' && <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1 }}>WXYZ</span>}
  </button>
);

export const LoginScreen = () => {
  const { theme } = useTheme();
  const { login, error, setError, loading } = useAuth();
  const c = theme.colors;

  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('⌫');
      if (e.key === 'Enter' && pin.length === PIN_LENGTH) handleSubmit(pin);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pin]);

  const handleKey = (val) => {
    setError('');
    if (val === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      const next = pin + val;
      setPin(next);
      if (next.length === PIN_LENGTH) {
        // Auto-submit when 4 digits entered
        setTimeout(() => handleSubmit(next), 120);
      }
    }
  };

  const handleSubmit = async (pinVal) => {
    const ok = await login(pinVal);
    if (!ok) {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const numpad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: c.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: 20,
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-10px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: 'fadeSlideUp 400ms ease forwards',
        width: '100%', maxWidth: 340,
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: `linear-gradient(135deg, ${c.accent}22, ${c.accent}44)`,
          border: `1px solid ${c.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 20,
          boxShadow: `0 0 40px ${c.accent}22`,
        }}>
          🏦
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 800, color: c.accent,
          letterSpacing: '-0.02em', marginBottom: 6,
        }}>Vault</h1>
        <p style={{ color: c.subtext, fontSize: 14, marginBottom: 40 }}>
          Enter your PIN to continue
        </p>

        {/* PIN dots */}
        <div style={{
          display: 'flex', gap: 20, marginBottom: 16,
          animation: shake ? 'shake 500ms ease' : 'none',
        }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <PinDot key={i} filled={i < pin.length} accent={c.accent} />
          ))}
        </div>

        {/* Error */}
        <div style={{
          height: 24, display: 'flex', alignItems: 'center', marginBottom: 32,
        }}>
          {error && (
            <span style={{
              fontSize: 13, color: '#F44336', fontWeight: 500,
              animation: 'fadeSlideUp 200ms ease',
            }}>
              {error}
            </span>
          )}
        </div>

        {/* Numpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          {numpad.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 20 }}>
              {row.map((key, ki) => (
                key === '' ? (
                  <div key={ki} style={{ width: 72, height: 72 }} />
                ) : (
                  <NumKey
                    key={ki}
                    value={key}
                    onClick={handleKey}
                    accent={c.accent}
                    surface={c.surfaceElevated}
                  />
                )
              ))}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div style={{ marginTop: 24, color: c.subtext, fontSize: 13 }}>
            Verifying...
          </div>
        )}
      </div>
    </div>
  );
};
