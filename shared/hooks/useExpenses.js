import { useState, useEffect, useCallback } from 'react';
import notionClient from '../utils/notionClient.js';
import { getMonthKey } from '../utils/dateUtils.js';

const cacheKey = (month) => `vault-expenses-${month}`;

const saveCache = (month, data) => {
  try { localStorage.setItem(cacheKey(month), JSON.stringify(data)); } catch {}
};

const loadCache = (month) => {
  try {
    const raw = localStorage.getItem(cacheKey(month));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const useExpenses = (monthKey = null) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const currentMonth = monthKey || getMonthKey();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notionClient.getExpenses({ month: currentMonth });
      const list = data.expenses || [];
      setExpenses(list);
      setOffline(false);
      saveCache(currentMonth, list);
    } catch (err) {
      const cached = loadCache(currentMonth);
      if (cached) {
        setExpenses(cached);
        setOffline(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expenseData) => {
    const created = await notionClient.createExpense(expenseData);
    setExpenses(prev => {
      const updated = [created, ...prev];
      saveCache(currentMonth, updated);
      return updated;
    });
    return created;
  };

  const updateExpense = async (id, updates) => {
    const updated = await notionClient.updateExpense(id, updates);
    setExpenses(prev => {
      const next = prev.map(e => (e.id === id ? updated : e));
      saveCache(currentMonth, next);
      return next;
    });
    return updated;
  };

  const deleteExpense = async (id) => {
    await notionClient.deleteExpense(id);
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      saveCache(currentMonth, next);
      return next;
    });
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return {
    expenses,
    loading,
    error,
    offline,
    refresh: fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    totalSpent,
    byCategory,
  };
};
