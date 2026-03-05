const express = require('express');
const router = express.Router();
const ocrService = require('../services/ocrService');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/ocr/scan
router.post('/scan', asyncHandler(async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ message: 'No image provided' });
  const result = await ocrService.scanReceipt(image);
  res.json(result);
}));

module.exports = router;
