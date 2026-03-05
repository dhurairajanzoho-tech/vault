import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useMobile } from '../hooks/useMobile';
import { useAuth } from '../context/AuthContext';
import { THEMES, ACCENT_PRESETS, buildThemeFromAccent } from '../../../shared/constants/themes.js';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '../../../shared/constants/categories.js';

/* ─── tiny SVG icon helper ──────────────────────────────────────────────── */
const Icon = ({ d, size = 15, sw = 1.8, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

/* ─── Section wrapper ───────────────────────────────────────────────────── */
const Section = ({ title, icon, children, c }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 20px',
          borderBottom: open ? `1px solid ${c.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: c.accentLight,
            border: `1px solid ${c.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>{icon}</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: c.text, letterSpacing: '-0.01em' }}>
            {title}
          </span>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: 'rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.subtext,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 220ms ease',
        }}>
          <Icon d="M6 9l6 6 6-6" size={13} sw={2} />
        </div>
      </button>
      {open && <div style={{ padding: '18px 20px' }}>{children}</div>}
    </div>
  );
};

/* ─── Row item inside section ───────────────────────────────────────────── */
const SettingRow = ({ label, description, action, c }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 14px', borderRadius: 10,
    background: c.surfaceElevated,
    border: `1px solid ${c.border}`,
    gap: 12,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: c.text, letterSpacing: '-0.01em' }}>{label}</div>
      {description && (
        <div style={{ fontSize: 11.5, color: c.subtext, marginTop: 2 }}>{description}</div>
      )}
    </div>
    {action}
  </div>
);

