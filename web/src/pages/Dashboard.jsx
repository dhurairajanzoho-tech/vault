import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { useExpenses } from '../../../shared/hooks/useExpenses.js';
import { useIncome } from '../../../shared/hooks/useIncome.js';
import { useBudget } from '../../../shared/hooks/useBudget.js';
import { formatCurrency } from '../../../shared/utils/formatCurrency.js';
import {
  getMonthLabel, getMonthKey, isLastThreeDaysOfMonth, getLastSixMonths,
} from '../../../shared/utils/dateUtils.js';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';
import { AlertBanner } from '../components/common/AlertBanner';
import { DonutChart } from '../components/charts/DonutChart';
import { Modal } from '../components/common/Modal';
import { AddExpenseForm } from '../components/forms/AddExpenseForm';
import { useApp } from '../context/AppContext';
import notionClient from '../../../shared/utils/notionClient.js';
import { Banknote, CreditCard, PiggyBank, PieChart, Target, BarChart2 } from 'lucide-react';
import { CategoryIcon } from '../utils/categoryIcons';

// ── helpers ───────────────────────────────────────────────────────────────────

const getPrevMonthKey = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // go back 1 month
  return getMonthKey(d);
};

const calcDelta = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// ── DeltaBadge ────────────────────────────────────────────────────────────────

const DeltaBadge = ({ delta, inverse = false }) => {
  if (delta === null || delta === undefined) return null;
  const isNeutral = Math.abs(delta) < 0.5;
  // For expenses (inverse=true): going up is bad → red; going down is good → green
  const isGood = isNeutral ? null : (inverse ? delta < 0 : delta > 0);
  const color = isNeutral ? '#666' : isGood ? '#4CAF50' : '#F44336';
  const arrow = isNeutral ? '→' : delta > 0 ? '↑' : '↓';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 11, fontWeight: 700, color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: '2px 8px',
      marginTop: 6,
    }}>
      {arrow} {Math.abs(delta).toFixed(1)}% vs last month
    </span>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard = ({ title, icon, amount, subtitle, color, loading, delta, deltaInverse }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const isMobile = useMobile();

  if (loading) return <CardSkeleton />;

  return (
    <Card>
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: c.subtext,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
        }}>
          {icon} {title}
        </div>
        <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: color || c.text, letterSpacing: '-0.02em' }}>
          {formatCurrency(amount)}
        </div>
        {subtitle && !isMobile && (
          <div style={{ fontSize: 11, color: c.subtext, marginTop: 5 }}>{subtitle}</div>
        )}
        <DeltaBadge delta={delta} inverse={deltaInverse} />
      </div>
    </Card>
  );
};

// ── MonthSelector ─────────────────────────────────────────────────────────────

