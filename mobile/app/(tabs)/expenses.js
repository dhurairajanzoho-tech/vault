import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useExpenses } from '../../../../shared/hooks/useExpenses.js';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { formatDate, todayISO } from '../../../../shared/utils/dateUtils.js';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '../../../../shared/constants/categories.js';
import { Card } from '../../components/common/Card';
import { useApp } from '../../context/AppContext';

export default function ExpensesScreen() {
  const { theme } = useTheme();
  const { defaultPaymentMethod } = useApp();
  const c = theme.colors;

  const { expenses, loading, totalSpent, addExpense, updateExpense, deleteExpense, refresh } = useExpenses();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', category: DEFAULT_CATEGORIES[0].id, date: todayISO(), paymentMethod: defaultPaymentMethod, notes: '' });
  const [saving, setSaving] = useState(false);

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    return (!search || e.name.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q))
      && (!filterCat || e.category === filterCat);
  });

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', amount: '', category: DEFAULT_CATEGORIES[0].id, date: todayISO(), paymentMethod: defaultPaymentMethod, notes: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, amount: String(item.amount), category: item.category, date: item.date, paymentMethod: item.paymentMethod, notes: item.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      if (editItem) await updateExpense(editItem.id, { ...form, amount: parseFloat(form.amount) });
      else await addExpense({ ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.subtext, marginTop: 2 },
    addBtn: { backgroundColor: c.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
    addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
    searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
    searchInput: { flex: 1, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 10, color: c.text, fontSize: 13, paddingHorizontal: 12, paddingVertical: 9 },
    catScroll: { paddingHorizontal: 16, marginBottom: 10 },
    catChip: (active) => ({
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8,
      backgroundColor: active ? c.accentLight : c.surfaceElevated,
      borderWidth: 1, borderColor: active ? c.accent : c.border,
    }),
    catChipText: (active) => ({ fontSize: 12, fontWeight: '600', color: active ? c.accent : c.subtext }),
    expRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catIcon: (color) => ({
      width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44`,
    }),
    expName: { fontSize: 14, fontWeight: '600', color: c.text },
    expMeta: { fontSize: 11, color: c.subtext, marginTop: 2 },
    expAmount: { fontSize: 16, fontWeight: '800', color: '#F44336' },
    actionRow: { flexDirection: 'row', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
    editBtn: { padding: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: c.border },
    delBtn: { padding: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderTopColor: c.cardBorder, maxHeight: '92%' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 18 },
    label: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 12, color: c.text, fontSize: 15, padding: 12, marginBottom: 13 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    btnCancel: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    btnSave: { flex: 2, padding: 13, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' },
  });

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Expenses</Text>
          <Text style={s.subtitle}>{expenses.length} entries · {formatCurrency(totalSpent)}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <TextInput style={s.searchInput} placeholder="🔍 Search..." placeholderTextColor={c.subtext} value={search} onChangeText={setSearch} />
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
        <TouchableOpacity style={s.catChip(!filterCat)} onPress={() => setFilterCat('')}>
          <Text style={s.catChipText(!filterCat)}>All</Text>
        </TouchableOpacity>
        {DEFAULT_CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.id} style={s.catChip(filterCat === cat.id)} onPress={() => setFilterCat(filterCat === cat.id ? '' : cat.id)}>
            <Text style={s.catChipText(filterCat === cat.id)}>{cat.icon} {cat.label.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💸</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>No expenses</Text>
            <Text style={{ fontSize: 13, color: c.subtext, marginTop: 6 }}>Add your first expense</Text>
          </View>
        ) : (
          filtered.map(expense => {
            const cat = DEFAULT_CATEGORIES.find(cc => cc.id === expense.category);
            return (
              <Card key={expense.id} style={{ marginBottom: 8 }}>
                <View style={s.expRow}>
                  <View style={s.catIcon(cat?.color || c.accent)}>
                    <Text style={{ fontSize: 20 }}>{cat?.icon || '💳'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.expName}>{expense.name}</Text>
                    <Text style={s.expMeta}>{formatDate(expense.date)} · {cat?.label} · {expense.paymentMethod}</Text>
                  </View>
                  <Text style={s.expAmount}>{formatCurrency(expense.amount)}</Text>
                </View>
                <View style={s.actionRow}>
                  <TouchableOpacity style={s.editBtn} onPress={() => openEdit(expense)}>
                    <Text style={{ fontSize: 13, color: c.subtext }}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(expense.id)}>
                    <Text style={{ fontSize: 13, color: '#F44336' }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={s.modalBox}>
              <Text style={s.modalTitle}>{editItem ? 'Edit Expense' : 'Add Expense'}</Text>

              <Text style={s.label}>Amount (₹)</Text>
              <TextInput style={[s.input, { fontSize: 22, fontWeight: '800' }]} keyboardType="numeric" placeholder="0" placeholderTextColor={c.subtext} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} />

              <Text style={s.label}>Description</Text>
              <TextInput style={s.input} placeholder="What did you spend on?" placeholderTextColor={c.subtext} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />

              <Text style={s.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 13 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 2 }}>
                  {DEFAULT_CATEGORIES.map(cat => (
                    <TouchableOpacity key={cat.id} onPress={() => setForm(f => ({ ...f, category: cat.id }))}
                      style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: form.category === cat.id ? c.accent : c.border, backgroundColor: form.category === cat.id ? c.accentLight : 'transparent', alignItems: 'center', minWidth: 68 }}>
                      <Text style={{ fontSize: 22 }}>{cat.icon}</Text>
                      <Text style={{ fontSize: 10, color: form.category === cat.id ? c.accent : c.subtext, marginTop: 2 }}>{cat.label.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={s.label}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity key={m} onPress={() => setForm(f => ({ ...f, paymentMethod: m }))}
                    style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', borderColor: form.paymentMethod === m ? c.accent : c.border, backgroundColor: form.paymentMethod === m ? c.accentLight : 'transparent' }}>
                    <Text style={{ color: form.paymentMethod === m ? c.accent : c.subtext, fontWeight: '600', fontSize: 13 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Notes (optional)</Text>
              <TextInput style={[s.input, { height: 65, textAlignVertical: 'top' }]} placeholder="Any notes..." placeholderTextColor={c.subtext} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} multiline />

              <View style={s.btnRow}>
                <TouchableOpacity style={s.btnCancel} onPress={() => setShowModal(false)}>
                  <Text style={{ color: c.subtext, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSave, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
                  <Text style={{ color: '#000', fontWeight: '700' }}>{saving ? 'Saving...' : '💾 Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
