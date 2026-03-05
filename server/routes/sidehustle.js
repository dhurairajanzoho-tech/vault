/**
 * /api/sidehustle
 *
 * Reads from your "Works (Master Database)" in Notion.
 * All data is fetched once and cached (90s TTL), then sliced in JS by month.
 *
 * Endpoints:
 *   GET /api/sidehustle             → current month data + summary
 *   GET /api/sidehustle?month=YYYY-MM  → specific month
 *   GET /api/sidehustle/trend       → last 6 months summary (for chart)
 *   GET /api/sidehustle/all         → all data across all months
 *   GET /api/sidehustle/months      → list of months that have data
 */

const express = require('express');
const router = express.Router();
const config = require('../config');
const cache = require('../services/cache');
const { asyncHandler } = require('../middleware/errorHandler');
const { Client } = require('@notionhq/client');

// ── Notion client ─────────────────────────────────────────────────────────────

const getNotion = () => {
  const key = config.notionApiKey || config.getLocalConfig().notionApiKey;
  return new Client({ auth: key });
};

// ── Master DB ID ──────────────────────────────────────────────────────────────

const MASTER_DB_ID = config.sideHustleDbId || '3159fc46d1268128becef112ef4a84f9';

// ── Property Helpers ──────────────────────────────────────────────────────────

const extractNumber = (page, prop) => {
  const p = page.properties?.[prop];
  if (!p) return 0;
  if (p.type === 'number')  return p.number  || 0;
  if (p.type === 'formula' && p.formula?.type === 'number') return p.formula.number || 0;
  if (p.type === 'rollup'  && p.rollup?.type  === 'number') return p.rollup.number  || 0;
  return p.number || 0;
};

const extractSelect = (page, prop) =>
  page.properties?.[prop]?.select?.name || '';

const extractStatus = (page, prop) =>
  page.properties?.[prop]?.status?.name || '';

const extractDate = (page, prop) =>
  page.properties?.[prop]?.date?.start || '';

const extractTitle = (page) => {
  const t = Object.values(page.properties).find(p => p.type === 'title');
  return t?.title?.[0]?.plain_text || '(untitled)';
};

const mapWork = (page) => ({
  id:          page.id,
  work:        extractTitle(page),
  client:      extractSelect(page, 'Sub Client'),
  workType:    extractSelect(page, 'Work Type'),
  price:       extractNumber(page, 'Price'),
  designerPay: extractNumber(page, 'designer payment'),
  profit:      extractNumber(page, 'Profit'),
  count:       extractNumber(page, 'Count') || 1,
  date:        extractDate(page,  'Date'),
  dueDate:     extractDate(page,  'Due Date'),
  status:      extractStatus(page, 'Status'),
  url:         page.url || '',
});

/** Paginated query — fetches ALL rows */
async function queryAll(notion, dbId) {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id:  dbId,
      sorts:        [{ property: 'Date', direction: 'descending' }],
      page_size:    100,
      start_cursor: cursor,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return pages;
}

/** Aggregate works into summary + client/workType groupings */
function aggregate(works) {
  const totalRevenue     = works.reduce((s, w) => s + w.price,       0);
  const totalDesignerPay = works.reduce((s, w) => s + w.designerPay, 0);
  const totalProfit      = works.reduce((s, w) => s + w.profit,      0);

  const clientMap = {};
  for (const w of works) {
    const k = w.client || 'Unassigned';
    if (!clientMap[k]) clientMap[k] = { client: k, revenue: 0, designerPay: 0, profit: 0, workCount: 0 };
    clientMap[k].revenue     += w.price;
    clientMap[k].designerPay += w.designerPay;
    clientMap[k].profit      += w.profit;
    clientMap[k].workCount   += 1;
  }

  const typeMap = {};
  for (const w of works) {
    const k = w.workType || 'Other';
    if (!typeMap[k]) typeMap[k] = { type: k, count: 0, revenue: 0, profit: 0 };
    typeMap[k].count   += 1;
    typeMap[k].revenue += w.price;
    typeMap[k].profit  += w.profit;
  }

  const statusMap = {};
  for (const w of works) {
    const s = w.status || 'Unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;
  }

  return {
    summary:         { totalRevenue, totalDesignerPay, totalProfit, totalWorks: works.length },
    clients:         Object.values(clientMap).sort((a, b) => b.profit  - a.profit),
    workTypes:       Object.values(typeMap).sort((a, b)   => b.count   - a.count),
    statusBreakdown: statusMap,
  };
}

