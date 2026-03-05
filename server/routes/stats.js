const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const cache = require('../services/cache');
const { asyncHandler } = require('../middleware/errorHandler');

const getLastSixMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push({
      key: `${y}-${m}`,
      label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    });
  }
  return months;
};

// GET /api/stats?month=2024-01
// Supports optional ?prevMonth=2024-12 to include previous month delta
router.get('/', asyncHandler(async (req, res) => {
  const cfg = config.getLocalConfig();
  const expensesDbId = config.expensesDbId || cfg.expensesDbId;
  const incomeDbId = config.incomeDbId || cfg.incomeDbId;
  const sideHustleDbId = config.sideHustleDbId || cfg.sideHustleDbId;
  const amountField = config.sideHustleAmountField || cfg.sideHustleAmountField;
  const dateField = config.sideHustleDateField || cfg.sideHustleDateField;

  const now = new Date();
  const monthKey = req.query.month ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Optional: caller can request previous month stats for delta calculation
  const prevMonthKey = req.query.prevMonth || null;

  const cacheKey = `stats:${monthKey}:${prevMonthKey || 'none'}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const fetchMonthStats = async (mk) => {
    const [expenses, mainIncome, sideHustle] = await Promise.all([
      expensesDbId ? notionService.getExpenses(expensesDbId, mk) : Promise.resolve([]),
      incomeDbId ? notionService.getIncome(incomeDbId, mk) : Promise.resolve([]),
      (sideHustleDbId && amountField && dateField)
        ? notionService.getSideHustleIncome(sideHustleDbId, amountField, dateField, '', mk)
        : Promise.resolve([]),
    ]);

    const allIncome = [...mainIncome, ...sideHustle];
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = allIncome.reduce((s, i) => s + i.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsPercent = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const categoryBreakdown = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const top3 = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));

    return { month: mk, totalIncome, totalExpenses, savings, savingsPercent, categoryBreakdown, top3 };
  };

  // Fetch current month (and optionally previous month in parallel)
  const [current, prev] = await Promise.all([
    fetchMonthStats(monthKey),
    prevMonthKey ? fetchMonthStats(prevMonthKey) : Promise.resolve(null),
  ]);

  const result = { ...current };

  // Attach previous month data for delta calculation on the frontend
  if (prev) {
    result.prev = {
      month: prev.month,
      totalIncome: prev.totalIncome,
      totalExpenses: prev.totalExpenses,
      savings: prev.savings,
    };
  }

  cache.set(cacheKey, result);
  res.json(result);
}));

// GET /api/stats/trend — last 6 months
router.get('/trend', asyncHandler(async (req, res) => {
  const cfg = config.getLocalConfig();
  const expensesDbId = config.expensesDbId || cfg.expensesDbId;
  const incomeDbId = config.incomeDbId || cfg.incomeDbId;

  const cacheKey = 'stats:trend';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const months = getLastSixMonths();
  const trend = [];

  for (const { key, label } of months) {
    const [expenses, income] = await Promise.all([
      expensesDbId ? notionService.getExpenses(expensesDbId, key) : Promise.resolve([]),
      incomeDbId ? notionService.getIncome(incomeDbId, key) : Promise.resolve([]),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);
    const savings = totalIncome - totalExpenses;

    trend.push({ month: key, label, totalIncome, totalExpenses, savings });
  }

  const result = { trend };
  cache.set(cacheKey, result, 120_000); // 2 minute TTL for trend (6 months of data)
  res.json(result);
}));

module.exports = router;
