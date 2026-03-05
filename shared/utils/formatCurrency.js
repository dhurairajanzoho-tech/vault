/**
 * Format number as Indian Rupee (₹1,00,000 format)
 */
export const formatCurrency = (amount, options = {}) => {
  const { compact = false, showSign = false } = options;

  if (compact && Math.abs(amount) >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(1)}L`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `₹${k.toFixed(1)}K`;
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign && amount < 0) return `-${formatted}`;
  if (showSign && amount > 0) return `+${formatted}`;
  return formatted;
};

export const formatNumber = (num) =>
  new Intl.NumberFormat('en-IN').format(num);

export const parseAmount = (str) => {
  const cleaned = String(str).replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
