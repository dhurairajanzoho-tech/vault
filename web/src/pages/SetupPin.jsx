import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

const PIN_LENGTH = 4;

const PinDot = ({ filled, accent, error }) => (
  <div style={{
    width: 16, height: 16, borderRadius: '50%',
    background: filled ? (error ? '#F44336' : accent) : 'transparent',
    border: `2px solid ${filled ? (error ? '#F44336' : accent) : 'rgba(255,255,255,0.2)'}`,
    transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: filled ? 'scale(1.15)' : 'scale(1)',
  }} />
);

const NumKey = ({ value, onClick, accent, surface }) => (
  <button
    onClick={() => onClick(value)}
    style={{
      width: 72, height: 72, borderRadius: '50%',
      background: surface, border: `1px solid rgba(255,255,255,0.08)`,
      color: '#fff', fontSize: value === '⌫' ? 22 : 24,
      fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      transition: 'all 120ms ease',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1, userSelect: 'none',
    }}
    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.background = accent + '33'; }}
    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = surface; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = surface; }}
  >
    {value}
  </button>
);

export const SetupPin = ({ onComplete }) => {
  const { theme } = useTheme();
  const { setupPin, error, setError, loading } = useAuth();
  const c = theme.colors;

  const [step, setStep] = useState('create'); // 'create' | 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('⌫');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pin, step, firstPin]);

  const handleKey = (val) => {
    setError('');
    setMismatch(false);
    if (val === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      const next = pin + val;
      setPin(next);
      if (next.length === PIN_LENGTH) {
        setTimeout(() => advance(next), 120);
      }
    }
  };

  const advance = async (entered) => {
    if (step === 'create') {
      setFirstPin(entered);
      setPin('');
      setStep('confirm');
    } else {
      // Confirm step
      if (entered !== firstPin) {
        setMismatch(true);
        setShake(true);
        setPin('');
        setTimeout(() => { setShake(false); setMismatch(false); }, 600);
        return;
      }
      await setupPin(entered);
      if (onComplete) onComplete();
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
      minHeight: '100vh', background: c.background,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', padding: 20,
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
          marginBottom: 20,
          boxShadow: `0 0 40px ${c.accent}22`,
        }}>
          <Lock size={36} color={c.accent} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text, marginBottom: 6, letterSpacing: '-0.02em' }}>
          {step === 'create' ? 'Set Your PIN' : 'Confirm PIN'}
        </h1>
        <p style={{ color: c.subtext, fontSize: 14, marginBottom: 10, textAlign: 'center', lineHeight: 1.5 }}>
          {step === 'create'
            ? 'Choose a 4-digit PIN to protect your Vault'
            : 'Enter the same PIN again to confirm'}
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {['create', 'confirm'].map((s, i) => (
            <div key={s} style={{
              width: step === s ? 24 : 8, height: 8, borderRadius: 4,
              background: step === s ? c.accent : c.border,
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>

        {/* PIN dots */}
        <div style={{
          display: 'flex', gap: 20, marginBottom: 16,
          animation: shake ? 'shake 500ms ease' : 'none',
        }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <PinDot key={i} filled={i < pin.length} accent={c.accent} error={mismatch} />
          ))}
        </div>

        {/* Message */}
        <div style={{ height: 28, display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          {mismatch ? (
            <span style={{ fontSize: 13, color: '#F44336', fontWeight: 500 }}>
              PINs don't match. Try again.
            </span>
          ) : error ? (
            <span style={{ fontSize: 13, color: '#F44336', fontWeight: 500 }}>{error}</span>
          ) : step === 'confirm' ? (
            <span style={{ fontSize: 13, color: c.subtext }}>Re-enter your PIN</span>
          ) : null}
        </div>

        {/* Numpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
          {numpad.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 20 }}>
              {row.map((key, ki) => (
                key === '' ? (
                  <div key={ki} style={{ width: 72, height: 72 }} />
                ) : (
                  <NumKey key={ki} value={key} onClick={handleKey} accent={c.accent} surface={c.surfaceElevated} />
                )
              ))}
            </div>
          ))}
        </div>

        {step === 'confirm' && (
          <button
            onClick={() => { setStep('create'); setPin(''); setFirstPin(''); }}
            style={{
              marginTop: 24, background: 'transparent', border: 'none',
              color: c.subtext, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', textDecoration: 'underline',
            }}
          >
            ← Start over
          </button>
        )}

        {loading && (
          <div style={{ marginTop: 20, color: c.subtext, fontSize: 13 }}>Setting up...</div>
        )}
      </div>
    </div>
  );
};
