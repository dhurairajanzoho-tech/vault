import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../../../shared/hooks/useExpenses.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { getMonthKey, getLastSixMonths, getMonthLabel } from '../../../shared/utils/dateUtils.js';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';
import { WORK_SALARY_AMOUNT } from '../../../shared/constants/categories.js';

// ── API ────────────────────────────────────────────────────────────────────────

const API_BASE = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
    return import.meta.env.VITE_API_URL;
  return 'http://localhost:3001';
})();

const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`).then(r => {
    if (!r.ok) throw new Error(`Server error ${r.status}`);
    return r.json();
  });

// ── localStorage helpers ──────────────────────────────────────────────────────

const storageKey = (month) => `vault:wallet:transfers:${month}`;

const loadTransfers = (month) => {
  try { return JSON.parse(localStorage.getItem(storageKey(month)) || '[]'); }
  catch { return []; }
};

const saveTransfers = (month, transfers) =>
  localStorage.setItem(storageKey(month), JSON.stringify(transfers));

// ── Month Pill ────────────────────────────────────────────────────────────────

const MonthPill = ({ m, isActive, onClick, c }) => (
  <button onClick={() => onClick(m.key)} style={{
    padding: '6px 15px', borderRadius: 20, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: isActive ? 700 : 400,
    background: isActive
      ? `linear-gradient(135deg, ${c.accent}28, ${c.accent}10)`
      : c.surfaceElevated,
    color: isActive ? c.accent : c.subtext,
    border: isActive ? `1.5px solid ${c.accent}` : `1.5px solid ${c.cardBorder}`,
    transition: 'all 150ms ease', flexShrink: 0,
    boxShadow: isActive ? `0 0 14px ${c.accent}30` : 'none',
  }}>{m.short}</button>
);

// ── Transfer Modal ────────────────────────────────────────────────────────────

const TransferModal = ({ onClose, onConfirm, shProfit, c }) => {
  const [amount, setAmount] = useState(String(shProfit > 0 ? shProfit : ''));
  const [note, setNote]     = useState('');

  const valid = parseFloat(amount) > 0;

  const inputStyle = {
    width: '100%', background: c.surfaceElevated,
    border: `1px solid ${c.border}`, borderRadius: 10,
    color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 14, padding: '10px 12px', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: c.surface, borderRadius: 16,
        padding: 24, width: 340,
        border: `1px solid ${c.border}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: c.text, marginBottom: 4 }}>
          💸 Transfer to Wallet
        </div>
        <div style={{ fontSize: 12, color: c.subtext, marginBottom: 20 }}>
          Side hustle balance: <strong style={{ color: '#7B2FBE' }}>{formatCurrency(shProfit)}</strong>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6 }}>
            Amount (₹)
          </label>
          <input
            type="number" autoFocus
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: c.subtext, display: 'block', marginBottom: 6 }}>
            Note (optional)
          </label>
          <input
            type="text"
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Reel cover income"
            style={{ ...inputStyle, fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 10, borderRadius: 10,
            border: `1px solid ${c.border}`, background: 'transparent',
            color: c.subtext, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
          }}>Cancel</button>
          <button
            onClick={() => valid && onConfirm(parseFloat(amount), note.trim())}
            disabled={!valid}
            style={{
              flex: 2, padding: 10, borderRadius: 10, border: 'none',
              background: valid ? 'linear-gradient(135deg, #7B2FBE, #9c3feb)' : c.border,
              color: valid ? '#fff' : c.subtext,
              cursor: valid ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
              transition: 'all 150ms ease',
            }}>
            💸 Add to Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export const Wallet = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const months        = getLastSixMonths();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [transfers, setTransfers]         = useState([]);
  const [showModal, setShowModal]         = useState(false);
  const [shData, setShData]               = useState(null);
  const [shLoading, setShLoading]         = useState(true);

  const { expenses, totalSpent, loading: expLoading } = useExpenses(selectedMonth);

  // Load transfers from localStorage when month changes
  useEffect(() => {
    setTransfers(loadTransfers(selectedMonth));
  }, [selectedMonth]);

  // Fetch side hustle data for selected month
  const fetchSH = useCallback(async () => {
    setShLoading(true);
    try {
      const data = await apiFetch(`/api/sidehustle?month=${selectedMonth}`);
      setShData(data);
    } catch {
      setShData(null);
    } finally {
      setShLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchSH(); }, [fetchSH]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const salary           = WORK_SALARY_AMOUNT;               // ₹10,000
  const transferredTotal = transfers.reduce((s, t) => s + t.amount, 0);
  const walletTotal      = salary + transferredTotal;
  const walletBalance    = walletTotal - totalSpent;
  const spentPercent     = walletTotal > 0
    ? Math.min((totalSpent / walletTotal) * 100, 100) : 0;

  const shProfit      = shData?.summary?.totalProfit || 0;
  const shWorkCount   = shData?.summary?.totalWorks  || 0;
  const shAvailable   = Math.max(0, shProfit - transferredTotal);

  const loading = expLoading || shLoading;

  const monthDate  = new Date(selectedMonth + '-15');
  const monthLabel = getMonthLabel(monthDate);

  const balanceColor    = walletBalance >= 0 ? '#4CAF50' : '#F44336';
  const barColor        = spentPercent > 85 ? '#F44336' : spentPercent > 60 ? '#FF9800' : '#4CAF50';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTransfer = (amount, note) => {
    const t = {
      id:   Date.now().toString(),
      amount,
      note: note || 'From Side Hustle',
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...transfers, t];
    setTransfers(updated);
    saveTransfers(selectedMonth, updated);
    setShowModal(false);
  };

  const removeTransfer = (id) => {
    const updated = transfers.filter(t => t.id !== id);
    setTransfers(updated);
    saveTransfers(selectedMonth, updated);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>
          💳 Wallet
        </h1>
        <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
          {monthLabel} · Main income balance
        </p>
      </div>

      {/* Month Selector */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        padding: '2px 0 6px', marginBottom: 20, scrollbarWidth: 'none',
      }}>
        {months.map(m => (
          <MonthPill key={m.key} m={m} isActive={m.key === selectedMonth}
            onClick={setSelectedMonth} c={c} />
        ))}
      </div>

      {/* Main Wallet Card */}
      {loading ? (
        <CardSkeleton style={{ marginBottom: 16, height: 200 }} />
      ) : (
        <Card style={{ marginBottom: 16 }}>
          {/* Balance */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: c.subtext,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
            }}>
              💳 Main Wallet Balance
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: balanceColor,
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {formatCurrency(walletBalance)}
            </div>
            {walletBalance < 0 && (
              <div style={{ fontSize: 12, color: '#F44336', marginTop: 5, fontWeight: 600 }}>
                ⚠️ Overspent this month
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 22 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: c.subtext, marginBottom: 5,
            }}>
              <span>₹0</span>
              <span style={{ fontWeight: 600, color: spentPercent > 85 ? '#F44336' : c.subtext }}>
                {spentPercent.toFixed(0)}% used
              </span>
              <span>{formatCurrency(walletTotal)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: c.border, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, background: barColor,
                width: `${spentPercent}%`, transition: 'width 600ms ease',
              }} />
            </div>
          </div>

          {/* Breakdown mini cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: transferredTotal > 0 ? 'repeat(3, 1fr)' : '1fr 1fr',
            gap: 10,
          }}>
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: c.surfaceElevated, border: `1px solid ${c.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                Salary
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.accent }}>
                {formatCurrency(salary)}
              </div>
            </div>

            {transferredTotal > 0 && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.2)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                  + Side Hustle
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4CAF50' }}>
                  {formatCurrency(transferredTotal)}
                </div>
              </div>
            )}

            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(244,67,54,0.08)', border: '1px solid rgba(244,67,54,0.2)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                Spent
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F44336' }}>
                −{formatCurrency(totalSpent)}
              </div>
              <div style={{ fontSize: 10, color: c.subtext, marginTop: 2 }}>
                {expenses.length} transactions
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Side Hustle Pocket */}
      {!shLoading && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: c.subtext,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
              }}>
                💼 Side Hustle Pocket
              </div>
              <div style={{
                fontSize: 32, fontWeight: 800,
                color: shProfit > 0 ? '#7B2FBE' : c.subtext,
              }}>
                {formatCurrency(shProfit)}
              </div>
              <div style={{ fontSize: 12, color: c.subtext, marginTop: 4 }}>
                {shWorkCount} {shWorkCount === 1 ? 'work' : 'works'} this month
                {transferredTotal > 0 && (
                  <span style={{ color: '#4CAF50', marginLeft: 6, fontWeight: 600 }}>
                    · {formatCurrency(transferredTotal)} moved to wallet
                  </span>
                )}
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              {shAvailable > 0 ? (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #7B2FBE, #9c3feb)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    padding: '10px 18px', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 4px 14px rgba(123,47,190,0.4)',
                    whiteSpace: 'nowrap', transition: 'all 150ms ease',
                  }}>
                  💸 Add {formatCurrency(shAvailable)} to Wallet
                </button>
              ) : shProfit > 0 ? (
                <div style={{
                  fontSize: 12, color: '#4CAF50', fontWeight: 700,
                  padding: '8px 14px', borderRadius: 10,
                  background: 'rgba(76,175,80,0.1)',
                  border: '1px solid rgba(76,175,80,0.25)',
                }}>
                  ✓ All added to wallet
                </div>
              ) : (
                <div style={{
                  fontSize: 12, color: c.subtext,
                  padding: '8px 14px', borderRadius: 10,
                  background: c.surfaceElevated,
                  border: `1px solid ${c.border}`,
                }}>
                  No earnings yet
                </div>
              )}
            </div>
          </div>

          {/* Custom amount link */}
          {shProfit > 0 && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                marginTop: 12, background: 'none', border: 'none',
                color: c.subtext, cursor: 'pointer', fontSize: 12,
                fontFamily: 'Inter, sans-serif', padding: 0,
                textDecoration: 'underline', textDecorationColor: 'transparent',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.color = c.accent}
              onMouseLeave={e => e.currentTarget.style.color = c.subtext}
            >
              + Add a custom amount
            </button>
          )}
        </Card>
      )}

      {/* Transfers log */}
      {transfers.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title="Transferred This Month" icon="📤" />
          {transfers.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: i < transfers.length - 1 ? `1px solid ${c.border}` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{t.note}</div>
                <div style={{ fontSize: 11, color: c.subtext, marginTop: 2 }}>
                  {new Date(t.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4CAF50' }}>
                  +{formatCurrency(t.amount)}
                </span>
                <button
                  onClick={() => removeTransfer(t.id)}
                  title="Remove transfer"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: c.subtext, fontSize: 16, padding: '2px 6px',
                    borderRadius: 4, lineHeight: 1, transition: 'color 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F44336'}
                  onMouseLeave={e => e.currentTarget.style.color = c.subtext}
                >×</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Footer tip */}
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: c.surfaceElevated, border: `1px solid ${c.border}`,
        fontSize: 12, color: c.subtext, lineHeight: 1.6,
      }}>
        💡 <strong style={{ color: c.text }}>Main wallet</strong> = salary (₹{salary.toLocaleString('en-IN')})
        {' '}minus your expenses. Side hustle stays separate — transfer it when you want it counted.
      </div>

      {/* Transfer Modal */}
      {showModal && (
        <TransferModal
          onClose={() => setShowModal(false)}
          onConfirm={handleTransfer}
          shProfit={shAvailable > 0 ? shAvailable : shProfit}
          c={c}
        />
      )}
    </div>
  );
};
