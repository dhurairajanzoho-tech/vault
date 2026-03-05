import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { useExpenses } from '../../../../shared/hooks/useExpenses.js';
import { useIncome } from '../../../../shared/hooks/useIncome.js';
import { useBudget } from '../../../../shared/hooks/useBudget.js';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { getMonthLabel, isLastThreeDaysOfMonth } from '../../../../shared/utils/dateUtils.js';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '../../../../shared/constants/categories.js';
import { todayISO } from '../../../../shared/utils/dateUtils.js';
import { Card } from '../../components/common/Card';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { defaultPaymentMethod } = useApp();
  const c = theme.colors;

  const { expenses, loading: expLoading, totalSpent, byCategory, addExpense, refresh: refreshExp } = useExpenses();
  const { totalIncome, loading: incLoading } = useIncome();
  const { getBudgetStatus } = useBudget();

  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    name: '', amount: '', category: DEFAULT_CATEGORIES[0].id,
    date: todayISO(), paymentMethod: defaultPaymentMethod, notes: '',
  });
  const [saving, setSaving] = useState(false);

  const savings = totalIncome - totalSpent;
  const savingsPercent = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const budgetStatus = getBudgetStatus(byCategory);
  const alerts = budgetStatus.filter(b => b.isAlert && b.monthlyLimit > 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExp();
    setRefreshing(false);
  };

  const handleAddExpense = async () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await addExpense({ ...form, amount: parseFloat(form.amount) });
      setShowAddModal(false);
      setForm({ name: '', amount: '', category: DEFAULT_CATEGORIES[0].id, date: todayISO(), paymentMethod: defaultPaymentMethod, notes: '' });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 100 },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: c.text },
    headerSub: { fontSize: 13, color: c.subtext, marginTop: 4 },
    statRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: 16,
      borderWidth: 1, borderColor: c.cardBorder, padding: 14,
    },
    statLabel: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '800' },
    alertBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 12, borderRadius: 12, marginBottom: 10,
      backgroundColor: 'rgba(255,152,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,152,0,0.3)',
    },
    alertText: { flex: 1, fontSize: 12, color: c.text },
    fab: {
      position: 'absolute', bottom: 24, right: 24,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
      shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
      elevation: 8,
    },
    fabText: { fontSize: 28, color: '#000', fontWeight: '700', lineHeight: 32 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, borderTopWidth: 1, borderTopColor: c.cardBorder,
      maxHeight: '90%',
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 20 },
    input: {
      backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border,
      borderRadius: 12, color: c.text, fontSize: 15, padding: 13,
      marginBottom: 14,
    },
    label: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontWeight: '600' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    btnCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    btnSave: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' },
    btnCancelText: { color: c.subtext, fontWeight: '600', fontSize: 14 },
    btnSaveText: { color: '#000', fontWeight: '700', fontSize: 14 },
  });

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>{getMonthLabel()}</Text>
          <Text style={s.headerSub}>Your financial overview</Text>
        </View>

        {/* Alerts */}
        {alerts.map((b, i) => (
          <View key={i} style={s.alertBanner}>
            <Text style={{ fontSize: 16 }}>{b.percent >= 100 ? '🚨' : '⚠️'}</Text>
            <Text style={s.alertText}>{b.icon} {b.label}: {formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF9800' }}>{b.percent.toFixed(0)}%</Text>
          </View>
        ))}

        {/* Stat Cards Row 1 */}
        <View style={s.statRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>💵 Income</Text>
            <Text style={[s.statValue, { color: c.accent }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>💳 Expenses</Text>
            <Text style={[s.statValue, { color: '#F44336' }]}>{formatCurrency(totalSpent)}</Text>
          </View>
        </View>

        {/* Savings Card */}
        <View style={{ ...s.statCard, marginBottom: 14 }}>
          <Text style={s.statLabel}>💰 Savings</Text>
          <Text style={[s.statValue, { color: '#4CAF50', marginBottom: 4 }]}>{formatCurrency(savings)}</Text>
          <Text style={{ fontSize: 12, color: c.subtext }}>{savingsPercent.toFixed(1)}% of income saved</Text>
        </View>

        {/* Budget Overview */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 12 }}>🎯 Budget Status</Text>
          {budgetStatus.filter(b => b.monthlyLimit > 0).slice(0, 4).map(b => (
            <View key={b.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: c.text }}>{b.icon} {b.label}</Text>
                <Text style={{ fontSize: 11, color: c.subtext }}>{formatCurrency(b.spent)} / {formatCurrency(b.monthlyLimit)}</Text>
              </View>
              <View style={{ height: 6, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{
                  height: 6, borderRadius: 3,
                  width: `${Math.min(b.percent, 100)}%`,
                  backgroundColor: b.status === 'exceeded' ? '#F44336' : b.status === 'danger' ? '#FF9800' : b.status === 'warning' ? '#FFC107' : '#4CAF50',
                }} />
              </View>
            </View>
          ))}
          {budgetStatus.filter(b => b.monthlyLimit > 0).length === 0 && (
            <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'center', padding: 12 }}>No budget limits set</Text>
          )}
        </Card>

        {/* Recent Expenses */}
        <Card>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 12 }}>📋 Recent Expenses</Text>
          {expenses.slice(0, 5).map(expense => {
            const cat = DEFAULT_CATEGORIES.find(cat => cat.id === expense.category);
            return (
              <View key={expense.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${cat?.color || c.accent}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{cat?.icon || '💳'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{expense.name}</Text>
                  <Text style={{ fontSize: 11, color: c.subtext }}>{cat?.label} · {expense.paymentMethod}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#F44336' }}>{formatCurrency(expense.amount)}</Text>
              </View>
            );
          })}
          {expenses.length === 0 && (
            <Text style={{ color: c.subtext, fontSize: 12, textAlign: 'center', padding: 12 }}>No expenses yet</Text>
          )}
        </Card>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={s.modalOverlay}>
          <ScrollView>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>Add Expense</Text>

              <Text style={s.label}>Amount (₹)</Text>
              <TextInput
                style={[s.input, { fontSize: 22, fontWeight: '800' }]}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={c.subtext}
                value={form.amount}
                onChangeText={v => setForm(f => ({ ...f, amount: v }))}
              />

              <Text style={s.label}>Description</Text>
              <TextInput
                style={s.input}
                placeholder="What did you spend on?"
                placeholderTextColor={c.subtext}
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />

              <Text style={s.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setForm(f => ({ ...f, category: cat.id }))}
                      style={{
                        padding: 10, borderRadius: 12, borderWidth: 1,
                        borderColor: form.category === cat.id ? c.accent : c.border,
                        backgroundColor: form.category === cat.id ? c.accentLight : 'transparent',
                        alignItems: 'center', minWidth: 72,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                      <Text style={{ fontSize: 10, color: form.category === cat.id ? c.accent : c.subtext, marginTop: 2 }}>{cat.label.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.label}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setForm(f => ({ ...f, paymentMethod: m }))}
                    style={{
                      flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center',
                      borderColor: form.paymentMethod === m ? c.accent : c.border,
                      backgroundColor: form.paymentMethod === m ? c.accentLight : 'transparent',
                    }}
                  >
                    <Text style={{ color: form.paymentMethod === m ? c.accent : c.subtext, fontWeight: '600', fontSize: 13 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Notes (optional)</Text>
              <TextInput
                style={[s.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Any notes..."
                placeholderTextColor={c.subtext}
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                multiline
              />

              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnCancel} onPress={() => setShowAddModal(false)}>
                  <Text style={s.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSave, { opacity: saving ? 0.7 : 1 }]} onPress={handleAddExpense} disabled={saving}>
                  <Text style={s.btnSaveText}>{saving ? 'Saving...' : '💾 Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
