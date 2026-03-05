import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useExpenses } from '../../../shared/hooks/useExpenses.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { formatDate, getMonthKey, getLastSixMonths } from '../../../shared/utils/dateUtils.js';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '../../../shared/constants/categories.js';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Skeleton';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { useApp } from '../context/AppContext';
import notionClient from '../../../shared/utils/notionClient.js';

// ── OCR helper ────────────────────────────────────────────────────────────────

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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

// ── Expenses Page ─────────────────────────────────────────────────────────────

export const Expenses = () => {
  const { theme } = useTheme();
  const { defaultPaymentMethod } = useApp();
  const c = theme.colors;

  const months = getLastSixMonths();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrPrefill, setOcrPrefill] = useState(null);
  const fileInputRef = useRef(null);

  const { expenses, loading, addExpense, updateExpense, deleteExpense, refresh, totalSpent } = useExpenses(selectedMonth);

  const filtered = expenses.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.notes?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || e.category === filterCategory;
    const matchPay = !filterPayment || e.paymentMethod === filterPayment;
    return matchSearch && matchCat && matchPay;
  });

  // Group by date (descending)
  const groupedByDate = filtered.reduce((acc, e) => {
    const key = e.date || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const getCat = (id) => DEFAULT_CATEGORIES.find(c => c.id === id);

  const handleAdd = async (data) => {
    await addExpense(data);
    setShowAddModal(false);
    setOcrPrefill(null);
  };

  const handleEdit = async (data) => {
    await updateExpense(editExpense.id, data);
    setEditExpense(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  // ── OCR scan ──────────────────────────────────────────────────────────────

  const handleOcrFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setOcrError('Please select an image file (JPG, PNG, WEBP)');
      return;
    }
    setOcrError('');
    setOcrLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await notionClient.scanReceipt(base64);
      setOcrPrefill(result || {});
      setShowAddModal(true);
    } catch (err) {
      setOcrError(`OCR failed: ${err.message}`);
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerOcrPicker = () => {
    setOcrError('');
    fileInputRef.current?.click();
  };

  // ─────────────────────────────────────────────────────────────────────────

  const inputStyle = {
    background: c.surfaceElevated, border: `1px solid ${c.border}`,
    borderRadius: 10, color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 13, padding: '9px 14px', outline: 'none',
  };

  const selectedLabel = months.find(m => m.key === selectedMonth)?.label || selectedMonth;

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text }}>Expenses</h1>
          <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
            {selectedLabel}
            {' · '}<span style={{ color: '#F44336', fontWeight: 700 }}>{formatCurrency(totalSpent)} spent</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={refresh} style={{ ...inputStyle, cursor: 'pointer', padding: '9px 12px' }} title="Refresh">🔄</button>

          {/* Hidden file input for OCR */}
          <input
            ref={fileInputRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={e => handleOcrFile(e.target.files?.[0])}
          />

          {/* OCR scan button */}
          <button
            onClick={triggerOcrPicker} disabled={ocrLoading}
            style={{
              ...inputStyle, cursor: ocrLoading ? 'not-allowed' : 'pointer',
              padding: '9px 14px', border: `1px solid ${c.accent}55`,
              color: ocrLoading ? c.subtext : c.accent,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: ocrLoading ? 0.7 : 1, transition: 'all 150ms ease',
            }}
            title="Scan receipt with OCR"
          >
            {ocrLoading ? (
              <>
                <span style={{
                  width: 14, height: 14, border: `2px solid ${c.accent}44`,
                  borderTopColor: c.accent, borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                Scanning…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="3"/>
                  <path d="M7 2v4M17 2v4M7 18v4M17 18v4M2 7h4M18 7h4M2 17h4M18 17h4"/>
                  <rect x="8" y="8" width="8" height="8" rx="1"/>
                </svg>
                Scan Receipt
              </>
            )}
          </button>

          <button
            onClick={() => { setOcrPrefill(null); setShowAddModal(true); }}
            style={{
              background: c.accent, color: '#000', border: 'none', borderRadius: 10,
              padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              fontFamily: 'Inter, sans-serif',
            }}
          >+ Add Expense</button>
        </div>
      </div>

      {/* ── Month Pills ── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        marginBottom: 20, scrollbarWidth: 'none',
      }}>
        {months.map(m => (
          <MonthPill key={m.key} m={m} isActive={m.key === selectedMonth} onClick={setSelectedMonth} c={c} />
        ))}
      </div>

      {/* ── OCR error banner ── */}
      {ocrError && (
        <div style={{
          background: '#F4433618', border: '1px solid #F4433644',
          borderRadius: 10, padding: '10px 16px', color: '#F44336',
          fontSize: 13, marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>⚠️ {ocrError}</span>
          <button
            onClick={() => setOcrError('')}
            style={{ background: 'none', border: 'none', color: '#F44336', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          placeholder="🔍 Search expenses..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {DEFAULT_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
          ))}
        </select>
        <select style={{ ...inputStyle, cursor: 'pointer' }} value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
          <option value="">All Payments</option>
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* ── Summary strip ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, color: c.subtext }}>{filtered.length} entries</span>
          <span style={{ color: c.border }}>·</span>
          <span style={{ fontSize: 12.5, color: c.subtext }}>{sortedDates.length} days</span>
          <span style={{ color: c.border }}>·</span>
          <span style={{ fontSize: 12.5, color: '#F44336', fontWeight: 700 }}>
            {formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}
          </span>
        </div>
      )}

      {/* ── Expense List (grouped by date) ── */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            type="expenses"
            action={{ label: '+ Add First Expense', onClick: () => setShowAddModal(true) }}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sortedDates.map(date => {
            const dayExpenses = groupedByDate[date];
            const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date}>
                {/* Date header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 8, paddingBottom: 7,
                  borderBottom: `1px solid ${c.border}`,
                }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: c.subtext,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {formatDate(date)}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F44336' }}>
                    {formatCurrency(dayTotal)}
                  </span>
                </div>

                {/* Day's expenses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayExpenses.map(expense => {
                    const cat = getCat(expense.category);
                    return (
                      <div key={expense.id} style={{
                        background: c.surface, border: `1px solid ${c.cardBorder}`,
                        borderRadius: 14, padding: '12px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Icon */}
                          <div style={{
                            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                            background: `${cat?.color || c.accent}22`,
                            border: `1px solid ${cat?.color || c.accent}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
                          }}>
                            {cat?.icon || '💳'}
                          </div>

                          {/* Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 3 }}>
                              {expense.name}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{
                                fontSize: 10.5, color: cat?.color || c.subtext,
                                background: `${cat?.color || c.accent}1A`,
                                border: `1px solid ${cat?.color || c.accent}30`,
                                padding: '1px 7px', borderRadius: 20,
                              }}>{cat?.label || expense.category}</span>
                              <span style={{ fontSize: 11, color: c.subtext }}>{expense.paymentMethod}</span>
                              {expense.notes && <span style={{ fontSize: 11, color: c.subtext }}>📝 {expense.notes}</span>}
                              {expense.receiptImageUrl && (
                                <a
                                  href={expense.receiptImageUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 11, color: c.accent }}
                                >🧾 receipt</a>
                              )}
                            </div>
                          </div>

                          {/* Amount */}
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#F44336', flexShrink: 0 }}>
                            {formatCurrency(expense.amount)}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => setEditExpense(expense)}
                              style={{
                                background: 'transparent', border: `1px solid ${c.border}`,
                                borderRadius: 8, padding: '5px 9px', cursor: 'pointer',
                                color: c.subtext, fontSize: 13,
                              }}
                            >✏️</button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              disabled={deletingId === expense.id}
                              style={{
                                background: 'transparent', border: '1px solid rgba(244,67,54,0.3)',
                                borderRadius: 8, padding: '5px 9px', cursor: 'pointer',
                                color: '#F44336', fontSize: 13,
                                opacity: deletingId === expense.id ? 0.5 : 1,
                              }}
                            >🗑️</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal — may be prefilled from OCR */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setOcrPrefill(null); }}
        title={ocrPrefill ? '📷 Add Expense from Receipt' : 'Add Expense'}
      >
        <AddExpenseForm
          onSubmit={handleAdd}
          onCancel={() => { setShowAddModal(false); setOcrPrefill(null); }}
          defaultPaymentMethod={defaultPaymentMethod}
          prefill={ocrPrefill}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense">
        {editExpense && (
          <AddExpenseForm
            onSubmit={handleEdit}
            onCancel={() => setEditExpense(null)}
            defaultPaymentMethod={editExpense.paymentMethod}
            prefill={editExpense}
          />
        )}
      </Modal>
    </div>
  );
};
