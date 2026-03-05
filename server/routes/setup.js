const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/setup/verify
router.post('/verify', asyncHandler(async (req, res) => {
  const { apiKey, pageId } = req.body;
  if (!apiKey || !pageId) return res.status(400).json({ message: 'apiKey and pageId required' });
  const result = await notionService.verifyConnection(apiKey, pageId);
  res.json(result);
}));

// POST /api/setup/databases
router.post('/databases', asyncHandler(async (req, res) => {
  const { apiKey, parentPageId } = req.body;
  if (!apiKey || !parentPageId) return res.status(400).json({ message: 'apiKey and parentPageId required' });

  const dbIds = await notionService.setupAllDatabases(apiKey, parentPageId);

  config.saveLocalConfig({
    notionApiKey: apiKey,
    notionParentPageId: parentPageId,
    expensesDbId: dbIds.expenses,
    incomeDbId: dbIds.income,
    budgetDbId: dbIds.budget,
    recurringDbId: dbIds.recurring,
  });

  notionService.reinitClient(apiKey);

  res.json({ success: true, dbIds });
}));

// GET /api/setup/sidehustle/fields
router.get('/sidehustle/fields', asyncHandler(async (req, res) => {
  const { dbId } = req.query;
  if (!dbId) return res.status(400).json({ message: 'dbId required' });
  const fields = await notionService.getSideHustleFields(dbId);
  res.json({ fields });
}));

// POST /api/setup/sidehustle
router.post('/sidehustle', asyncHandler(async (req, res) => {
  const { dbId, amountField, dateField, sourceField } = req.body;
  if (!dbId || !amountField || !dateField) {
    return res.status(400).json({ message: 'dbId, amountField, dateField required' });
  }
  config.saveLocalConfig({
    sideHustleDbId: dbId,
    sideHustleAmountField: amountField,
    sideHustleDateField: dateField,
    sideHustleSourceField: sourceField || '',
  });
  res.json({ success: true });
}));

// GET /api/setup/status
router.get('/status', asyncHandler(async (req, res) => {
  const cfg = config.getLocalConfig();
  res.json({
    configured: config.isConfigured(),
    hasExpensesDb: !!(config.expensesDbId || cfg.expensesDbId),
    hasIncomeDb: !!(config.incomeDbId || cfg.incomeDbId),
    hasBudgetDb: !!(config.budgetDbId || cfg.budgetDbId),
    hasRecurringDb: !!(config.recurringDbId || cfg.recurringDbId),
    hasSideHustle: !!(config.sideHustleDbId || cfg.sideHustleDbId),
  });
}));

// GET /api/stats
router.get('/', asyncHandler(async (req, res) => {
  res.json({ message: 'Stats route' });
}));

module.exports = router;
