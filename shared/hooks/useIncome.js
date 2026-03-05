import { useState, useEffect, useCallback } from 'react';
import notionClient from '../utils/notionClient.js';
import { getMonthKey } from '../utils/dateUtils.js';
import { WORK_SALARY_AMOUNT } from '../constants/categories.js';

export const useIncome = (monthKey = null) => {
  const [incomeEntries, setIncomeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentMonth = monthKey || getMonthKey();

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notionClient.getIncome({ month: currentMonth });
      setIncomeEntries(data.income || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const addIncome = async (incomeData) => {
    const created = await notionClient.createIncome(incomeData);
    setIncomeEntries(prev => [created, ...prev]);
    return created;
  };

  const workSalary = incomeEntries.find(i => i.type === 'Salary') || {
    source: 'Work Salary',
    amount: WORK_SALARY_AMOUNT,
    type: 'Salary',
  };

  const sideHustleEntries = incomeEntries.filter(i => i.type === 'Side Hustle');
  const sideHustleTotal = sideHustleEntries.reduce((sum, i) => sum + i.amount, 0);

  const totalIncome = (workSalary.amount || 0) + sideHustleTotal;

  return {
    incomeEntries,
    workSalary,
    sideHustleEntries,
    sideHustleTotal,
    totalIncome,
    loading,
    error,
    refresh: fetchIncome,
    addIncome,
  };
};
