const { Client } = require('@notionhq/client');
const config = require('../config');

let notion;

const getClient = () => {
  if (!notion) {
    notion = new Client({ auth: config.notionApiKey });
  }
  return notion;
};

const reinitClient = (apiKey) => {
  notion = new Client({ auth: apiKey });
};

// ── DB Creation ───────────────────────────────────────────────────────────────

const DB_SCHEMAS = {
  expenses: {
    name: 'Vault – Expenses',
    properties: {
      Name: { title: {} },
      Amount: { number: { format: 'number' } },
      Category: {
        select: {
          options: [
            { name: 'food', color: 'red' },
            { name: 'transport', color: 'blue' },
            { name: 'bills', color: 'yellow' },
            { name: 'entertainment', color: 'green' },
            { name: 'savings', color: 'orange' },
            { name: 'shopping', color: 'purple' },
            { name: 'health', color: 'pink' },
          ],
        },
      },
      Date: { date: {} },
      'Payment Method': {
        select: {
          options: [
            { name: 'Cash', color: 'gray' },
            { name: 'UPI', color: 'blue' },
            { name: 'Card', color: 'green' },
          ],
        },
      },
      Notes: { rich_text: {} },
      'Receipt Image URL': { url: {} },
      Month: {
        formula: {
          expression: 'formatDate(prop("Date"), "MMMM YYYY")',
        },
      },
    },
  },
  income: {
    name: 'Vault – Income',
    properties: {
      Source: { title: {} },
      Amount: { number: { format: 'number' } },
      Date: { date: {} },
      Type: {
        select: {
          options: [
            { name: 'Salary', color: 'green' },
            { name: 'Side Hustle', color: 'purple' },
          ],
        },
      },
      Month: {
        formula: {
          expression: 'formatDate(prop("Date"), "MMMM YYYY")',
        },
      },
    },
  },
  budget: {
    name: 'Vault – Budget Limits',
    properties: {
      Category: { title: {} },
      'Monthly Limit': { number: { format: 'number' } },
      'Alert Threshold %': { number: { format: 'number' } },
    },
  },
  recurring: {
    name: 'Vault – Recurring Expenses',
    properties: {
      Name: { title: {} },
      Amount: { number: { format: 'number' } },
      Category: {
        select: {
          options: [
            { name: 'food', color: 'red' },
            { name: 'transport', color: 'blue' },
            { name: 'bills', color: 'yellow' },
            { name: 'entertainment', color: 'green' },
            { name: 'savings', color: 'orange' },
            { name: 'shopping', color: 'purple' },
            { name: 'health', color: 'pink' },
          ],
        },
      },
      'Day of Month': { number: { format: 'number' } },
      Active: { checkbox: {} },
    },
  },
};

const createDatabase = async (parentPageId, schema) => {
  const n = getClient();
  const db = await n.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: schema.name } }],
    properties: schema.properties,
  });
  return db.id;
};

const setupAllDatabases = async (apiKey, parentPageId) => {
  reinitClient(apiKey);
  const ids = {};
  for (const [key, schema] of Object.entries(DB_SCHEMAS)) {
    ids[key] = await createDatabase(parentPageId, schema);
  }
  return ids;
};

// ── Helper: query a DB with filter ────────────────────────────────────────────