/** Filter works by month using JS date comparison */
function filterByMonth(works, monthKey) {
  const [year, mon] = monthKey.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end   = new Date(year, mon,     0);
  return works.filter(w => {
    if (!w.date) return false;
    const d = new Date(w.date);
    return d >= start && d <= end;
  });
}

/** Fetch all works once, cache for 90s — re-used across all endpoints */
async function getAllWorksCached(notion) {
  const cacheKey = `sidehustle:all:${MASTER_DB_ID}`;
  let works = cache.get(cacheKey);
  if (!works) {
    const pages = await queryAll(notion, MASTER_DB_ID);
    works = pages.map(mapWork);
    cache.set(cacheKey, works, 90_000);
  }
  return works;
}

// ── GET /api/sidehustle?month=YYYY-MM ────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const notion = getNotion();
  const now    = new Date();
  const month  = req.query.month ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (req.query.force === '1') {
    cache.invalidatePrefix('sidehustle:');
  }

  const cacheKey = `sidehustle:month:${month}`;
  let result = cache.get(cacheKey);

  if (!result) {
    const allWorks = await getAllWorksCached(notion);
    const works    = filterByMonth(allWorks, month);
    const agg      = aggregate(works);
    result = { month, ...agg, works };
    cache.set(cacheKey, result, 90_000);
  }

  res.json(result);
}));

// ── GET /api/sidehustle/all ───────────────────────────────────────────────────

router.get('/all', asyncHandler(async (req, res) => {
  const notion   = getNotion();
  const allWorks = await getAllWorksCached(notion);
  const agg      = aggregate(allWorks);
  res.json({ month: 'all', ...agg, works: allWorks });
}));

// ── GET /api/sidehustle/trend ─────────────────────────────────────────────────

router.get('/trend', asyncHandler(async (req, res) => {
  const cacheKey = 'sidehustle:trend';
  let result = cache.get(cacheKey);
  if (result) return res.json(result);

  const notion   = getNotion();
  const allWorks = await getAllWorksCached(notion);

  const now    = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const trend = months.map(month => {
    const [year, mon] = month.split('-').map(Number);
    const slice = filterByMonth(allWorks, month);
    return {
      month,
      label:       new Date(year, mon - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue:     slice.reduce((s, w) => s + w.price,       0),
      designerPay: slice.reduce((s, w) => s + w.designerPay, 0),
      profit:      slice.reduce((s, w) => s + w.profit,      0),
      workCount:   slice.length,
    };
  });

  result = { trend };
  cache.set(cacheKey, result, 120_000);
  res.json(result);
}));

// ── GET /api/sidehustle/months ────────────────────────────────────────────────

router.get('/months', asyncHandler(async (req, res) => {
  const cacheKey = 'sidehustle:months';
  let result = cache.get(cacheKey);
  if (result) return res.json(result);

  const notion   = getNotion();
  const allWorks = await getAllWorksCached(notion);

  const monthSet = new Set();
  for (const w of allWorks) {
    if (w.date) monthSet.add(w.date.slice(0, 7));
  }

  const months = [...monthSet].sort().reverse().map(m => {
    const [year, mon] = m.split('-').map(Number);
    return {
      key:   m,
      label: new Date(year, mon - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      short: new Date(year, mon - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
    };
  });

  result = { months };
  cache.set(cacheKey, result, 90_000);
  res.json(result);
}));

module.exports = router;
