const axios = require('axios');
const config = require('../config');

/**
 * Google Cloud Vision OCR
 */
const runGoogleVision = async (imageBase64) => {
  const apiKey = config.ocrApiKey;
  if (!apiKey) throw new Error('Google Vision API key not configured');

  const res = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        },
      ],
    }
  );

  const text = res.data.responses?.[0]?.fullTextAnnotation?.text || '';
  return text;
};

/**
 * Extract amount from text
 */
const extractAmount = (text) => {
  const patterns = [
    /(?:total|grand total|amount|net amount|bill amount)[:\s]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/gi,
    /(?:₹|rs\.?)\s*([\d,]+\.?\d*)/gi,
    /\b([\d,]+\.\d{2})\b/g,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const raw = matches[matches.length - 1][1].replace(/,/g, '');
      const amount = parseFloat(raw);
      if (!isNaN(amount) && amount > 0 && amount < 1000000) {
        return amount;
      }
    }
  }
  return null;
};

/**
 * Guess category from text
 */
const guessCategory = (text) => {
  const lower = text.toLowerCase();
  const rules = [
    { keywords: ['restaurant', 'cafe', 'food', 'pizza', 'biryani', 'swiggy', 'zomato'], category: 'food' },
    { keywords: ['uber', 'ola', 'petrol', 'fuel', 'toll', 'metro', 'parking'], category: 'transport' },
    { keywords: ['electricity', 'water bill', 'gas', 'broadband', 'recharge'], category: 'bills' },
    { keywords: ['cinema', 'movie', 'netflix', 'spotify', 'game'], category: 'entertainment' },
    { keywords: ['mutual fund', 'sip', 'stock', 'investment', 'savings'], category: 'savings' },
    { keywords: ['amazon', 'flipkart', 'myntra', 'supermarket', 'grocery', 'mart'], category: 'shopping' },
    { keywords: ['pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'medicine'], category: 'health' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) return rule.category;
  }
  return 'shopping';
};

const scanReceipt = async (imageBase64) => {
  const text = await runGoogleVision(imageBase64);
  const amount = extractAmount(text);
  const category = guessCategory(text);
  return { text, amount, category };
};

module.exports = { scanReceipt, extractAmount, guessCategory };
