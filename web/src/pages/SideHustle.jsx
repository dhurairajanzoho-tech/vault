import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { Card, CardHeader } from '../components/common/Card';
import { SkeletonList, CardSkeleton } from '../components/common/Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import notionClient from '../../../shared/utils/notionClient.js';
import { BarChart2, ClipboardList, TrendingUp, Banknote, RefreshCw, AlertTriangle, Users, Inbox } from 'lucide-react';

// ── Client colour palette ─────────────────────────────────────────────────────
const PALETTE = [
  '#D4AF37', '#7B2FBE', '#4CAF50', '#2196F3',
  '#FF9800', '#E91E63', '#00BCD4', '#FF5722', '#9C27B0',
];
const colorCache = {};
let colorIdx = 0;
const colorFor = (name) => {
  if (!colorCache[name]) colorCache[name] = PALETTE[colorIdx++ % PALETTE.length];
  return colorCache[name];
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'approved':    { bg: 'rgba(76,175,80,0.15)',   fg: '#4CAF50', dot: '#4CAF50', label: 'Approved' },
  'Complete':    { bg: 'rgba(76,175,80,0.12)',   fg: '#4CAF50', dot: '#4CAF50', label: 'Complete' },
  'Done':        { bg: 'rgba(76,175,80,0.12)',   fg: '#4CAF50', dot: '#4CAF50', label: 'Done' },
  'In progress': { bg: 'rgba(33,150,243,0.15)',  fg: '#2196F3', dot: '#2196F3', label: 'In Progress' },
  'To-do':       { bg: 'rgba(255,152,0,0.15)',   fg: '#FF9800', dot: '#FF9800', label: 'To-Do' },
  'Not started': { bg: 'rgba(158,158,158,0.12)', fg: '#9E9E9E', dot: '#666',    label: 'Not Started' },
};

const getStatus = (s) => STATUS_CONFIG[s] || { bg: 'rgba(158,158,158,0.1)', fg: '#888', dot: '#555', label: s || '—' };

