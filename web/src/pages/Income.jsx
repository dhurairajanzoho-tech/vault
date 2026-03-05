import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { useIncome } from '../../../shared/hooks/useIncome.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { formatDate, todayISO, getLastSixMonths, getMonthKey } from '../../../shared/utils/dateUtils.js';
import { WORK_SALARY_AMOUNT } from '../../../shared/constants/categories.js';
import { Card, CardHeader } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';

// ── Month Pill ─────────────────────────────────────────────────────────────────

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

// ── Mini Stat Card ─────────────────────────────────────────────────────────────

const MiniStat = ({ label, value, icon, color, c }) => (
  <div style={{
    background: c.surfaceElevated,
    border: `1px solid ${c.cardBorder}`,
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: 6,
    flex: 1, minWidth: 0,
  }}>
    <div style={{ fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 5 }}>
      <span>{icon}</span> {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
  </div>
);

// ── Income Row ─────────────────────────────────────────────────────────────────

const IncomeRow = ({ entry, isLast, c }) => {
  const isSalary = entry.type === 'Salary';
  const color = isSalary ? c.accent : '#7B2FBE';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : `1px solid ${c.border}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: `${color}1A`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17,
      }}>
        {isSalary ? '🏢' : '💼'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 2 }}>{entry.source}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: c.subtext }}>{formatDate(entry.date)}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            padding: '1px 7px', borderRadius: 20,
          }}>{entry.type}</span>
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#4CAF50', flexShrink: 0 }}>
        +{formatCurrency(entry.amount)}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export const Income = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const isMobile = useMobile();

  const months = getLastSixMonths();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [activeTab, setActiveTab] = useState('all');

  const { incomeEntries, workSalary, sideHustleEntries, sideHustleTotal, totalIncome, loading, refresh, addIncome } = useIncome(selectedMonth);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ source: '', amount: '', date: todayISO(), type: 'Side Hustle' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addIncome({ ...form, amount: parseFloat(form.amount) });
      setShowAddModal(false);
      setForm({ source: '', amount: '', date: todayISO(), type: 'Side Hustle' });
    } finally {
      setSubmitting(false);
    }
  };

  const displayedEntries = incomeEntries.filter(e => {
    if (activeTab === 'salary') return e.type === 'Salary';
    if (activeTab === 'sidehustle') return e.type === 'Side Hustle';
    return true;
  });

  const inputStyle = {
    width: '100%', background: c.surfaceElevated, border: `1px solid ${c.border}`,
    borderRadius: 12, color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 15, padding: '12px 16px', outline: 'none', marginBottom: 16,
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: c.subtext,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
  };

  const tabBtn = (key) => ({
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: activeTab === key ? 700 : 400,
    fontSize: 12, border: 'none',
    background: activeTab === key ? c.accent : 'transparent',
    color: activeTab === key ? '#000' : c.subtext,
    transition: 'all 150ms ease',
  });

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text }}>Income</h1>
          <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
            {months.find(m => m.key === selectedMonth)?.label || selectedMonth}
            {' · '}<span style={{ color: '#4CAF50', fontWeight: 700 }}>{formatCurrency(totalIncome)} earned</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: c.accent, color: '#000', border: 'none', borderRadius: 10,
            padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            fontFamily: 'Inter, sans-serif',
          }}
        >+ Add Income</button>
      </div>

      {/* ── Month Pills ── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        marginBottom: 24, scrollbarWidth: 'none',
      }}>
        {months.map(m => (
          <MonthPill key={m.key} m={m} isActive={m.key === selectedMonth} onClick={setSelectedMonth} c={c} />
        ))}
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <MiniStat label="Work Salary" value={formatCurrency(workSalary.amount)} icon="🏢" color={c.accent} c={c} />
        <MiniStat label="Side Hustle" value={formatCurrency(sideHustleTotal)} icon="💼" color="#7B2FBE" c={c} />
        <MiniStat label="Total Income" value={formatCurrency(totalIncome)} icon="💵" color="#4CAF50" c={c} />
      </div>

      {/* ── Income Distribution Bar ── */}
      {totalIncome > 0 && (
        <div style={{
          background: c.surfaceElevated, border: `1px solid ${c.cardBorder}`,
          borderRadius: 14, padding: '16px 18px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Income Distribution
          </div>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 8, gap: 3, marginBottom: 10 }}>
            {workSalary.amount > 0 && (
              <div style={{ flex: workSalary.amount, background: c.accent, borderRadius: 4 }} />
            )}
            {sideHustleTotal > 0 && (
              <div style={{ flex: sideHustleTotal, background: '#7B2FBE', borderRadius: 4 }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c.subtext }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent }} />
              Salary · {totalIncome > 0 ? ((workSalary.amount / totalIncome) * 100).toFixed(0) : 0}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: c.subtext }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7B2FBE' }} />
              Side Hustle · {totalIncome > 0 ? ((sideHustleTotal / totalIncome) * 100).toFixed(0) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* ── Entries Card ── */}
      <div style={{
        background: c.surface, border: `1px solid ${c.cardBorder}`,
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Card Header with tabs + sync */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', borderBottom: `1px solid ${c.border}`,
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Income History</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 3, background: c.surfaceElevated, borderRadius: 10, padding: 3 }}>
              <button style={tabBtn('all')} onClick={() => setActiveTab('all')}>All</button>
              <button style={tabBtn('salary')} onClick={() => setActiveTab('salary')}>Salary</button>
              <button style={tabBtn('sidehustle')} onClick={() => setActiveTab('sidehustle')}>Side Hustle</button>
            </div>
            <button onClick={refresh} style={{
              background: 'transparent', border: `1px solid ${c.border}`,
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              color: c.subtext, fontSize: 12, fontFamily: 'Inter, sans-serif',
            }}>🔄</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 16 }}><SkeletonList count={3} /></div>
        ) : displayedEntries.length === 0 ? (
          <div style={{ padding: '30px 20px' }}>
            <EmptyState type="income" />
          </div>
        ) : (
          displayedEntries.map((entry, i) => (
            <IncomeRow
              key={entry.id}
              entry={entry}
              isLast={i === displayedEntries.length - 1}
              c={c}
            />
          ))
        )}

        {/* Totals footer */}
        {!loading && displayedEntries.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 18px',
            borderTop: `2px solid ${c.border}`,
            background: c.surfaceElevated,
          }}>
            <span style={{ fontSize: 12, color: c.subtext, fontWeight: 600 }}>
              {displayedEntries.length} entries
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#4CAF50' }}>
              +{formatCurrency(displayedEntries.reduce((s, e) => s + e.amount, 0))}
            </span>
          </div>
        )}
      </div>

      {/* ── Add Income Modal ── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Income Entry">
        <form onSubmit={handleAdd}>
          <label style={labelStyle}>Source</label>
          <input
            style={inputStyle} placeholder="e.g. Freelance project"
            value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required
          />
          <label style={labelStyle}>Amount (₹)</label>
          <input
            style={inputStyle} type="number" placeholder="0"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            required min="0" step="0.01"
          />
          <label style={labelStyle}>Date</label>
          <input
            style={inputStyle} type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <label style={labelStyle}>Type</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }} value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          >
            <option value="Side Hustle">Side Hustle</option>
            <option value="Salary">Salary</option>
          </select>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{
              flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${c.border}`,
              background: 'transparent', color: c.subtext, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
            }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{
              flex: 2, padding: '13px', borderRadius: 12, border: 'none',
              background: c.accent, color: '#000', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, opacity: submitting ? 0.7 : 1,
            }}>{submitting ? 'Saving...' : '💾 Save Income'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
