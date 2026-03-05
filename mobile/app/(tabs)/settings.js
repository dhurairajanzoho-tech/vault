import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { PAYMENT_METHODS, DEFAULT_CATEGORIES } from '../../../../shared/constants/categories.js';
import { Card } from '../../components/common/Card';

export default function SettingsScreen() {
  const { theme, themeId, switchTheme, themes } = useTheme();
  const { apiUrl, saveApiUrl, defaultPaymentMethod, saveDefaultPayment } = useApp();
  const c = theme.colors;

  const [apiUrlInput, setApiUrlInput] = useState(apiUrl);
  const [saving, setSaving] = useState(false);

  const handleSaveApiUrl = async () => {
    if (!apiUrlInput.startsWith('http')) { Alert.alert('Error', 'Enter a valid URL (http://...)'); return; }
    setSaving(true);
    try {
      await saveApiUrl(apiUrlInput);
      Alert.alert('Success', 'API URL updated!');
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { padding: 16, paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.subtext, marginTop: 2 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 12 },
    label: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 12, color: c.text, fontSize: 14, padding: 12, marginBottom: 10 },
    saveBtn: { backgroundColor: c.accent, padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 4 },
    saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
    themeCard: (active) => ({
      flex: 1, padding: 14, borderRadius: 14, borderWidth: 2,
      borderColor: active ? c.accent : c.border,
      alignItems: 'center', gap: 6,
    }),
    payRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    payBtn: (active) => ({
      flex: 1, padding: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center',
      borderColor: active ? c.accent : c.border,
      backgroundColor: active ? c.accentLight : 'transparent',
    }),
    payBtnText: (active) => ({ color: active ? c.accent : c.subtext, fontWeight: '600', fontSize: 13 }),
    catChip: (color) => ({
      flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 20, backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44`, margin: 3,
    }),
    about: { alignItems: 'center', padding: 20 },
  });

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Configure Vault</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 80 }}>
        {/* Theme */}
        <Card>
          <Text style={s.sectionTitle}>🎨 Theme</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {Object.values(themes).map(t => (
              <TouchableOpacity key={t.id} style={s.themeCard(themeId === t.id)} onPress={() => switchTheme(t.id)}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {t.preview.map((col, i) => (
                    <View key={i} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: col, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                  ))}
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.colors.text, textAlign: 'center' }}>{t.name}</Text>
                {themeId === t.id && <Text style={{ fontSize: 11, color: t.colors.accent }}>✓ Active</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* API URL */}
        <Card>
          <Text style={s.sectionTitle}>🔌 Server Connection</Text>
          <Text style={s.label}>API Server URL</Text>
          <TextInput
            style={s.input}
            placeholder="http://localhost:3001"
            placeholderTextColor={c.subtext}
            value={apiUrlInput}
            onChangeText={setApiUrlInput}
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSaveApiUrl} disabled={saving}>
            <Text style={s.saveBtnText}>{saving ? 'Saving...' : '💾 Save URL'}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 11, color: c.subtext, textAlign: 'center', marginTop: 4 }}>
            Your Vault server address (from the Express server)
          </Text>
        </Card>

        {/* Default Payment */}
        <Card>
          <Text style={s.sectionTitle}>💳 Default Payment Method</Text>
          <View style={s.payRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity key={m} style={s.payBtn(defaultPaymentMethod === m)} onPress={() => saveDefaultPayment(m)}>
                <Text style={s.payBtnText(defaultPaymentMethod === m)}>{m}{defaultPaymentMethod === m ? ' ✓' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Categories */}
        <Card>
          <Text style={s.sectionTitle}>🏷️ Categories</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {DEFAULT_CATEGORIES.map(cat => (
              <View key={cat.id} style={s.catChip(cat.color)}>
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                <Text style={{ fontSize: 12, color: cat.color, fontWeight: '500' }}>{cat.label.split(' ')[0]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* About */}
        <Card>
          <View style={s.about}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🏦</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.accent }}>Vault</Text>
            <Text style={{ fontSize: 13, color: c.subtext, marginTop: 4 }}>Personal Budget Planner v1.0.0</Text>
            <Text style={{ fontSize: 12, color: c.subtext, marginTop: 6, textAlign: 'center' }}>
              Powered by Notion API{'\n'}React Native (Expo) + Node.js
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
