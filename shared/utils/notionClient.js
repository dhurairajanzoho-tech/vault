/**
 * Notion API Client — wraps all API calls to the backend server
 * The actual Notion API key is kept server-side; web/mobile call /api/*
 */

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : '';

class NotionClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `API error ${res.status}`);
    }
    return res.json();
  }

  // ── Expenses ──────────────────────────────────────────────
  getExpenses(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/api/expenses${params ? `?${params}` : ''}`);
  }

  createExpense(data) {
    return this.request('/api/expenses', { method: 'POST', body: data });
  }

  updateExpense(id, data) {
    return this.request(`/api/expenses/${id}`, { method: 'PATCH', body: data });
  }

  deleteExpense(id) {
    return this.request(`/api/expenses/${id}`, { method: 'DELETE' });
  }

  // ── Income ────────────────────────────────────────────────
  getIncome(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/api/income${params ? `?${params}` : ''}`);
  }

  createIncome(data) {
    return this.request('/api/income', { method: 'POST', body: data });
  }

  // ── Budget Limits ─────────────────────────────────────────
  getBudgetLimits() {
    return this.request('/api/budget');
  }

  upsertBudgetLimit(data) {
    return this.request('/api/budget', { method: 'POST', body: data });
  }

  // ── Recurring Expenses ────────────────────────────────────
  getRecurring() {
    return this.request('/api/recurring');
  }

  createRecurring(data) {
    return this.request('/api/recurring', { method: 'POST', body: data });
  }

  updateRecurring(id, data) {
    return this.request(`/api/recurring/${id}`, { method: 'PATCH', body: data });
  }

  deleteRecurring(id) {
    return this.request(`/api/recurring/${id}`, { method: 'DELETE' });
  }

  // ── Setup ─────────────────────────────────────────────────
  setupDatabases(config) {
    return this.request('/api/setup/databases', { method: 'POST', body: config });
  }

  verifyNotionKey(apiKey, pageId) {
    return this.request('/api/setup/verify', { method: 'POST', body: { apiKey, pageId } });
  }

  mapSideHustleDB(mapping) {
    return this.request('/api/setup/sidehustle', { method: 'POST', body: mapping });
  }

  getSideHustleFields(dbId) {
    return this.request(`/api/setup/sidehustle/fields?dbId=${dbId}`);
  }

  // ── Stats ─────────────────────────────────────────────────
  getMonthStats(month, prevMonth = null) {
    const params = new URLSearchParams({ month });
    if (prevMonth) params.set('prevMonth', prevMonth);
    return this.request(`/api/stats?${params.toString()}`);
  }

  getSixMonthTrend() {
    return this.request('/api/stats/trend');
  }

  // ── OCR ───────────────────────────────────────────────────
  scanReceipt(imageBase64) {
    return this.request('/api/ocr/scan', { method: 'POST', body: { image: imageBase64 } });
  }
}

export const notionClient = new NotionClient();
export default notionClient;
