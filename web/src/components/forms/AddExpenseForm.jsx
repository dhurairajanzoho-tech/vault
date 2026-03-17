import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '../../../../shared/constants/categories.js';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { todayISO } from '../../../../shared/utils/dateUtils.js';
import { scanReceipt } from '../../../../shared/utils/ocr.js';
import { Camera, Save, Loader2 } from 'lucide-react';

export const AddExpenseForm = ({ onSubmit, onCancel, defaultPaymentMethod = 'UPI', prefill = null }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:          prefill?.name          || '',
    amount:        prefill?.amount        ? String(prefill.amount) : '',
    category:      prefill?.category      || DEFAULT_CATEGORIES[0].id,
    date:          prefill?.date          || todayISO(),
    paymentMethod: prefill?.paymentMethod || defaultPaymentMethod,
    notes:         prefill?.notes         || '',
  });
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanMsg('Scanning receipt...');
    try {
      const result = await scanReceipt(file, false);
      if (result.amount) {
        setForm(f => ({
          ...f,
          amount: String(result.amount),
          category: result.category || f.category,
          name: f.name || 'Receipt expense',
        }));
        setScanMsg(`Detected ₹${result.amount} · Category: ${result.category}`);
      } else {
        setScanMsg('Could not detect amount. Please enter manually.');
      }
    } catch (err) {
      setScanMsg('Scan failed. Please enter manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) {
      setError('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) });
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: c.surfaceElevated,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    color: c.text,
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    padding: '12px 16px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: c.subtext,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* OCR prefill banner */}
      {prefill && Object.keys(prefill).length > 0 && (
        <div style={{
          marginBottom: 16,
          background: `${c.accent}18`,
          border: `1px solid ${c.accent}44`,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 13, color: c.accent, fontWeight: 600,
        }}>
          Receipt scanned — review and confirm the details below
        </div>
      )}

      {/* Scan Receipt */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleScan} style={{ display: 'none' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          style={{
            flex: 1, padding: '12px', borderRadius: 12, border: `2px dashed ${c.cardBorder}`,
            background: c.accentLight, color: c.accent, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {scanning ? <><Loader2 size={14} className="spin" /> Scanning...</> : <><Camera size={14} /> Scan Receipt</>}
        </button>
      </div>
      {scanMsg && (
        <div style={{ marginBottom: 16, fontSize: 12, color: c.subtext, background: c.surfaceElevated, borderRadius: 8, padding: '8px 12px' }}>
          {scanMsg}
        </div>
      )}

      {/* Amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Amount (₹)</label>
        <input
          style={{ ...inputStyle, fontSize: 20, fontWeight: 700 }}
          type="number"
          placeholder="0"
          value={form.amount}
          onChange={set('amount')}
          required
          min="0"
          step="0.01"
        />
      </div>

      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Description</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="What did you spend on?"
          value={form.name}
          onChange={set('name')}
          required
        />
      </div>

      {/* Category + Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={set('category')}>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={form.date} onChange={set('date')} />
        </div>
      </div>

      {/* Payment Method */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Payment Method</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PAYMENT_METHODS.map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setForm(f => ({ ...f, paymentMethod: method }))}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${form.paymentMethod === method ? c.accent : c.border}`,
                background: form.paymentMethod === method ? c.accentLight : 'transparent',
                color: form.paymentMethod === method ? c.accent : c.subtext,
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                transition: 'all 150ms ease',
              }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
          placeholder="Any notes..."
          value={form.notes}
          onChange={set('notes')}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 16, color: '#F44336', fontSize: 13, background: 'rgba(244,67,54,0.1)', padding: '10px 14px', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${c.border}`,
            background: 'transparent', color: c.subtext, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            flex: 2, padding: '13px', borderRadius: 12, border: 'none',
            background: c.accent, color: '#000', cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Saving...' : <><Save size={14} /> Save Expense</>}
        </button>
      </div>
    </form>
  );
};
