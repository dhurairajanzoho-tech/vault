const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');

const getDbId = () => {
  const cfg = config.getLocalConfig();
  return config.budgetDbId || cfg.budgetDbId;
};

// GET /api/budget
router.get('/', asyncHandler(async (req, res) => {
  const dbId = getDbId();
  if (!dbId) return res.json({ budgetLimits: [] });
  const budgetLimits = await notionService.getBudgetLimits(dbId);
  res.json({ budgetLimits });
}));

// POST /api/budget (upsert)
router.post('/', asyncHandler(async (req, res) => {
  const dbId = getDbId();
  if (!dbId) return res.status(400).json({ message: 'Budget DB not configured' });
  const limit = await notionService.upsertBudgetLimit(dbId, req.body);
  res.json(limit);
}));

module.exports = router;
