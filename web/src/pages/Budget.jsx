import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../../../shared/hooks/useBudget.js';
import { useExpenses } from '../../../shared/hooks/useExpenses.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { DEFAULT_CATEGORIES } from '../../../shared/constants/categories.js';
import { Card, CardHeader } from '../components/common/Card';
import { SkeletonList } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';

export const Budget = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const { getBudgetStatus, upsertBudgetLimit, loading: budLoading } = useBudget();
  const { byCategory, loading: expLoading } = useExpenses();

  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ monthlyLimit: '', alertThreshold: 80 });
  const [saving, setSaving] = useState(false);

  const budgetStatus = getBudgetStatus(byCategory);
  const loading = budLoading || expLoading;

  // ── Summary calculations ─────────────────────────────────────────────────────
  const withLimit = budgetStatus.filter(b => b.monthlyLimit > 0);
  const totalBudgeted = withLimit.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = withLimit.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPct = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const exceededCount = withLimit.filter(b => b.status === 'exceeded').length;
  const warningCount = withLimit.filter(b => b.status === 'danger' || b.status === 'warning').length;

  const overallColor = overallPct >= 100 ? '#F44336' : overallPct >= 80 ? '#FF9800' : '#4CAF50';

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openEdit = (cat) => {
    const existing = budgetStatus.find(b => b.id === cat.id);
    setEditCat(cat);
    setForm({
      monthlyLimit: existing?.monthlyLimit || '',
      alertThreshold: existing?.alertThreshold || 80,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertBudgetLimit(editCat.id, parseFloat(form.monthlyLimit), parseInt(form.alertThreshold));
      setEditCat(null);
    } finally {
      setSaving(false);
    }
  };

  const statusColors = { safe: '#4CAF50', warning: '#FFC107', danger: '#FF9800', exceeded: '#F44336' };

  const inputStyle = {
    width: '100%', background: c.surfaceElevated, border: `1px solid ${c.border}`,
    borderRadius: 12, color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 15, padding: '12px 16px', outline: 'none', marginBottom: 16,
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600, color: c.subtext,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text }}>Budget Limits</h1>
        <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
          Set and monitor monthly spending limits per category
        </p>
      </div>

      {/* ── Overall Budget Health Card ── */}
      {!loading && withLimit.length > 0 && (
        <div style={{
          background: c.surfaceElevated, border: `1px solid ${c.cardBorder}`,
          borderRadius: 16, padding: '18px 20px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Monthly Budget Overview</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {exceededCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#F44336',
                  background: '#F4433618', border: '1px solid #F4433640',
                  padding: '3px 9px', borderRadius: 20,
                }}>
                  {exceededCount} over budget
                </span>
              )}
              {warningCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: '#FF9800',
                  background: '#FF980018', border: '1px solid #FF980040',
                  padding: '3px 9px', borderRadius: 20,
                }}>
                  {warningCount} near limit
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 10, borderRadius: 6, background: c.border, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              height: '100%', width: `${overallPct}%`, borderRadius: 6,
              background: overallPct >= 100
                ? '#F44336'
                : overallPct >= 80
                  ? 'linear-gradient(90deg, #FF9800, #F44336)'
                  : `linear-gradient(90deg, ${c.accent}, #4CAF50)`,
              transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>

          {/* Numbers row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Spent</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F44336' }}>{formatCurrency(totalSpent)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Budgeted</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{formatCurrency(totalBudgeted)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Remaining</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: totalRemaining >= 0 ? '#4CAF50' : '#F44336' }}>
                  {totalRemaining >= 0 ? '+' : ''}{formatCurrency(totalRemaining)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: overallColor }}>
              {overallPct.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* ── Category Budget List ── */}
      {loading ? (
        <SkeletonList count={7} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgetStatus.map(b => {
            const statusColor = statusColors[b.status] || c.accent;
            const hasLimit = b.monthlyLimit > 0;

            return (
              <div key={b.id} style={{
                background: c.surface, border: `1px solid ${hasLimit && b.status === 'exceeded' ? '#F4433344' : c.cardBorder}`,
                borderRadius: 14, padding: '14px 16px',
                transition: 'border-color 200ms ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${b.color}22`, border: `1px solid ${b.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {b.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: hasLimit ? 8 : 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{b.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#F44336' }}>
                        {formatCurrency(b.spent)}
                        {hasLimit && (
                          <span style={{ color: c.subtext, fontWeight: 400, fontSize: 12 }}>
                            {' / '}{formatCurrency(b.monthlyLimit)}
                          </span>
                        )}
                      </span>
                    </div>

                    {hasLimit ? (
                      <>
                        <div style={{
                          height: 6, borderRadius: 4, background: c.border,
                          overflow: 'hidden', marginBottom: 6,
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 4,
                            width: `${Math.min(b.percent, 100)}%`,
                            background: statusColor,
                            transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: statusColor, fontWeight: 600 }}>
                            {b.percent.toFixed(0)}% used
                            {b.status === 'exceeded' && ' · OVER BUDGET ⚠️'}
                            {b.status === 'danger' && ' · Almost exceeded'}
                          </span>
                          <span style={{ fontSize: 11, color: c.subtext }}>
                            Alert at {b.alertThreshold}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: c.subtext }}>No limit set · tap to add</span>
                    )}
                  </div>

                  <button
                    onClick={() => openEdit(b)}
                    style={{
                      flexShrink: 0, background: hasLimit ? c.accentLight : c.surfaceElevated,
                      border: `1px solid ${hasLimit ? c.cardBorder : c.border}`,
                      borderRadius: 10, padding: '7px 13px', cursor: 'pointer',
                      color: hasLimit ? c.accent : c.subtext, fontSize: 12, fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {hasLimit ? '✏️ Edit' : '+ Set Limit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editCat} onClose={() => setEditCat(null)} title={`Set Budget: ${editCat?.label}`}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: `${editCat?.color}22`, border: `1px solid ${editCat?.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {editCat?.icon}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{editCat?.label}</div>
          </div>

          <label style={labelStyle}>Monthly Limit (₹)</label>
          <input
            style={inputStyle} type="number" placeholder="e.g. 5000"
            value={form.monthlyLimit}
            onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))}
            required min="0" step="100"
          />

          <label style={labelStyle}>Alert Threshold (%)</label>
          <div style={{ marginBottom: 16 }}>
            <input
              type="range" min="50" max="100" step="5"
              value={form.alertThreshold}
              onChange={e => setForm(f => ({ ...f, alertThreshold: e.target.value }))}
              style={{ width: '100%', accentColor: c.accent }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ color: c.subtext, fontSize: 12 }}>50%</span>
              <span style={{ color: c.accent, fontWeight: 700, fontSize: 14 }}>{form.alertThreshold}%</span>
              <span style={{ color: c.subtext, fontSize: 12 }}>100%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setEditCat(null)} style={{
              flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${c.border}`,
              background: 'transparent', color: c.subtext, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '13px', borderRadius: 12, border: 'none',
              background: c.accent, color: '#000', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving...' : '💾 Save Limit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
