const cron = require('node-cron');
const notionService = require('./notionService');
const config = require('../config');

const WORK_SALARY_AMOUNT = 10000;

/**
 * Check if work salary for the current month was already inserted
 * Runs daily — inserts on last day of month if missing
 */
const runSalaryCron = async () => {
  try {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Only act on the last day of the month
    if (now.getDate() !== lastDay.getDate()) return;

    const cfg = config.getLocalConfig();
    const incomeDbId = config.incomeDbId || cfg.incomeDbId;
    if (!incomeDbId) return;

    // Check if salary already exists for this month
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const entries = await notionService.getIncome(incomeDbId, monthKey);
    const alreadyAdded = entries.some(e => e.type === 'Salary' && e.source === 'Work Salary');

    if (!alreadyAdded) {
      await notionService.createIncome(incomeDbId, {
        source: 'Work Salary',
        amount: WORK_SALARY_AMOUNT,
        date: lastDay.toISOString().split('T')[0],
        type: 'Salary',
      });
      console.log(`[Cron] Work salary ₹${WORK_SALARY_AMOUNT} auto-added for ${monthKey}`);
    }
  } catch (err) {
    console.error('[Cron] Salary job error:', err.message);
  }
};

/**
 * Process recurring expenses for today's date
 */
const runRecurringCron = async () => {
  try {
    const cfg = config.getLocalConfig();
    const expensesDbId = config.expensesDbId || cfg.expensesDbId;
    const recurringDbId = config.recurringDbId || cfg.recurringDbId;
    if (!expensesDbId || !recurringDbId) return;

    const now = new Date();
    const today = now.getDate();
    const todayISO = now.toISOString().split('T')[0];
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const recurring = await notionService.getRecurring(recurringDbId);
    const activeToday = recurring.filter(r => r.active && r.dayOfMonth === today);

    for (const item of activeToday) {
      // Check if already created for this month
      const existing = await notionService.getExpenses(expensesDbId, monthKey);
      const alreadyAdded = existing.some(
        e => e.name === item.name && e.date === todayISO
      );

      if (!alreadyAdded) {
        await notionService.createExpense(expensesDbId, {
          name: item.name,
          amount: item.amount,
          category: item.category,
          date: todayISO,
          paymentMethod: 'UPI',
          notes: 'Auto-added (recurring)',
        });
        console.log(`[Cron] Recurring expense "${item.name}" ₹${item.amount} added`);
      }
    }
  } catch (err) {
    console.error('[Cron] Recurring job error:', err.message);
  }
};

const startCronJobs = () => {
  // Run at 11:55 PM every day
  cron.schedule('55 23 * * *', async () => {
    console.log('[Cron] Running daily jobs...');
    await runSalaryCron();
    await runRecurringCron();
  });
  console.log('[Cron] Jobs scheduled');
};

module.exports = { startCronJobs, runSalaryCron, runRecurringCron };
