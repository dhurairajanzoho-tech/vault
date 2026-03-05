const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const cache = require('../services/cache');
const { asyncHandler } = require('../middleware/errorHandler');

const getDbId = () => {
  const cfg = config.getLocalConfig();
  return config.expensesDbId || cfg.expensesDbId;
};

// GET /api/expenses
router.get('/', asyncHandler(async (req, res) => {
  const { month, category, paymentMethod, search } = req.query;
  const dbId = getDbId();
  if (!dbId) return res.json({ expenses: [] });

  // Cache raw expenses per month (filters are applied in-memory below)
  const cacheKey = `expenses:${dbId}:${month || 'all'}`;
  let expenses = cache.get(cacheKey);

  if (!expenses) {
    expenses = await notionService.getExpenses(dbId, month);
    cache.set(cacheKey, expenses);
  }

  // Apply client-side filters without extra Notion calls
  let result = [...expenses];
  if (category) result = result.filter(e => e.category === category);
  if (paymentMethod) result = result.filter(e => e.paymentMethod === paymentMethod);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(e =>
      e.name.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q)
    );
  }

  res.json({ expenses: result });
}));

// POST /api/expenses
router.post('/', asyncHandler(async (req, res) => {
  const dbId = getDbId();
  if (!dbId) return res.status(400).json({ message: 'Expenses DB not configured' });
  const expense = await notionService.createExpense(dbId, req.body);
  // Bust cache so next read is fresh
  cache.invalidatePrefix(`expenses:${dbId}:`);
  cache.invalidatePrefix('stats:');
  res.status(201).json(expense);
}));

// PATCH /api/expenses/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const expense = await notionService.updateExpense(req.params.id, req.body);
  const dbId = getDbId();
  cache.invalidatePrefix(`expenses:${dbId}:`);
  cache.invalidatePrefix('stats:');
  res.json(expense);
}));

// DELETE /api/expenses/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await notionService.deleteExpense(req.params.id);
  const dbId = getDbId();
  cache.invalidatePrefix(`expenses:${dbId}:`);
  cache.invalidatePrefix('stats:');
  res.json({ success: true });
}));

module.exports = router;
