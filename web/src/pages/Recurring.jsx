import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, RefreshCw, Trash2, PlayCircle, Check } from 'lucide-react';
import { CategoryIcon } from '../utils/categoryIcons';
import notionClient from '../../../shared/utils/notionClient.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { DEFAULT_CATEGORIES } from '../../../shared/constants/categories.js';
import { todayISO } from '../../../shared/utils/dateUtils.js';
import { Card, CardHeader } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/Skeleton';
import { Modal } from '../components/common/Modal';

export const Recurring = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', category: DEFAULT_CATEGORIES[0].id, dayOfMonth: 1, active: true });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [loggingId, setLoggingId] = useState(null);
  const [loggedId, setLoggedId] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await notionClient.getRecurring();
      setItems(data.recurring || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await notionClient.createRecurring({ ...form, amount: parseFloat(form.amount), dayOfMonth: parseInt(form.dayOfMonth) });
      setItems(prev => [...prev, created]);
      setShowModal(false);
      setForm({ name: '', amount: '', category: DEFAULT_CATEGORIES[0].id, dayOfMonth: 1, active: true });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    setTogglingId(item.id);
    try {
      const updated = await notionClient.updateRecurring(item.id, { active: !item.active });
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring expense?')) return;
    await notionClient.deleteRecurring(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleLogNow = async (item) => {
    setLoggingId(item.id);
    try {
      await notionClient.createExpense({
        name: item.name,
        amount: item.amount,
        category: item.category,
        date: todayISO(),
        paymentMethod: 'UPI',
        notes: 'Logged from recurring',
      });
      setLoggedId(item.id);
      setTimeout(() => setLoggedId(null), 2000);
    } finally {
      setLoggingId(null);
    }
  };

  const getCat = (id) => DEFAULT_CATEGORIES.find(c => c.id === id);
  const totalMonthly = items.filter(i => i.active).reduce((s, i) => s + i.amount, 0);

  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text }}>Recurring Expenses</h1>
          <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
            {items.filter(i => i.active).length} active · <span style={{ color: c.accent }}>{formatCurrency(totalMonthly)}/month</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: c.accent, color: '#000', border: 'none', borderRadius: 10,
            padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          + Add Recurring
        </button>
      </div>

      {loading ? <SkeletonList count={4} /> :
        items.length === 0 ? (
          <Card>
            <EmptyState
              type="expenses"
              title="No recurring expenses"
              message="Add subscriptions, EMIs, or regular bills here."
              action={{ label: '+ Add Recurring', onClick: () => setShowModal(true) }}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const cat = getCat(item.category);
              const isLogging = loggingId === item.id;
              const justLogged = loggedId === item.id;
              return (
                <Card key={item.id} style={{ opacity: item.active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${cat?.color || c.accent}22`,
                      border: `1px solid ${cat?.color || c.accent}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {cat ? <CategoryIcon id={cat.id} size={20} color={cat.color} /> : <RefreshCw size={20} color={c.accent} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: c.subtext }}>
                        {cat?.label} · Every {ordinal(item.dayOfMonth)} of month
                      </div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: item.active ? '#F44336' : c.subtext }}>
                      {formatCurrency(item.amount)}
                    </div>

                    {/* Log Now button */}
                    <button
                      onClick={() => handleLogNow(item)}
                      disabled={isLogging || !item.active}
                      title="Log as expense today"
                      style={{
                        background: justLogged ? '#4CAF5018' : c.accentLight,
                        border: `1px solid ${justLogged ? '#4CAF5044' : c.cardBorder}`,
                        borderRadius: 8, padding: '6px 10px', cursor: item.active ? 'pointer' : 'not-allowed',
                        color: justLogged ? '#4CAF50' : c.accent,
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                        flexShrink: 0, transition: 'all 150ms ease',
                        opacity: !item.active ? 0.4 : 1,
                      }}
                    >
                      {justLogged
                        ? <><Check size={12} /> Logged</>
                        : isLogging
                          ? <span style={{ width: 12, height: 12, border: `2px solid ${c.accent}44`, borderTopColor: c.accent, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                          : <><PlayCircle size={12} /> Log</>
                      }
                    </button>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleActive(item)}
                      disabled={togglingId === item.id}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        background: item.active ? c.accent : c.border,
                        cursor: 'pointer', transition: 'background 200ms ease',
                        position: 'relative', flexShrink: 0,
                      }}
                      title={item.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', position: 'absolute',
                        top: 3, left: item.active ? 23 : 3,
                        transition: 'left 200ms ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: 'transparent', border: '1px solid rgba(244,67,54,0.3)',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                        color: '#F44336', flexShrink: 0, display: 'flex', alignItems: 'center',
                      }}
                    ><Trash2 size={13} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      }

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Recurring Expense">
        <form onSubmit={handleAdd}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} placeholder="e.g. Netflix, EMI" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <label style={labelStyle}>Amount (₹)</label>
          <input style={inputStyle} type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min="0" step="0.01" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {DEFAULT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Day of Month</label>
              <input style={inputStyle} type="number" min="1" max="28" value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${c.border}`, background: 'transparent', color: c.subtext, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: c.accent, color: '#000', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{saving ? 'Saving...' : <><Save size={14} /> Add Recurring</>}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
