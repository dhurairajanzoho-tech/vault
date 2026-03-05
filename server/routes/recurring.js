const express = require('express');
const router = express.Router();
const notionService = require('../services/notionService');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');

const getDbId = () => {
  const cfg = config.getLocalConfig();
  return config.recurringDbId || cfg.recurringDbId;
};

router.get('/', asyncHandler(async (req, res) => {
  const dbId = getDbId();
  if (!dbId) return res.json({ recurring: [] });
  const recurring = await notionService.getRecurring(dbId);
  res.json({ recurring });
}));

router.post('/', asyncHandler(async (req, res) => {
  const dbId = getDbId();
  if (!dbId) return res.status(400).json({ message: 'Recurring DB not configured' });
  const item = await notionService.createRecurring(dbId, req.body);
  res.status(201).json(item);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const item = await notionService.updateRecurring(req.params.id, req.body);
  res.json(item);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await notionService.deleteRecurring(req.params.id);
  res.json({ success: true });
}));

module.exports = router;
