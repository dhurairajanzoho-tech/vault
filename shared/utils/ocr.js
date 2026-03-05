/**
 * Client-side OCR using Tesseract.js
 * Falls back to server-side Google Cloud Vision if API key is set
 */

import notionClient from './notionClient.js';

/**
 * Convert file/blob to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract amount from OCR text
 */
export const extractAmount = (text) => {
  // Patterns: ₹ 1,234.56 | Rs. 1234 | Total: 500 | TOTAL 1500.00
  const patterns = [
    /(?:total|amount|grand total|net amount|bill amount)[:\s]*(?:₹|rs\.?|inr)?\s*([\d,]+\.?\d*)/gi,
    /(?:₹|rs\.?)\s*([\d,]+\.?\d*)/gi,
    /\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      // Take the last match (usually the total at bottom)
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
 * Guess category from receipt text
 */
export const guessCategory = (text) => {
  const lower = text.toLowerCase();
  const rules = [
    { keywords: ['restaurant', 'cafe', 'food', 'pizza', 'burger', 'hotel', 'biryani', 'swiggy', 'zomato', 'dining'], category: 'food' },
    { keywords: ['uber', 'ola', 'petrol', 'fuel', 'parking', 'toll', 'metro', 'bus', 'auto', 'cab'], category: 'transport' },
    { keywords: ['electricity', 'electric', 'water bill', 'gas', 'broadband', 'internet', 'recharge', 'mobile bill'], category: 'bills' },
    { keywords: ['cinema', 'movie', 'netflix', 'spotify', 'amazon prime', 'game', 'entertainment'], category: 'entertainment' },
    { keywords: ['mutual fund', 'sip', 'stock', 'investment', 'savings', 'fd', 'ppf'], category: 'savings' },
    { keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'store', 'mart', 'supermarket', 'grocery'], category: 'shopping' },
    { keywords: ['pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'medicine', 'health'], category: 'health' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.category;
    }
  }
  return 'shopping'; // default
};

/**
 * Run Tesseract OCR on an image file (client-side)
 */
export const runTesseractOCR = async (file) => {
  try {
    // Dynamic import to avoid bundle issues
    const Tesseract = await import('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: () => {}, // suppress logs
    });
    return text;
  } catch (err) {
    console.error('Tesseract OCR error:', err);
    throw new Error('OCR failed. Please enter amount manually.');
  }
};

/**
 * Full receipt scan pipeline
 */
export const scanReceipt = async (file, useServerOCR = false) => {
  let text = '';

  if (useServerOCR) {
    const base64 = await fileToBase64(file);
    const result = await notionClient.scanReceipt(base64);
    text = result.text || '';
  } else {
    text = await runTesseractOCR(file);
  }

  const amount = extractAmount(text);
  const category = guessCategory(text);

  return { text, amount, category };
};