const queryDB = async (dbId, filter, sorts = []) => {
  const n = getClient();
  const pages = [];
  let cursor;

  do {
    const res = await n.databases.query({
      database_id: dbId,
      filter: filter || undefined,
      sorts,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);

  return pages;
};

// ── Property Extractors ───────────────────────────────────────────────────────

const extractTitle = (page, prop = 'Name') =>
  page.properties?.[prop]?.title?.[0]?.plain_text || '';

const extractNumber = (page, prop) => {
  const p = page.properties?.[prop];
  if (!p) return 0;
  // Regular number property
  if (p.type === 'number') return p.number || 0;
  // Formula that evaluates to a number
  if (p.type === 'formula' && p.formula?.type === 'number') return p.formula.number || 0;
  // Rollup (sum/average etc.)
  if (p.type === 'rollup' && p.rollup?.type === 'number') return p.rollup.number || 0;
  // Fallback: direct .number (legacy behaviour)
  return p.number || 0;
};

const extractSelect = (page, prop) =>
  page.properties?.[prop]?.select?.name || '';

const extractDate = (page, prop = 'Date') =>
  page.properties?.[prop]?.date?.start || '';

const extractText = (page, prop) =>
  page.properties?.[prop]?.rich_text?.[0]?.plain_text || '';

const extractUrl = (page, prop) =>
  page.properties?.[prop]?.url || '';

const extractCheckbox = (page, prop) =>
  page.properties?.[prop]?.checkbox || false;

// ── Month filter helper ───────────────────────────────────────────────────────

const monthFilter = (monthKey) => {
  if (!monthKey) return null;
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return {
    and: [
      { property: 'Date', date: { on_or_after: start } },
      { property: 'Date', date: { on_or_before: end } },
    ],
  };
};

// ── Expenses ──────────────────────────────────────────────────────────────────

const mapExpense = (page) => ({
  id: page.id,
  notionId: page.id,
  name: extractTitle(page, 'Name'),
  amount: extractNumber(page, 'Amount'),
  category: extractSelect(page, 'Category'),
  date: extractDate(page, 'Date'),
  paymentMethod: extractSelect(page, 'Payment Method'),
  notes: extractText(page, 'Notes'),
  receiptImageUrl: extractUrl(page, 'Receipt Image URL'),
});

const getExpenses = async (dbId, month) => {
  const filter = monthFilter(month);
  const pages = await queryDB(dbId, filter, [{ property: 'Date', direction: 'descending' }]);
  return pages.map(mapExpense);
};

const createExpense = async (dbId, data) => {
  const n = getClient();
  const page = await n.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: data.name || 'Expense' } }] },
      Amount: { number: data.amount },
      Category: { select: { name: data.category } },
      Date: { date: { start: data.date } },
      'Payment Method': { select: { name: data.paymentMethod || 'Cash' } },
      Notes: { rich_text: [{ text: { content: data.notes || '' } }] },
      ...(data.receiptImageUrl ? { 'Receipt Image URL': { url: data.receiptImageUrl } } : {}),
    },
  });
  return mapExpense(page);
};

const updateExpense = async (pageId, data) => {
  const n = getClient();
  const props = {};
  if (data.name !== undefined) props.Name = { title: [{ text: { content: data.name } }] };
  if (data.amount !== undefined) props.Amount = { number: data.amount };
  if (data.category !== undefined) props.Category = { select: { name: data.category } };
  if (data.date !== undefined) props.Date = { date: { start: data.date } };
  if (data.paymentMethod !== undefined) props['Payment Method'] = { select: { name: data.paymentMethod } };
  if (data.notes !== undefined) props.Notes = { rich_text: [{ text: { content: data.notes } }] };

  const page = await n.pages.update({ page_id: pageId, properties: props });
  return mapExpense(page);
};

const deleteExpense = async (pageId) => {
  const n = getClient();
  await n.pages.update({ page_id: pageId, archived: true });
};

// ── Income ────────────────────────────────────────────────────────────────────

const mapIncome = (page) => ({
  id: page.id,
  notionId: page.id,
  source: extractTitle(page, 'Source'),
  amount: extractNumber(page, 'Amount'),
  date: extractDate(page, 'Date'),
  type: extractSelect(page, 'Type'),
});

const getIncome = async (dbId, month) => {
  const filter = monthFilter(month);
  const pages = await queryDB(dbId, filter, [{ property: 'Date', direction: 'descending' }]);
  return pages.map(mapIncome);
};

const createIncome = async (dbId, data) => {
  const n = getClient();
  const page = await n.pages.create({
    parent: { database_id: dbId },
    properties: {
      Source: { title: [{ text: { content: data.source } }] },
      Amount: { number: data.amount },
      Date: { date: { start: data.date } },
      Type: { select: { name: data.type } },
    },
  });
  return mapIncome(page);
};

// ── Side Hustle (external DB) ─────────────────────────────────────────────────

