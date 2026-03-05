/**
 * Date utility helpers
 */

export const getMonthLabel = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
};

export const getMonthKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
};

export const todayISO = () => new Date().toISOString().split('T')[0];

export const isLastThreeDaysOfMonth = (date = new Date()) => {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() >= lastDay - 2;
};

export const getLastDayOfMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getLastSixMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const short = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(d);
    const label = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
    months.push({ key: getMonthKey(d), short, label });
  }
  return months;
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
};