const StatusBadge = ({ status }) => {
  const m = getStatus(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      background: m.bg, color: m.fg, whiteSpace: 'nowrap',
      border: `1px solid ${m.fg}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot, display: 'inline-block', flexShrink: 0 }} />
      {m.label}
    </span>
  );
};

// ── Mini Donut SVG ────────────────────────────────────────────────────────────
const Donut = ({ clients, size = 120 }) => {
  const total = clients.reduce((s, c) => s + c.profit, 0);
  if (!total) return null;
  const r = 40, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let cum = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {clients.map(cl => {
        const pct = cl.profit / total;
        const rotate = cum * 360 - 90;
        cum += pct;
        return (
          <circle key={cl.client} cx={cx} cy={cy} r={r} fill="none"
            stroke={colorFor(cl.client)} strokeWidth={20}
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
            transform={`rotate(${rotate} ${cx} ${cy})`} opacity={0.9}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - 11} fill="var(--color-surface)" />
    </svg>
  );
};

// ── Recharts Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, c }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: c.surface, border: `1px solid ${c.cardBorder}`,
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, color: c.text, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.fill, marginBottom: 3 }}>
          {p.name}: <strong>{formatCurrency(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

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
  }}>{m.short || m.label}</button>
);

// ── Stat Card (inline) ────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Card style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || c.accent, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: c.subtext, marginTop: 5 }}>{sub}</div>}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Derive the base URL for the API (same pattern as notionClient.js)
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : '';

const apiFetch = (path) =>
  fetch(`${API_BASE}${path}`).then(r => {
    if (!r.ok) throw new Error(`Server error ${r.status}`);
    return r.json();
  });

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export const SideHustle = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const isMobile = useMobile();

  // ── state ──────────────────────────────────────────────────────────────────
  const [months, setMonths]     = useState([]);
  const [activeMonth, setActiveMonth] = useState(null);
  const [showAll, setShowAll]   = useState(false);
  const [view, setView]         = useState('overview'); // 'overview' | 'works'

  const [data, setData]         = useState(null);
  const [trend, setTrend]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError]       = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [activeClient, setActiveClient] = useState(null);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]     = useState('date');

  // ── Auto-set current month on mount ────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setActiveMonth(cur);
  }, []);

  // ── Fetch months list ───────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/sidehustle/months')
      .then(({ months: ms }) => {
        if (ms && ms.length) setMonths(ms);
      })
      .catch(() => {});
  }, [refreshKey]);

  // ── Fetch trend ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setTrendLoading(true);
    apiFetch('/api/sidehustle/trend')
      .then(({ trend: t }) => setTrend(t || []))
      .catch(() => setTrend([]))
      .finally(() => setTrendLoading(false));
  }, [refreshKey]);

  // ── Fetch month or all data ─────────────────────────────────────────────────
  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      let url = showAll
        ? '/api/sidehustle/all'
        : `/api/sidehustle${activeMonth ? `?month=${activeMonth}` : ''}`;
      if (force) url += (url.includes('?') ? '&' : '?') + 'force=1';
      const res = await apiFetch(url);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeMonth, showAll]);

  useEffect(() => {
    if (showAll || activeMonth) fetchData();
  }, [fetchData, activeMonth, showAll]);

  // ── Full refresh (bust cache + reload months, trend, data) ──────────────────
  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    fetchData(true);
  }, [fetchData]);

  // ── Filtered + sorted works ─────────────────────────────────────────────────
  const allWorks = data?.works || [];
  const filteredWorks = allWorks
    .filter(w => !activeClient || w.client === activeClient)
    .filter(w => statusFilter === 'all' || (w.status || '').toLowerCase() === statusFilter.toLowerCase())
    .filter(w => !search ||
      w.work.toLowerCase().includes(search.toLowerCase()) ||
      (w.client || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'profit')  return b.profit - a.profit;
      if (sortBy === 'price')   return b.price  - a.price;
      return (b.date || '').localeCompare(a.date || '');
    });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const { summary, clients = [], workTypes = [] } = data || {};
  const profitMargin = summary?.totalRevenue > 0
    ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : 0;

  const monthLabel = showAll
    ? 'All Time'
    : (months.find(m => m.key === activeMonth)?.label || activeMonth || '…');

  const inputStyle = {
    background: c.surfaceElevated, border: `1px solid ${c.border}`,
    borderRadius: 10, color: c.text, fontFamily: 'Inter, sans-serif',
    fontSize: 13, padding: '8px 12px', outline: 'none',
  };

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) return (
    <div className="fade-in" style={{ maxWidth: 1040 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: c.text, marginBottom: 20 }}>Side Hustle</h1>
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><AlertTriangle size={48} color="#F44336" /></div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#F44336', marginBottom: 8 }}>Failed to load data</div>
          <div style={{ fontSize: 13, color: c.subtext, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            {error}. Make sure the server is running and Notion API key is configured.
          </div>
          <button onClick={handleRefresh} style={{
            background: c.accent, color: '#000', border: 'none', borderRadius: 10,
            padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}><RefreshCw size={14} /> Retry</button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 1040 }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>
            Side Hustle
          </h1>
          <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>
            {monthLabel}
            {!loading && summary && summary.totalWorks > 0 && (
              <> · <span style={{ color: c.accent, fontWeight: 600 }}>{summary.totalWorks} works</span>
              {' '}· <span style={{ color: '#4CAF50', fontWeight: 600 }}>{profitMargin}% margin</span></>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View tabs */}
          <div style={{
            display: 'flex', background: c.surfaceElevated,
            borderRadius: 10, border: `1px solid ${c.border}`, overflow: 'hidden',
          }}>
            {[['overview', <><BarChart2 size={13} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Overview</>], ['works', <><ClipboardList size={13} style={{display:'inline',verticalAlign:'middle',marginRight:4}} />Works</>]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: view === v ? 700 : 400,
                background: view === v ? c.accent : 'transparent',
                color: view === v ? '#000' : c.subtext,
                transition: 'all 150ms ease',
              }}>{label}</button>
            ))}
          </div>
          <button onClick={handleRefresh} title="Refresh from Notion" style={{
            background: c.surfaceElevated, border: `1px solid ${c.border}`,
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
            color: c.subtext, display: 'flex', alignItems: 'center',
            transition: 'all 150ms ease',
          }}><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* ── MONTH SELECTOR ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', padding: '2px 0 6px', scrollbarWidth: 'none' }}>
          {/* All-time */}
          <button onClick={() => { setShowAll(!showAll); setActiveClient(null); }} style={{
            padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: showAll ? 700 : 400,
            background: showAll ? '#7B2FBE28' : c.surfaceElevated,
            color: showAll ? '#7B2FBE' : c.subtext,
            border: showAll ? '1.5px solid #7B2FBE' : `1.5px solid ${c.cardBorder}`,
            transition: 'all 150ms ease', flexShrink: 0,
            boxShadow: showAll ? '0 0 14px #7B2FBE30' : 'none',
          }}>All Time</button>

          <div style={{ width: 1, height: 20, background: c.border, flexShrink: 0, margin: '0 2px' }} />

          {months.length > 0 ? (
            months.map(m => (
              <MonthPill
                key={m.key}
                m={m}
                isActive={!showAll && m.key === activeMonth}
                onClick={(key) => { setShowAll(false); setActiveMonth(key); setActiveClient(null); }}
                c={c}
              />
            ))
          ) : (
            // Show current month as a fallback pill while months load
            activeMonth && (
              <MonthPill
                m={{ key: activeMonth, short: new Date(activeMonth + '-15').toLocaleString('default', { month: 'short', year: '2-digit' }) }}
                isActive={!showAll}
                onClick={() => {}}
                c={c}
              />
            )
          )}
        </div>
      </div>

      {/* ── TREND CHART (always visible, not loading-gated) ── */}
      {!trendLoading && trend.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <CardHeader title="6-Month Trend" icon={<TrendingUp size={14} />} />
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.subtext }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c.accent, display: 'inline-block' }} /> Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.subtext }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#F44336', display: 'inline-block' }} /> Designer Pay
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: c.subtext }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4CAF50', display: 'inline-block' }} /> Profit
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trend} barCategoryGap="35%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: c.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: c.subtext, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} width={48} />
              <Tooltip content={<ChartTooltip c={c} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="revenue"     name="Revenue"       fill={c.accent}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="designerPay" name="Designer Pay"  fill="#F44336"   radius={[3, 3, 0, 0]} opacity={0.75} />
              <Bar dataKey="profit"      name="Profit"        fill="#4CAF50"   radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Clickable month summary chips below chart */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }}>
            {trend.map(t => {
              const isActive = !showAll && activeMonth === t.month;
              return (
                <button key={t.month}
                  onClick={() => { setShowAll(false); setActiveMonth(t.month); setActiveClient(null); }}
                  style={{
                    flexShrink: 0, padding: '8px 12px', borderRadius: 10,
                    border: isActive ? `1px solid ${c.accent}66` : `1px solid ${c.border}`,
                    background: isActive ? `${c.accent}14` : c.surfaceElevated,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                    transition: 'all 150ms ease',
                  }}>
                  <div style={{ fontSize: 10, color: c.subtext, marginBottom: 3, fontWeight: 600, letterSpacing: '0.05em' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: t.profit > 0 ? '#4CAF50' : c.subtext }}>
                    {formatCurrency(t.profit)}
                  </div>
                  <div style={{ fontSize: 10, color: c.subtext, marginTop: 1 }}>
                    {t.workCount} {t.workCount === 1 ? 'work' : 'works'}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {!loading && data && view === 'overview' && (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <StatCard label="Revenue"      value={formatCurrency(summary.totalRevenue)}     sub={`${summary.totalWorks} works`}   color={c.accent}  icon={<Banknote size={18} />} />
            <StatCard label="Designer Pay" value={formatCurrency(summary.totalDesignerPay)} sub="Paid out"                         color="#F44336"   icon={<Banknote size={18} />} />
            <StatCard label="Your Profit"  value={formatCurrency(summary.totalProfit)}      sub={`${profitMargin}% margin`}        color="#4CAF50"   icon={<TrendingUp size={18} />} />
            <StatCard label="Clients"      value={clients.length}                           sub={`${summary.totalWorks} total`}   color="#2196F3"   icon={<ClipboardList size={18} />} />
          </div>

          {/* Empty state */}
          {summary.totalWorks === 0 ? (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Inbox size={48} color={c.subtext} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 8 }}>
                  No works in {monthLabel}
                </div>
                <div style={{ fontSize: 13, color: c.subtext, marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
                  Add entries in your Notion "Works (Master Database)" with a Date in {monthLabel},
                  then refresh.
                </div>
                <button onClick={fetchData} style={{
                  background: c.accent, color: '#000', border: 'none', borderRadius: 10,
                  padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 6,
                }}><RefreshCw size={14} /> Refresh</button>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 16, marginBottom: 20 }}>
              {/* Client breakdown */}
              <Card>
                <CardHeader title="By Client" icon={<Users size={14} />} subtitle="Click a client to filter works" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

                  {/* All Clients row */}
                  <button onClick={() => setActiveClient(null)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: !activeClient ? `${c.accent}14` : c.surfaceElevated,
                    outline: !activeClient ? `1px solid ${c.accent}44` : 'none',
                    transition: 'all 150ms ease', textAlign: 'left',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: !activeClient ? c.accent : c.text }}>All Clients</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                      <span style={{ color: c.subtext }}>{formatCurrency(summary.totalRevenue)}</span>
                      <span style={{ color: '#4CAF50', fontWeight: 700 }}>{formatCurrency(summary.totalProfit)}</span>
                      <span style={{ color: c.subtext }}>{summary.totalWorks} works</span>
                    </div>
                  </button>

                  {clients.map(cl => {
                    const clr = colorFor(cl.client);
                    const isActive = activeClient === cl.client;
                    const pct = summary.totalProfit > 0
                      ? ((cl.profit / summary.totalProfit) * 100).toFixed(0) : 0;
                    return (
                      <button key={cl.client}
                        onClick={() => { setActiveClient(isActive ? null : cl.client); setView('works'); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: isActive ? `${clr}15` : 'transparent',
                          outline: isActive ? `1px solid ${clr}44` : 'none',
                          transition: 'all 150ms ease', textAlign: 'left',
                        }}
                        onMouseEnter={e => !isActive && (e.currentTarget.style.background = c.surfaceElevated)}
                        onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: clr, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? clr : c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cl.client}
                          </span>
                          <span style={{ fontSize: 10, color: c.subtext, background: c.surfaceElevated, padding: '1px 6px', borderRadius: 8, flexShrink: 0 }}>
                            {cl.workCount}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, flexShrink: 0 }}>
                          <span style={{ color: c.subtext }}>{formatCurrency(cl.revenue)}</span>
                          <span style={{ color: '#4CAF50', fontWeight: 700 }}>{formatCurrency(cl.profit)}</span>
                          <span style={{ color: clr, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Right column: donut + work types */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Donut */}
                <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'flex-start' }}>
                    Profit Share
                  </div>
                  <Donut clients={clients} size={110} />
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {clients.slice(0, 5).map(cl => (
                      <div key={cl.client} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colorFor(cl.client), flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: c.subtext, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cl.client}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>
                          {summary.totalProfit > 0 ? ((cl.profit / summary.totalProfit) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Work Types */}
                {workTypes.length > 0 && (
                  <Card style={{ padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Work Types
                    </div>
                    {workTypes.slice(0, 6).map(wt => (
                      <div key={wt.type} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: c.text }}>{wt.type || 'Other'}</span>
                          <span style={{ fontSize: 11, color: c.subtext }}>{wt.count}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: c.border }}>
                          <div style={{
                            height: '100%', borderRadius: 2, background: c.accent,
                            width: `${(wt.count / summary.totalWorks) * 100}%`,
                            transition: 'width 600ms ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </Card>
                )}

                {/* Status breakdown */}
                {data.statusBreakdown && Object.keys(data.statusBreakdown).length > 0 && (
                  <Card style={{ padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      By Status
                    </div>
                    {Object.entries(data.statusBreakdown).map(([s, count]) => {
                      const cfg = getStatus(s);
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: c.text, flex: 1 }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: cfg.fg }}>{count}</span>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Quick link to works table */}
          {summary.totalWorks > 0 && (
            <button onClick={() => setView('works')} style={{
              width: '100%', padding: '11px', borderRadius: 12,
              border: `1px solid ${c.cardBorder}`,
              background: c.surfaceElevated, color: c.accent,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              fontSize: 13, fontWeight: 600,
              transition: 'all 150ms ease',
              marginBottom: 16,
            }}>
              View all {summary.totalWorks} works →
            </button>
          )}
        </>
      )}

      {/* ── WORKS TABLE TAB ── */}
      {!loading && data && view === 'works' && (
        <Card style={{ marginBottom: 20 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                Works
                {activeClient && (
                  <span style={{ marginLeft: 8, color: colorFor(activeClient), fontSize: 13 }}>— {activeClient}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: c.subtext, marginTop: 2 }}>
                {filteredWorks.length} of {allWorks.length} entries
                {activeClient && (
                  <button onClick={() => setActiveClient(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: c.accent, fontSize: 12, padding: '0 6px', marginLeft: 4,
                  }}>× Clear filter</button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input style={{ ...inputStyle, width: 180 }}
                placeholder="Search works…"
                value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="Complete">Complete</option>
                <option value="Done">Done</option>
                <option value="In progress">In Progress</option>
                <option value="Not started">Not Started</option>
                <option value="To-do">To-Do</option>
              </select>
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date">Date ↓</option>
                <option value="profit">Profit ↓</option>
                <option value="price">Price ↓</option>
              </select>
            </div>
          </div>

          {/* Client filter chips */}
          {clients.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              <button onClick={() => setActiveClient(null)} style={{
                padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                background: !activeClient ? c.accentLight : c.surfaceElevated,
                border: !activeClient ? `1px solid ${c.accent}55` : `1px solid ${c.border}`,
                color: !activeClient ? c.accent : c.subtext,
                fontSize: 11, fontWeight: !activeClient ? 700 : 400,
                fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease',
              }}>All</button>
              {clients.map(cl => {
                const clr = colorFor(cl.client);
                const isActive = activeClient === cl.client;
                return (
                  <button key={cl.client} onClick={() => setActiveClient(isActive ? null : cl.client)} style={{
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    background: isActive ? `${clr}18` : 'transparent',
                    border: isActive ? `1px solid ${clr}55` : `1px solid ${c.border}`,
                    color: isActive ? clr : c.subtext,
                    fontSize: 11, fontWeight: isActive ? 700 : 400,
                    fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease',
                  }}>
                    {cl.client} <span style={{ opacity: 0.7 }}>({cl.workCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Works table — horizontally scrollable on mobile */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '3fr 1.2fr 1fr 1fr 1fr 1.2fr',
            minWidth: 560,
            gap: 8, padding: '7px 12px',
            borderBottom: `1px solid ${c.border}`,
            fontSize: 10.5, fontWeight: 700, color: c.subtext,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <div>Work / Date</div>
            <div>Client</div>
            <div style={{ textAlign: 'right' }}>Price</div>
            <div style={{ textAlign: 'right' }}>Designer</div>
            <div style={{ textAlign: 'right' }}>Profit</div>
            <div style={{ textAlign: 'center' }}>Status</div>
          </div>

          {/* Rows */}
          {filteredWorks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: c.subtext, fontSize: 14 }}>
              No works match your filters.
            </div>
          ) : (
            filteredWorks.map((w, i) => {
              const clr = w.client ? colorFor(w.client) : c.subtext;
              return (
                <div key={w.id} style={{
                  display: 'grid', gridTemplateColumns: '3fr 1.2fr 1fr 1fr 1fr 1.2fr', minWidth: 560,
                  gap: 8, padding: '11px 12px', alignItems: 'center',
                  borderBottom: i < filteredWorks.length - 1 ? `1px solid ${c.border}` : 'none',
                  transition: 'background 100ms ease',
                  borderRadius: i === filteredWorks.length - 1 ? '0 0 12px 12px' : 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = c.surfaceElevated}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: c.text, lineHeight: 1.3 }}>{w.work}</div>
                    {w.date && (
                      <div style={{ fontSize: 11, color: c.subtext, marginTop: 2 }}>
                        {new Date(w.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {w.workType && <span style={{ marginLeft: 6, color: c.accent, opacity: 0.8 }}>· {w.workType}</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    {w.client ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                        background: `${clr}18`, color: clr, display: 'inline-block',
                        border: `1px solid ${clr}30`,
                      }}>{w.client}</span>
                    ) : <span style={{ fontSize: 12, color: c.subtext }}>—</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text, textAlign: 'right' }}>
                    {formatCurrency(w.price)}
                  </div>
                  <div style={{ fontSize: 13, color: '#F44336', textAlign: 'right' }}>
                    {w.designerPay > 0 ? `−${formatCurrency(w.designerPay)}` : <span style={{ color: c.subtext }}>—</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4CAF50', textAlign: 'right' }}>
                    {formatCurrency(w.profit)}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <StatusBadge status={w.status} />
                  </div>
                </div>
              );
            })
          )}

          {/* Footer totals */}
          {filteredWorks.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '3fr 1.2fr 1fr 1fr 1fr 1.2fr', minWidth: 560,
              gap: 8, padding: '11px 12px',
              borderTop: `2px solid ${c.border}`,
              background: c.surfaceElevated,
              borderRadius: '0 0 14px 14px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.subtext, letterSpacing: '0.08em' }}>
                TOTAL · {filteredWorks.length} works
              </div>
              <div />
              <div style={{ fontSize: 13, fontWeight: 800, color: c.accent, textAlign: 'right' }}>
                {formatCurrency(filteredWorks.reduce((s, w) => s + w.price, 0))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F44336', textAlign: 'right' }}>
                −{formatCurrency(filteredWorks.reduce((s, w) => s + w.designerPay, 0))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4CAF50', textAlign: 'right' }}>
                {formatCurrency(filteredWorks.reduce((s, w) => s + w.profit, 0))}
              </div>
              <div />
            </div>
          )}
          </div> {/* end scroll wrapper */}
        </Card>
      )}

      {/* ── FOOTER TIP ── */}
      <div style={{
        marginTop: 4, padding: '12px 16px', borderRadius: 12,
        background: c.surfaceElevated, border: `1px solid ${c.border}`,
        fontSize: 12, color: c.subtext, lineHeight: 1.6,
      }}>
        <strong style={{ color: c.text }}>Live sync:</strong> Data comes from your Notion
        {' '}<strong style={{ color: c.text }}>Works (Master Database)</strong>.
        Set the <strong style={{ color: c.text }}>Date</strong> field on each entry and it will
        appear in the right month automatically. Hit refresh to update.
      </div>

    </div>
  );
};