const MonthSelector = ({ selectedMonth, onChange }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const months = getLastSixMonths();

  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto',
      padding: '2px 0 6px', scrollbarWidth: 'none',
    }}>
      {months.map(({ key, label }) => {
        const isSelected = key === selectedMonth;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              border: isSelected ? `1.5px solid ${c.accent}` : `1.5px solid ${c.cardBorder}`,
              background: isSelected
                ? `linear-gradient(135deg, ${c.accent}28, ${c.accent}10)`
                : c.surfaceElevated,
              color: isSelected ? c.accent : c.subtext,
              fontSize: 12, fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 150ms ease',
              boxShadow: isSelected ? `0 0 14px ${c.accent}30` : 'none',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { theme } = useTheme();
  const { defaultPaymentMethod } = useApp();
  const c = theme.colors;
  const isMobile = useMobile();

  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [prevStats, setPrevStats] = useState(null);

  const { expenses, loading: expLoading, totalSpent, byCategory, addExpense } = useExpenses(selectedMonth);
  const { totalIncome, workSalary, sideHustleTotal, loading: incLoading } = useIncome(selectedMonth);
  const { getBudgetStatus, loading: budLoading } = useBudget();

  const [showAddModal, setShowAddModal] = useState(false);

  const savings = totalIncome - totalSpent;
  const savingsPercent = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const loading = expLoading || incLoading;

  // Fetch previous month stats for delta badges
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prevMonth = getPrevMonthKey(selectedMonth);
        const data = await notionClient.getMonthStats(selectedMonth, prevMonth);
        if (!cancelled) setPrevStats(data.prev || null);
      } catch {
        if (!cancelled) setPrevStats(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMonth]);

  const budgetStatus = getBudgetStatus(byCategory);
  const alerts = budgetStatus
    .filter(b => b.isAlert && b.monthlyLimit > 0)
    .map(b => ({
      message: `${b.label}: ${formatCurrency(b.spent)} of ${formatCurrency(b.monthlyLimit)} limit`,
      percent: b.percent,
      type: b.status === 'exceeded' ? 'exceeded' : 'warning',
    }));

  const isCurrentMonth = selectedMonth === getMonthKey();
  const showStatsHint = isLastThreeDaysOfMonth() && isCurrentMonth;

  // For past months, build date from "YYYY-MM-15" to avoid timezone boundary issues
  const monthDate = new Date(selectedMonth + '-15');
  const monthLabel = getMonthLabel(monthDate);

  const handleAddExpense = async (data) => {
    await addExpense(data);
    setShowAddModal(false);
  };

  // Delta values (null = not loaded yet → badge hidden)
  const incomeDelta   = prevStats ? calcDelta(totalIncome, prevStats.totalIncome)    : null;
  const expensesDelta = prevStats ? calcDelta(totalSpent,  prevStats.totalExpenses)  : null;
  const savingsDelta  = prevStats ? calcDelta(savings,     prevStats.savings)        : null;

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>
              {monthLabel}
            </h1>
            <p style={{ color: c.subtext, fontSize: isMobile ? 12 : 14, marginTop: 3 }}>Your financial overview</p>
          </div>
          {showStatsHint && (
            <a href="/stats" style={{
              background: c.accentLight,
              border: `1px solid ${c.cardBorder}`,
              color: c.accent,
              borderRadius: 10,
              padding: isMobile ? '7px 12px' : '8px 16px',
              fontSize: 12, fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              <BarChart2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{isMobile ? 'Stats' : 'Month-end stats ready'}
            </a>
          )}
        </div>

        {/* Month pill selector */}
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Alert Banners */}
      <AlertBanner alerts={alerts} />

      {/* Stat Cards — 3 columns with delta badges */}
      <div className="stat-grid">
        <StatCard
          title="Total Income"
          icon={<Banknote size={18} />}
          amount={totalIncome}
          subtitle={`Salary ₹${(workSalary.amount / 1000).toFixed(0)}K + Side ₹${(sideHustleTotal / 1000).toFixed(1)}K`}
          color={c.accent}
          loading={loading}
          delta={incomeDelta}
          deltaInverse={false}
        />
        <StatCard
          title="Total Expenses"
          icon={<CreditCard size={18} />}
          amount={totalSpent}
          subtitle={`${expenses.length} transactions`}
          color="#F44336"
          loading={loading}
          delta={expensesDelta}
          deltaInverse={true}
        />
        <StatCard
          title="Savings"
          icon={<PiggyBank size={18} />}
          amount={savings}
          subtitle={`${savingsPercent.toFixed(1)}% of income saved`}
          color="#4CAF50"
          loading={loading}
          delta={savingsDelta}
          deltaInverse={false}
        />
      </div>

      {/* Bottom Section */}
      <div className="two-col-grid">
        {/* Donut Chart */}
        <Card>
          <CardHeader title="Spending by Category" icon={<PieChart size={14} />} />
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: 150, height: 150, borderRadius: '50%' }} />
            </div>
          ) : (
            <DonutChart data={byCategory} size="mini" />
          )}
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader title="Budget Status" icon={<Target size={14} />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {budLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 36 }} className="skeleton" />
              ))
            ) : (
              budgetStatus.filter(b => b.monthlyLimit > 0).slice(0, 5).map(b => (
                <div key={b.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CategoryIcon id={b.id} size={13} color={b.color} />{b.label}
                    </span>
                    <span style={{ fontSize: 12, color: c.subtext }}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill fill-${b.status}`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
            {!budLoading && budgetStatus.filter(b => b.monthlyLimit > 0).length === 0 && (
              <p style={{ color: c.subtext, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No budget limits set yet.{' '}
                <a href="/budget" style={{ color: c.accent }}>Set them →</a>
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fab-btn"
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 100,
          width: 56, height: 56,
          background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
          border: 'none', borderRadius: '50%',
          cursor: 'pointer', fontSize: 24,
          boxShadow: `0 4px 20px ${c.accent}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          zIndex: 100,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 8px 30px ${c.accent}88`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 20px ${c.accent}66`;
        }}
        title="Add Expense"
      >
        +
      </button>

      {/* Add Expense Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Expense">
        <AddExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setShowAddModal(false)}
          defaultPaymentMethod={defaultPaymentMethod}
        />
      </Modal>
    </div>
  );
};
