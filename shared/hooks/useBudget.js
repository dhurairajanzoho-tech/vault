import { useState, useEffect, useCallback } from 'react';
import notionClient from '../utils/notionClient.js';
import { DEFAULT_CATEGORIES, ALERT_THRESHOLD_DEFAULT } from '../constants/categories.js';

export const useBudget = () => {
  const [budgetLimits, setBudgetLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notionClient.getBudgetLimits();
      setBudgetLimits(data.budgetLimits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const upsertBudgetLimit = async (category, monthlyLimit, alertThreshold = ALERT_THRESHOLD_DEFAULT) => {
    const updated = await notionClient.upsertBudgetLimit({ category, monthlyLimit, alertThreshold });
    setBudgetLimits(prev => {
      const idx = prev.findIndex(b => b.category === category);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    return updated;
  };

  /**
   * Compute spending status vs budget limits
   * spentByCategory: { [categoryId]: number }
   */
  const getBudgetStatus = (spentByCategory = {}) => {
    return DEFAULT_CATEGORIES.map(cat => {
      const limit = budgetLimits.find(b => b.category === cat.id);
      const spent = spentByCategory[cat.id] || 0;
      const monthlyLimit = limit?.monthlyLimit || 0;
      const threshold = limit?.alertThreshold || ALERT_THRESHOLD_DEFAULT;
      const percent = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;

      let status = 'safe';
      if (percent >= 100) status = 'exceeded';
      else if (percent >= 85) status = 'danger';
      else if (percent >= 70) status = 'warning';

      return {
        ...cat,
        spent,
        monthlyLimit,
        alertThreshold: threshold,
        percent,
        status,
        isAlert: percent >= threshold,
      };
    });
  };

  return {
    budgetLimits,
    loading,
    error,
    refresh: fetchBudget,
    upsertBudgetLimit,
    getBudgetStatus,
  };
};
