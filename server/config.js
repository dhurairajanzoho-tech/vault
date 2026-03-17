require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.vault-config.json');

let _localConfig = {};
try {
  if (fs.existsSync(CONFIG_PATH)) {
    _localConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
} catch (e) {
  _localConfig = {};
}

const isVercel = !!process.env.VERCEL;

const saveLocalConfig = (updates) => {
  _localConfig = { ..._localConfig, ...updates };
  if (isVercel) return; // read-only filesystem on Vercel — skip file write
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(_localConfig, null, 2));
  } catch (e) {
    console.warn('Could not write config file:', e.message);
  }
};

const getLocalConfig = () => _localConfig;

module.exports = {
  port: process.env.PORT || 3001,
  notionApiKey: process.env.NOTION_API_KEY || _localConfig.notionApiKey || '',
  notionParentPageId: process.env.NOTION_PARENT_PAGE_ID || _localConfig.notionParentPageId || '',
  expensesDbId: process.env.EXPENSES_DB_ID || _localConfig.expensesDbId || '',
  incomeDbId: process.env.INCOME_DB_ID || _localConfig.incomeDbId || '',
  budgetDbId: process.env.BUDGET_DB_ID || _localConfig.budgetDbId || '',
  recurringDbId: process.env.RECURRING_DB_ID || _localConfig.recurringDbId || '',
  sideHustleDbId: process.env.SIDE_HUSTLE_DB_ID || _localConfig.sideHustleDbId || '',
  sideHustleAmountField: process.env.SIDE_HUSTLE_AMOUNT_FIELD || _localConfig.sideHustleAmountField || '',
  sideHustleDateField: process.env.SIDE_HUSTLE_DATE_FIELD || _localConfig.sideHustleDateField || '',
  sideHustleSourceField: _localConfig.sideHustleSourceField || '',
  ocrApiKey: process.env.OCR_API_KEY || '',
  isConfigured: () => {
    const cfg = { ...module.exports };
    return !!(cfg.notionApiKey && cfg.expensesDbId && cfg.incomeDbId);
  },
  saveLocalConfig,
  getLocalConfig,
  CONFIG_PATH,
};
