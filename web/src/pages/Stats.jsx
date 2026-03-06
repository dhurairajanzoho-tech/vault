import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import notionClient from '../../../shared/utils/notionClient.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import { getMonthLabel, getMonthKey, getLastSixMonths } from '../../../shared/utils/dateUtils.js';
import { DEFAULT_CATEGORIES } from '../../../shared/constants/categories.js';
import { Card, CardHeader } from '../components/common/Card';
import { DonutChart } from '../components/charts/DonutChart';
import { TrendChart } from '../components/charts/TrendChart';
import { SkeletonList } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';

// ── PDF export ────────────────────────────────────────────────────────────────

const exportPDF = async (stats) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const month = stats.month;

  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text('VAULT — Monthly Report', 20, 25);

  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(getMonthLabel(new Date(month + '-01')), 20, 38);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const data = [
    ['Total Income', formatCurrency(stats.totalIncome)],
    ['Total Expenses', formatCurrency(stats.totalExpenses)],
    ['Savings', formatCurrency(stats.savings)],
    ['Savings %', `${stats.savingsPercent?.toFixed(1)}%`],
  ];
  let y = 52;
  data.forEach(([label, value]) => {
    doc.text(label + ':', 20, y);
    doc.text(value, 120, y);
    y += 10;
  });

  y += 8;
  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text('Category Breakdown:', 20, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  Object.entries(stats.categoryBreakdown || {}).forEach(([cat, amt]) => {
    const label = DEFAULT_CATEGORIES.find(c => c.id === cat)?.label || cat;
    doc.text(label + ':', 20, y);
    doc.text(formatCurrency(amt), 120, y);
    y += 8;
  });

  doc.save(`vault-report-${month}.pdf`);
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
  }}>{m.short}</button>
);

// ── Savings Rate Ring ─────────────────────────────────────────────────────────