const getSideHustleIncome = async (dbId, amountField, dateField, sourceField, month) => {
  const filter = monthFilter(month);
  const pages = await queryDB(dbId, filter);

  // Find the title property name dynamically (it varies per database)
  const titlePropName = pages.length > 0
    ? Object.entries(pages[0].properties).find(([, v]) => v.type === 'title')?.[0]
    : null;

  return pages
    .map(page => ({
      id: page.id,
      source: sourceField
        ? extractTitle(page, sourceField)
        : titlePropName
          ? extractTitle(page, titlePropName)
          : 'Side Hustle',
      amount: extractNumber(page, amountField),
      date: extractDate(page, dateField),
      type: 'Side Hustle',
    }))
    .filter(entry => entry.date && entry.amount > 0); // skip empty/zero rows
};

const getSideHustleFields = async (dbId) => {
  const n = getClient();
  const db = await n.databases.retrieve({ database_id: dbId });
  return Object.entries(db.properties).map(([name, prop]) => ({
    name,
    type: prop.type,
  }));
};

// ── Budget Limits ─────────────────────────────────────────────────────────────

const mapBudget = (page) => ({
  id: page.id,
  notionId: page.id,
  category: extractTitle(page, 'Category'),
  monthlyLimit: extractNumber(page, 'Monthly Limit'),
  alertThreshold: extractNumber(page, 'Alert Threshold %') || 80,
});

const getBudgetLimits = async (dbId) => {
  const pages = await queryDB(dbId);
  return pages.map(mapBudget);
};

const upsertBudgetLimit = async (dbId, data) => {
  const n = getClient();
  // Check if already exists
  const existing = await queryDB(dbId, {
    property: 'Category',
    title: { equals: data.category },
  });

  if (existing.length > 0) {
    const page = await n.pages.update({
      page_id: existing[0].id,
      properties: {
        'Monthly Limit': { number: data.monthlyLimit },
        'Alert Threshold %': { number: data.alertThreshold || 80 },
      },
    });
    return mapBudget(page);
  }

  const page = await n.pages.create({
    parent: { database_id: dbId },
    properties: {
      Category: { title: [{ text: { content: data.category } }] },
      'Monthly Limit': { number: data.monthlyLimit },
      'Alert Threshold %': { number: data.alertThreshold || 80 },
    },
  });
  return mapBudget(page);
};

// ── Recurring Expenses ────────────────────────────────────────────────────────

const mapRecurring = (page) => ({
  id: page.id,
  notionId: page.id,
  name: extractTitle(page, 'Name'),
  amount: extractNumber(page, 'Amount'),
  category: extractSelect(page, 'Category'),
  dayOfMonth: extractNumber(page, 'Day of Month'),
  active: extractCheckbox(page, 'Active'),
});

const getRecurring = async (dbId) => {
  const pages = await queryDB(dbId);
  return pages.map(mapRecurring);
};

const createRecurring = async (dbId, data) => {
  const n = getClient();
  const page = await n.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      Amount: { number: data.amount },
      Category: { select: { name: data.category } },
      'Day of Month': { number: data.dayOfMonth },
      Active: { checkbox: data.active !== false },
    },
  });
  return mapRecurring(page);
};

const updateRecurring = async (pageId, data) => {
  const n = getClient();
  const props = {};
  if (data.name !== undefined) props.Name = { title: [{ text: { content: data.name } }] };
  if (data.amount !== undefined) props.Amount = { number: data.amount };
  if (data.category !== undefined) props.Category = { select: { name: data.category } };
  if (data.dayOfMonth !== undefined) props['Day of Month'] = { number: data.dayOfMonth };
  if (data.active !== undefined) props.Active = { checkbox: data.active };

  const page = await n.pages.update({ page_id: pageId, properties: props });
  return mapRecurring(page);
};

const deleteRecurring = async (pageId) => {
  const n = getClient();
  await n.pages.update({ page_id: pageId, archived: true });
};

// ── Verify connection ─────────────────────────────────────────────────────────

const verifyConnection = async (apiKey, pageId) => {
  const tempClient = new Client({ auth: apiKey });
  const page = await tempClient.pages.retrieve({ page_id: pageId });
  return { valid: true, pageTitle: page.properties?.title?.title?.[0]?.plain_text || 'Untitled' };
};

module.exports = {
  setupAllDatabases,
  verifyConnection,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getIncome,
  createIncome,
  getSideHustleIncome,
  getSideHustleFields,
  getBudgetLimits,
  upsertBudgetLimit,
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  reinitClient,
  queryDB,
};