/* ─── PIN numpad (reused from auth screens) ─────────────────────────────── */
const PIN_LEN = 4;
const PinDot = ({ filled, accent, err }) => (
  <div style={{
    width: 12, height: 12, borderRadius: '50%',
    background: filled ? (err ? '#ec4899' : accent) : 'transparent',
    border: `2px solid ${filled ? (err ? '#ec4899' : accent) : 'rgba(255,255,255,0.18)'}`,
    transition: 'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
    transform: filled ? 'scale(1.15)' : 'scale(1)',
  }} />
);
const MiniNumpad = ({ pin, onKey, c }) => {
  const rows = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 14 }}>
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <PinDot key={i} filled={i < pin.length} accent={c.accent} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 8 }}>
            {row.map((key, ki) => key === '' ? (
              <div key={ki} style={{ width: 52, height: 52 }} />
            ) : (
              <button
                key={ki}
                onClick={() => onKey(key)}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: c.surfaceElevated,
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  fontSize: key === '⌫' ? 15 : 17,
                  fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 100ms ease',
                }}
                onMouseDown={e => { e.currentTarget.style.background = c.accentLight; e.currentTarget.style.borderColor = c.accent; }}
                onMouseUp={e => { e.currentTarget.style.background = c.surfaceElevated; e.currentTarget.style.borderColor = c.border; }}
                onMouseLeave={e => { e.currentTarget.style.background = c.surfaceElevated; e.currentTarget.style.borderColor = c.border; }}
              >{key}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChangePinModal = ({ onClose, c }) => {
  const { changePin, error, setError, loading } = useAuth();
  const [step, setStep] = useState('current');
  const [pins, setPins] = useState({ current: '', new: '', confirm: '' });
  const [shake, setShake] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [success, setSuccess] = useState(false);

  const activePin = pins[step];
  const setPin = (val) => setPins(p => ({ ...p, [step]: val }));
  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleKey = (val) => {
    setError(''); setMismatch(false);
    if (val === '⌫') { setPin(activePin.slice(0, -1)); return; }
    if (activePin.length >= PIN_LEN) return;
    const next = activePin + val;
    setPin(next);
    if (next.length === PIN_LEN) setTimeout(() => advance(next), 120);
  };

  const advance = async (entered) => {
    if (step === 'current') {
      setPins(p => ({ ...p, current: entered, new: '', confirm: '' }));
      setStep('new');
    } else if (step === 'new') {
      setPins(p => ({ ...p, new: entered, confirm: '' }));
      setStep('confirm');
    } else {
      if (entered !== pins.new) {
        setMismatch(true); doShake();
        setPins(p => ({ ...p, confirm: '' }));
        setTimeout(() => setMismatch(false), 600);
        return;
      }
      const ok = await changePin(pins.current, pins.new);
      if (ok) { setSuccess(true); setTimeout(onClose, 1500); }
      else { doShake(); setStep('current'); setPins({ current: '', new: '', confirm: '' }); }
    }
  };

  const labels = { current: 'Enter current PIN', new: 'Enter new PIN', confirm: 'Confirm new PIN' };
  const stepIdx = { current: 0, new: 1, confirm: 2 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: c.surface, borderRadius: 20, padding: 30,
        border: `1px solid ${c.border}`,
        width: '100%', maxWidth: 310,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        animation: 'scaleIn 220ms ease',
      }}>
        <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}} @keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px)}30%{transform:translateX(8px)}45%{transform:translateX(-5px)}60%{transform:translateX(5px)}75%{transform:translateX(-2px)}}`}</style>
        {success ? (
          <>
            <div style={{ fontSize: 44 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: c.text }}>PIN Changed!</div>
            <div style={{ fontSize: 12, color: c.subtext }}>Your new PIN is now active.</div>
          </>
        ) : (
          <>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: c.accentLight, border: `1px solid ${c.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🔑</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>Change PIN</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['current','new','confirm'].map((s, i) => (
                <div key={s} style={{
                  width: step === s ? 18 : 6, height: 6, borderRadius: 3,
                  background: i <= stepIdx[step] ? c.accent : c.border,
                  transition: 'all 280ms ease',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: c.subtext }}>{labels[step]}</div>
            <div style={{ animation: shake ? 'shake 500ms ease' : 'none', width: '100%' }}>
              <MiniNumpad pin={activePin} onKey={handleKey} c={c} />
            </div>
            <div style={{ minHeight: 18 }}>
              {(error || mismatch) && (
                <span style={{ fontSize: 11.5, color: '#ec4899', fontWeight: 500 }}>
                  {mismatch ? "PINs don't match." : error}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: c.subtext,
              fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   APPEARANCE SECTION (the big new feature)
   ═══════════════════════════════════════════════════════════ */
const AppearanceSection = ({ c }) => {
  const { theme, themeId, customAccent, bgMode, fontSize, switchTheme, setAccentColor, switchBgMode, switchFontSize } = useTheme();
  const [hexInput, setHexInput] = useState(customAccent);
  const [hexError, setHexError] = useState(false);
  const [livePreview, setLivePreview] = useState(null);
  const colorInputRef = useRef(null);

  const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  const handleHexChange = (val) => {
    setHexInput(val);
    setHexError(false);
    if (isValidHex(val)) {
      setLivePreview(val);
    }
  };

  const applyCustomColor = () => {
    const hex = hexInput.startsWith('#') ? hexInput : '#' + hexInput;
    if (isValidHex(hex)) {
      setAccentColor(hex);
      setLivePreview(null);
    } else {
      setHexError(true);
    }
  };

  const previewColor = livePreview || (themeId === 'custom' ? customAccent : (THEMES[themeId]?.accent || '#D4AF37'));
  const previewColors = buildThemeFromAccent(previewColor, bgMode);

  const BG_MODES = [
    { id: 'dark',       label: 'Dark',        bg: '#0d0d0d' },
    { id: 'darker',     label: 'Darker',      bg: '#080808' },
    { id: 'pitchBlack', label: 'Pitch Black', bg: '#000000' },
  ];
  const FONT_SIZES = [
    { id: 'compact',     label: 'Compact',     desc: '13px' },
    { id: 'default',     label: 'Default',     desc: '14px' },
    { id: 'comfortable', label: 'Comfortable', desc: '15px' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Preset Themes ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Preset Themes</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 8 }}>
          {Object.values(THEMES).map(t => {
            const isActive = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { switchTheme(t.id); setLivePreview(null); setHexInput(t.accent); }}
                style={{
                  padding: '12px 8px 10px',
                  borderRadius: 11,
                  cursor: 'pointer',
                  border: `2px solid ${isActive ? t.accent : c.border}`,
                  background: isActive ? `rgba(${buildThemeFromAccent(t.accent).accentRgb},0.08)` : c.surfaceElevated,
                  transition: 'all 180ms ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  boxShadow: isActive ? `0 0 16px rgba(${buildThemeFromAccent(t.accent).accentRgb},0.25)` : 'none',
                }}
              >
                {/* Color swatch */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: t.accent,
                  boxShadow: `0 0 10px rgba(${buildThemeFromAccent(t.accent).accentRgb},0.5)`,
                  border: '2px solid rgba(255,255,255,0.1)',
                }} />
                <div style={{
                  fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                  color: isActive ? t.accent : c.subtext,
                  textAlign: 'center', lineHeight: 1.2,
                }}>{t.name}</div>
                {isActive && (
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: t.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#000', fontWeight: 800,
                  }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick Accent Presets ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Quick Accent Colors</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ACCENT_PRESETS.map(({ color, label }) => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0,2),16);
            const g = parseInt(hex.substring(2,4),16);
            const b = parseInt(hex.substring(4,6),16);
            const isCurrent = (themeId === 'custom' && customAccent === color) ||
                              (THEMES[themeId]?.accent === color);
            return (
              <button
                key={color}
                title={label}
                data-tooltip={label}
                onClick={() => { setAccentColor(color); setHexInput(color); setLivePreview(null); }}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: color,
                  border: `3px solid ${isCurrent ? '#fff' : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: isCurrent
                    ? `0 0 0 1px ${color}, 0 0 14px rgba(${r},${g},${b},0.6)`
                    : `0 0 8px rgba(${r},${g},${b},0.35)`,
                  transition: 'all 160ms ease',
                  padding: 0,
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Custom Hex Color ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Custom Accent Color</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Native color picker */}
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: hexInput.startsWith('#') && isValidHex(hexInput) ? hexInput : c.surfaceElevated,
              border: `2px solid ${c.border}`,
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => colorInputRef.current?.click()}
          >
            <input
              ref={colorInputRef}
              type="color"
              value={hexInput.startsWith('#') && isValidHex(hexInput) ? hexInput : '#D4AF37'}
              onChange={e => { handleHexChange(e.target.value); }}
              style={{
                position: 'absolute', inset: 0,
                opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
              }}
            />
          </div>
          {/* Hex input */}
          <input
            className="input"
            value={hexInput}
            onChange={e => handleHexChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustomColor()}
            placeholder="#D4AF37"
            maxLength={7}
            style={{
              flex: 1, fontFamily: 'monospace', fontSize: 13,
              borderColor: hexError ? '#ec4899' : undefined,
            }}
          />
          <button
            onClick={applyCustomColor}
            style={{
              padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              background: c.accentLight, color: c.accent,
              border: `1px solid ${c.cardBorder}`,
              fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5,
              flexShrink: 0, transition: 'all 150ms ease',
            }}
          >Apply</button>
        </div>
        {hexError && (
          <div style={{ fontSize: 11, color: '#ec4899', marginTop: 5 }}>
            Enter a valid hex color (e.g. #3b82f6)
          </div>
        )}
      </div>

      {/* ── Live Preview Strip ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Live Preview</div>
        <div style={{
          borderRadius: 12,
          border: `1px solid ${c.border}`,
          overflow: 'hidden',
          background: previewColors.background,
        }}>
          {/* Mini sidebar */}
          <div style={{ display: 'flex', height: 80 }}>
            <div style={{
              width: 130, background: previewColors.surface,
              borderRight: `1px solid ${previewColors.border}`,
              padding: '10px 8px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {['Dashboard', 'Expenses', 'Income'].map((item, i) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 7px', borderRadius: 6, fontSize: 10,
                  color: i === 0 ? '#fff' : previewColors.subtext,
                  background: i === 0 ? previewColors.sidebarActive : 'transparent',
                  borderLeft: i === 0 ? `2px solid ${previewColors.accent}` : '2px solid transparent',
                  fontWeight: i === 0 ? 600 : 400,
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: i === 0 ? `rgba(${previewColors.accentRgb},0.25)` : 'rgba(255,255,255,0.05)',
                  }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Main area */}
            <div style={{ flex: 1, padding: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              {[
                { label: 'Revenue', pct: 0.7 },
                { label: 'Profit', pct: 0.45 },
                { label: 'Budget', pct: 0.85 },
              ].map(({ label, pct }) => (
                <div key={label} style={{
                  flex: 1, background: previewColors.surface,
                  border: `1px solid ${previewColors.cardBorder}`,
                  borderRadius: 8, padding: '8px 10px',
                }}>
                  <div style={{ fontSize: 9, color: previewColors.subtext, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 99, background: previewColors.accent }} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: previewColors.accent }}>
                    ₹{(pct * 10000).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Badge row */}
          <div style={{
            display: 'flex', gap: 6, padding: '8px 12px',
            background: previewColors.surfaceElevated,
            borderTop: `1px solid ${previewColors.border}`,
          }}>
            {[
              { label: 'Paid', bg: '#0a2e1a', border: '#22c55e', color: '#22c55e' },
              { label: 'Pending', bg: '#2e2200', border: '#eab308', color: '#eab308' },
              { label: 'Invoice', bg: '#0a1a3a', border: '#3b82f6', color: '#3b82f6' },
            ].map(b => (
              <span key={b.label} style={{
                fontSize: 9, padding: '2px 7px', borderRadius: 99,
                background: b.bg, border: `1px solid ${b.border}`, color: b.color,
                fontWeight: 600,
              }}>{b.label}</span>
            ))}
            <span style={{
              marginLeft: 'auto', fontSize: 9, fontWeight: 700,
              color: previewColors.accent,
              background: previewColors.accentLight,
              padding: '2px 7px', borderRadius: 99,
              border: `1px solid ${previewColors.cardBorder}`,
            }}>Button</span>
          </div>
        </div>
      </div>

      {/* ── Background Mode ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Background Darkness</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {BG_MODES.map(({ id, label, bg }) => {
            const isActive = bgMode === id;
            return (
              <button
                key={id}
                onClick={() => switchBgMode(id)}
                style={{
                  flex: 1, padding: '12px 8px',
                  borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isActive ? c.accent : c.border}`,
                  background: isActive ? c.accentLight : c.surfaceElevated,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 160ms ease',
                }}
              >
                <div style={{
                  width: 32, height: 20, borderRadius: 6,
                  background: bg, border: `1px solid rgba(255,255,255,0.1)`,
                }} />
                <span style={{
                  fontSize: 11.5, fontWeight: isActive ? 700 : 400,
                  color: isActive ? c.accent : c.subtext,
                }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Font Size ── */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Font Size</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {FONT_SIZES.map(({ id, label, desc }) => {
            const isActive = fontSize === id;
            return (
              <button
                key={id}
                onClick={() => switchFontSize(id)}
                style={{
                  flex: 1, padding: '11px 8px',
                  borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isActive ? c.accent : c.border}`,
                  background: isActive ? c.accentLight : c.surfaceElevated,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 160ms ease',
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isActive ? c.accent : c.text,
                }}>Aa</span>
                <span style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 400,
                  color: isActive ? c.accent : c.subtext,
                }}>{label}</span>
                <span style={{ fontSize: 10, color: c.subtext }}>{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════════════════════ */
export const Settings = () => {
  const { theme } = useTheme();
  const { defaultPaymentMethod, saveDefaultPayment } = useApp();
  const { logout, hasPin } = useAuth();
  const c = theme.colors;
  const isMobile = useMobile();

  const [notionKey, setNotionKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showChangePin, setShowChangePin] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const testConnection = async () => {
    if (!notionKey) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setTestResult({ ok: data.configured, msg: data.configured ? 'Connected successfully' : 'Not fully configured' });
    } catch {
      setTestResult({ ok: false, msg: 'Server not reachable' });
    } finally { setTesting(false); }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      {showChangePin && <ChangePinModal c={c} onClose={() => setShowChangePin(false)} />}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: '-0.03em' }}>
          Settings
        </h1>
        <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
          Personalise and configure your Vault
        </p>
      </div>

      {/* ── Appearance ── */}
      <Section title="Appearance" icon="🎨" c={c}>
        <AppearanceSection c={c} />
      </Section>

      {/* ── Notion Connection ── */}
      <Section title="Notion Connection" icon="🔌" c={c}>
        <p style={{ fontSize: 13, color: c.subtext, marginBottom: 16, lineHeight: 1.65 }}>
          To reconnect or update your Notion API key, update your server's{' '}
          <code style={{
            background: c.surfaceElevated, padding: '2px 7px',
            borderRadius: 5, fontSize: 11.5,
            border: `1px solid ${c.border}`, fontFamily: 'monospace',
          }}>.env</code>{' '}file and restart.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Enter Notion API key to test…"
            value={notionKey}
            onChange={e => setNotionKey(e.target.value)}
            type="password"
          />
          <button
            onClick={testConnection}
            disabled={testing || !notionKey}
            className="btn btn-accent-ghost"
            style={{ flexShrink: 0 }}
          >
            {testing ? (
              <span className="spin" style={{ display: 'inline-block', fontSize: 14 }}>⟳</span>
            ) : '🧪'} Test
          </button>
        </div>
        {testResult && (
          <div style={{
            marginTop: 10, padding: '10px 14px', borderRadius: 10,
            background: testResult.ok ? 'rgba(34,197,94,0.08)' : 'rgba(236,72,153,0.08)',
            border: `1px solid ${testResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(236,72,153,0.3)'}`,
            color: testResult.ok ? '#22c55e' : '#ec4899',
            fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {testResult.ok ? '✓' : '✕'} {testResult.msg}
          </div>
        )}
      </Section>

      {/* ── Default Payment ── */}
      <Section title="Default Payment Method" icon="💳" c={c}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PAYMENT_METHODS.map(method => {
            const isActive = defaultPaymentMethod === method;
            return (
              <button
                key={method}
                onClick={() => saveDefaultPayment(method)}
                style={{
                  padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isActive ? c.accent : c.border}`,
                  background: isActive ? c.accentLight : c.surfaceElevated,
                  color: isActive ? c.accent : c.subtext,
                  fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 700 : 400,
                  transition: 'all 150ms ease',
                  boxShadow: isActive ? `0 0 12px ${c.accentLight}` : 'none',
                }}
              >
                {method}{isActive && ' ✓'}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Security ── */}
      <Section title="Security" icon="🔐" c={c}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {hasPin && (
            <SettingRow
              c={c}
              label="Change PIN"
              description="Update your 4-digit security PIN"
              action={
                <button
                  onClick={() => setShowChangePin(true)}
                  className="btn btn-accent-ghost btn-sm"
                >Change</button>
              }
            />
          )}

          <div style={{
            padding: '11px 14px', borderRadius: 10,
            background: c.surfaceElevated, border: `1px solid ${c.border}`,
            fontSize: 12.5, color: c.subtext, lineHeight: 1.6,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>🕐</span>
            <span>
              Sessions last <strong style={{ color: c.text }}>24 hours</strong>. After that you'll be prompted to re-enter your PIN.
            </span>
          </div>

          {/* Lock Vault */}
          <SettingRow
            c={c}
            label={<span style={{ color: '#ec4899' }}>Lock Vault</span>}
            description="End your session — you'll need your PIN to get back in"
            action={
              logoutConfirm ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setLogoutConfirm(false)}
                    className="btn btn-ghost btn-sm"
                  >Cancel</button>
                  <button
                    onClick={logout}
                    style={{
                      padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                      border: 'none', background: '#ec4899',
                      color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 12,
                    }}
                  >Lock</button>
                </div>
              ) : (
                <button
                  onClick={() => setLogoutConfirm(true)}
                  className="btn btn-danger btn-sm"
                >🔒 Lock</button>
              )
            }
          />
        </div>
      </Section>

      {/* ── Categories ── */}
      <Section title="Categories" icon="🏷️" c={c}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {DEFAULT_CATEGORIES.map(cat => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 99,
              background: `${cat.color}18`,
              border: `1px solid ${cat.color}40`,
              fontSize: 12.5, color: cat.color, fontWeight: 500,
            }}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
        <p style={{ color: c.subtext, fontSize: 11.5, marginTop: 12 }}>
          Custom categories can be added in a future update.
        </p>
      </Section>

      {/* ── About ── */}
      <div style={{
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 14, padding: 24, textAlign: 'center',
        marginBottom: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
          background: theme.colors.accentGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          boxShadow: `0 0 24px rgba(${c.accentRgb},0.4)`,
        }}>🏦</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: c.accent, letterSpacing: '-0.03em' }}>Vault</div>
        <div style={{ fontSize: 12.5, color: c.subtext, marginTop: 4 }}>Personal Budget Planner v1.0.0</div>
        <div style={{ fontSize: 11.5, color: c.subtext, marginTop: 8, opacity: 0.7 }}>
          Powered by Notion API · Built with React + Express
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 12, padding: '5px 12px', borderRadius: 99,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          fontSize: 11.5, color: '#22c55e',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e', animation: 'pulse-dot 2s ease infinite' }} />
          System operational
        </div>
      </div>
    </div>
  );
};
