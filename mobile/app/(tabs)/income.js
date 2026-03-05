import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useIncome } from '../../../../shared/hooks/useIncome.js';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { formatDate, todayISO } from '../../../../shared/utils/dateUtils.js';
import { WORK_SALARY_AMOUNT } from '../../../../shared/constants/categories.js';
import { Card } from '../../components/common/Card';

export default function IncomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { incomeEntries, sideHustleEntries, sideHustleTotal, totalIncome, workSalary, loading, refresh, addIncome } = useIncome();
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ source: '', amount: '', date: todayISO(), type: 'Side Hustle' });
  const [saving, setSaving] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const handleAdd = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      await addIncome({ ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
      setForm({ source: '', amount: '', date: todayISO(), type: 'Side Hustle' });
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { padding: 16, paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.subtext, marginTop: 2 },
    statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.cardBorder },
    statLabel: { fontSize: 10, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '800' },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: c.surfaceElevated, borderRadius: 12, marginBottom: 8 },
    entryName: { fontSize: 14, fontWeight: '600', color: c.text },
    entryDate: { fontSize: 11, color: c.subtext, marginTop: 2 },
    amount: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
    addBtn: { backgroundColor: c.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    addBtnText: { color: '#000', fontWeight: '700', fontSize: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderTopColor: c.cardBorder },
    modalTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 18 },
    label: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 12, color: c.text, fontSize: 15, padding: 12, marginBottom: 13 },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
    typeBtn: (active) => ({ flex: 1, padding: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center', borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accentLight : 'transparent' }),
    typeBtnText: (active) => ({ color: active ? c.accent : c.subtext, fontWeight: '600', fontSize: 13 }),
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    btnCancel: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    btnSave: { flex: 2, padding: 13, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' },
  });

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...s.header }}>
        <View>
          <Text style={s.title}>Income</Text>
          <Text style={s.subtitle}>Total: {formatCurrency(totalIncome)}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={s.statRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>🏢 Work Salary</Text>
          <Text style={[s.statValue, { color: c.accent }]}>{formatCurrency(workSalary.amount || WORK_SALARY_AMOUNT)}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>💼 Side Hustle</Text>
          <Text style={[s.statValue, { color: '#7B2FBE' }]}>{formatCurrency(sideHustleTotal)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
      >
        {/* Work Salary */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={s.sectionTitle}>🏢 Work Salary</Text>
          <View style={s.entryRow}>
            <View>
              <Text style={s.entryName}>Work Salary</Text>
              <Text style={s.entryDate}>Fixed monthly · Auto-added</Text>
            </View>
            <Text style={s.amount}>{formatCurrency(WORK_SALARY_AMOUNT)}</Text>
          </View>
        </Card>

        {/* Side Hustle */}
        <Card>
          <Text style={s.sectionTitle}>💼 Side Hustle Income</Text>
          {sideHustleEntries.length === 0 ? (
            <Text style={{ color: c.subtext, fontSize: 13, textAlign: 'center', padding: 16 }}>No side hustle entries for this month</Text>
          ) : (
            sideHustleEntries.map(entry => (
              <View key={entry.id} style={s.entryRow}>
                <View>
                  <Text style={s.entryName}>{entry.source}</Text>
                  <Text style={s.entryDate}>{formatDate(entry.date)}</Text>
                </View>
                <Text style={s.amount}>+{formatCurrency(entry.amount)}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Add Income Entry</Text>
            <Text style={s.label}>Source</Text>
            <TextInput style={s.input} placeholder="e.g. Freelance project" placeholderTextColor={c.subtext} value={form.source} onChangeText={v => setForm(f => ({ ...f, source: v }))} />
            <Text style={s.label}>Amount (₹)</Text>
            <TextInput style={[s.input, { fontSize: 20, fontWeight: '700' }]} keyboardType="numeric" placeholder="0" placeholderTextColor={c.subtext} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} />
            <Text style={s.label}>Type</Text>
            <View style={s.typeRow}>
              {['Side Hustle', 'Salary'].map(t => (
                <TouchableOpacity key={t} style={s.typeBtn(form.type === t)} onPress={() => setForm(f => ({ ...f, type: t }))}>
                  <Text style={s.typeBtnText(form.type === t)}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={{ color: c.subtext, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnSave, { opacity: saving ? 0.7 : 1 }]} onPress={handleAdd} disabled={saving}>
                <Text style={{ color: '#000', fontWeight: '700' }}>{saving ? 'Saving...' : '💾 Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
