const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const cache = require('../services/cache');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/income
router.get('/', asyncHandler(async (req, res) => {
  const { month } = req.query;
  const cfg = config.getLocalConfig();

  const incomeDbId = config.incomeDbId || cfg.incomeDbId;
  const sideHustleDbId = config.sideHustleDbId || cfg.sideHustleDbId;
  const amountField = config.sideHustleAmountField || cfg.sideHustleAmountField;
  const dateField = config.sideHustleDateField || cfg.sideHustleDateField;
  const sourceField = config.sideHustleSourceField || cfg.sideHustleSourceField;

  const cacheKey = `income:${incomeDbId || 'none'}:${sideHustleDbId || 'none'}:${month || 'all'}`;
  let income = cache.get(cacheKey);

  if (!income) {
    income = [];

    if (incomeDbId) {
      const mainIncome = await notionService.getIncome(incomeDbId, month);
      income.push(...mainIncome);
    }

    if (sideHustleDbId && amountField && dateField) {
      const sideHustle = await notionService.getSideHustleIncome(
        sideHustleDbId, amountField, dateField, sourceField, month
      );
      income.push(...sideHustle);
    }

    income.sort((a, b) => new Date(b.date) - new Date(a.date));
    cache.set(cacheKey, income);
  }

  res.json({ income });
}));

// POST /api/income
router.post('/', asyncHandler(async (req, res) => {
  const cfg = config.getLocalConfig();
  const incomeDbId = config.incomeDbId || cfg.incomeDbId;
  if (!incomeDbId) return res.status(400).json({ message: 'Income DB not configured' });
  const entry = await notionService.createIncome(incomeDbId, req.body);
  // Bust cache
  cache.invalidatePrefix('income:');
  cache.invalidatePrefix('stats:');
  res.status(201).json(entry);
}));

module.exports = router;