const SavingsRing = ({ percent, c }) => {
  const clamped = Math.min(Math.max(percent || 0, 0), 100);
  const color = clamped >= 30 ? '#4CAF50' : clamped >= 15 ? '#FF9800' : '#F44336';
  const r = 34;
  const stroke = 7;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={r * 2 + stroke * 2} height={r * 2 + stroke * 2} style={{ flexShrink: 0 }}>
        <circle
          cx={r + stroke} cy={r + stroke} r={r}
          fill="none" stroke={`${color}22`} strokeWidth={stroke}
        />
        <circle
          cx={r + stroke} cy={r + stroke} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${r + stroke} ${r + stroke})`}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text
          x={r + stroke} y={r + stroke + 5}
          textAnchor="middle" fontSize={12} fontWeight="800"
          fill={color} fontFamily="Inter, sans-serif"
        >{clamped.toFixed(0)}%</text>
      </svg>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color }}>
          {clamped >= 30 ? '🟢 Excellent' : clamped >= 20 ? '🟡 Good' : clamped >= 10 ? '🟠 Fair' : '🔴 Low'}
        </div>
        <div style={{ fontSize: 11, color: c.subtext, marginTop: 2 }}>Savings rate</div>
      </div>
    </div>
  );
};

// ── Stats Component ───────────────────────────────────────────────────────────

export const Stats = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const isMobile = useMobile();

  const months = getLastSixMonths();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('donut');
  const [month, setMonth] = useState(getMonthKey());
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [statsData, trendData] = await Promise.all([
        notionClient.getMonthStats(month),
        notionClient.getSixMonthTrend(),
      ]);
      setStats(statsData);
      setTrend(trendData.trend || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const handleExport = async () => {
    if (!stats) return;
    setExporting(true);
    try { await exportPDF(stats); }
    finally { setExporting(false); }
  };

  const btnTab = (active) => ({
    padding: '7px 15px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', fontWeight: active ? 700 : 400, fontSize: 12.5,
    background: active ? c.accent : 'transparent',
    color: active ? '#000' : c.subtext,
    transition: 'all 150ms ease',
  });

  const selectedLabel = months.find(m => m.key === month)?.label || month;

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: c.text }}>Statistics</h1>
          <p style={{ color: c.subtext, fontSize: 13, marginTop: 4 }}>{selectedLabel}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !stats}
          style={{
            background: c.accentLight, border: `1px solid ${c.cardBorder}`,
            color: c.accent, borderRadius: 10, padding: '9px 14px',
            cursor: exporting || !stats ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif',
            opacity: !stats ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {exporting ? (
            <span style={{
              width: 14, height: 14, border: `2px solid ${c.accent}44`,
              borderTopColor: c.accent, borderRadius: '50%',
              display: 'inline-block', animation: 'spin 0.7s linear infinite',
            }} />
          ) : '📄'} {isMobile ? 'PDF' : 'Export PDF'}
        </button>
      </div>

      {/* ── Month Pills ── */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        marginBottom: 28, scrollbarWidth: 'none',
      }}>
        {months.map(m => (
          <MonthPill key={m.key} m={m} isActive={m.key === month} onClick={setMonth} c={c} />
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : !stats ? (
        <Card><EmptyState type="stats" /></Card>
      ) : (
        <>
          {/* ── Summary Cards + Savings Ring ── */}
          <div className="stats-summary-grid">
            {[
              { label: 'Total Income', value: stats.totalIncome, color: c.accent, icon: '💵' },
              { label: 'Total Expenses', value: stats.totalExpenses, color: '#F44336', icon: '💳' },
              { label: 'Savings', value: stats.savings, color: '#4CAF50', icon: '💰' },
            ].map(item => (
              <div key={item.label} style={{
                background: c.surfaceElevated, border: `1px solid ${c.cardBorder}`,
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
            {/* Savings Rate Ring */}
            <div style={{
              background: c.surfaceElevated, border: `1px solid ${c.cardBorder}`,
              borderRadius: 14, padding: '16px 18px',
              display: 'flex', alignItems: 'center',
            }}>
              <SavingsRing percent={stats.savingsPercent} c={c} />
            </div>
          </div>

          {/* ── Top 3 Categories ── */}
          {stats.top3?.length > 0 && (
            <div style={{
              background: c.surface, border: `1px solid ${c.cardBorder}`,
              borderRadius: 16, padding: '18px 20px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 16 }}>
                🏆 Top Spending Categories
              </div>
              <div className="top3-grid">
                {stats.top3.map((item, i) => {
                  const cat = DEFAULT_CATEGORIES.find(c => c.id === item.category);
                  const medals = ['🥇', '🥈', '🥉'];
                  const pct = stats.totalExpenses > 0 ? ((item.amount / stats.totalExpenses) * 100).toFixed(0) : 0;
                  return (
                    <div key={i} style={{
                      flex: 1, padding: '16px', borderRadius: 14,
                      background: c.surfaceElevated,
                      border: `1px solid ${cat?.color || c.accent}22`,
                      textAlign: 'center', position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 14 }}>{medals[i]}</div>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>{cat?.icon || '💳'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>
                        {cat?.label || item.category}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#F44336', marginBottom: 4 }}>
                        {formatCurrency(item.amount)}
                      </div>
                      <div style={{ fontSize: 11, color: c.subtext }}>{pct}% of expenses</div>
                      <div style={{ height: 3, borderRadius: 2, background: c.border, marginTop: 10 }}>
                        <div style={{
                          height: '100%', borderRadius: 2, background: cat?.color || c.accent,
                          width: `${pct}%`, transition: 'width 600ms ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Category Breakdown Chart ── */}
          <div style={{
            background: c.surface, border: `1px solid ${c.cardBorder}`,
            borderRadius: 16, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>📊 Category Breakdown</div>
              <div style={{ display: 'flex', gap: 3, background: c.surfaceElevated, borderRadius: 10, padding: 3 }}>
                <button style={btnTab(chartMode === 'donut')} onClick={() => setChartMode('donut')}>Donut</button>
                <button style={btnTab(chartMode === 'bar')} onClick={() => setChartMode('bar')}>Bar</button>
              </div>
            </div>
            {chartMode === 'donut' ? (
              <DonutChart data={stats.categoryBreakdown} />
            ) : (
              <TrendChart
                data={Object.entries(stats.categoryBreakdown || {}).map(([key, value]) => {
                  const cat = DEFAULT_CATEGORIES.find(c => c.id === key);
                  return { label: cat?.label || key, totalExpenses: value, totalIncome: 0, savings: 0 };
                })}
              />
            )}
          </div>

          {/* ── 6-Month Trend ── */}
          {trend.length > 0 && (
            <div style={{
              background: c.surface, border: `1px solid ${c.cardBorder}`,
              borderRadius: 16, padding: '18px 20px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 16 }}>📈 6-Month Trend</div>
              <TrendChart data={trend} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
