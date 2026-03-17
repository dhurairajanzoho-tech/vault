import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AddExpenseForm } from '../forms/AddExpenseForm';
import notionClient from '../../../../shared/utils/notionClient.js';

export const AppLayout = () => {
  const { theme } = useTheme();
  const { defaultPaymentMethod } = useApp();
  const c = theme.colors;

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Global 'E' key shortcut — open quick-add modal
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShowQuickAdd(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleQuickAdd = async (data) => {
    setSaving(true);
    try {
      await notionClient.createExpense(data);
      setShowQuickAdd(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: c.background }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Global quick-add modal — triggered by 'E' key from anywhere */}
      <Modal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick Add Expense">
        <AddExpenseForm
          onSubmit={handleQuickAdd}
          onCancel={() => setShowQuickAdd(false)}
          defaultPaymentMethod={defaultPaymentMethod}
        />
      </Modal>
    </div>
  );
};
