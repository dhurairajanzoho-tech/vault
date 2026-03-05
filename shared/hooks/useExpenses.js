import { useState, useEffect, useCallback } from 'react';
import notionClient from '../utils/notionClient.js';
import { getMonthKey } from '../utils/dateUtils.js';

export const useExpenses = (monthKey = null) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentMonth = monthKey || getMonthKey();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notionClient.getExpenses({ month: currentMonth });
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expenseData) => {
    const created = await notionClient.createExpense(expenseData);
    setExpenses(prev => [created, ...prev]);
    return created;
  };

  const updateExpense = async (id, updates) => {
    const updated = await notionClient.updateExpense(id, updates);
    setExpenses(prev => prev.map(e => (e.id === id ? updated : e)));
    return updated;
  };

  const deleteExpense = async (id) => {
    await notionClient.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
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
    refresh: fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    totalSpent,
    byCategory,
  };
};
