import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { DEFAULT_CATEGORIES } from '../../../shared/constants/categories.js';

const STEPS = ['welcome', 'server', 'sidehustle', 'budget', 'done'];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const { apiUrl, saveApiUrl, setIsConfigured } = useApp();
  const c = theme.colors;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Server step
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');

  // Side hustle step
  const [sideHustleUrl, setSideHustleUrl] = useState('');
  const [fields, setFields] = useState([]);
  const [amountField, setAmountField] = useState('');
  const [dateField, setDateField] = useState('');

  // Budget step
  const [budgets, setBudgets] = useState(
    DEFAULT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: '' }), {})
  );

  const extractId = (url) => {
    const match = url.match(/([a-f0-9]{32})/i);
    return match ? match[1] : url.trim().replace(/-/g, '');
  };

  const checkServer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/health`);
      const data = await res.json();
      if (data.status === 'ok') {
        await saveApiUrl(serverUrl);
        setStep(2);
      } else {
        Alert.alert('Error', 'Server not configured. Run the setup on the web app first.');
      }
    } catch (err) {
      Alert.alert('Connection Failed', `Cannot reach ${serverUrl}. Make sure the Vault server is running.`);
    } finally { setLoading(false); }
  };

  const fetchFields = async () => {
    setLoading(true);
    try {
      const dbId = extractId(sideHustleUrl);
      const res = await fetch(`${serverUrl}/api/setup/sidehustle/fields?dbId=${dbId}`);
      const data = await res.json();
      setFields(data.fields || []);
    } catch (err) { Alert.alert('Error', 'Could not fetch fields.'); }
    finally { setLoading(false); }
  };

  const mapSideHustle = async () => {
    if (!amountField || !dateField) { Alert.alert('Error', 'Select both fields'); return; }
    setLoading(true);
    try {
      const dbId = extractId(sideHustleUrl);
      await fetch(`${serverUrl}/api/setup/sidehustle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId, amountField, dateField }),
      });
      setStep(3);
    } finally { setLoading(false); }
  };

  const saveBudgets = async () => {
    setLoading(true);
    try {
      for (const [category, limit] of Object.entries(budgets)) {
        if (limit && parseFloat(limit) > 0) {
          await fetch(`${serverUrl}/api/budget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, monthlyLimit: parseFloat(limit), alertThreshold: 80 }),
          });
        }
      }
      setStep(4);
    } finally { setLoading(false); }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    card: { backgroundColor: c.surface, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: c.cardBorder },
    progress: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 28 },
    dot: (active) => ({ width: active ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: active ? c.accent : c.border }),
    heading: { fontSize: 26, fontWeight: '800', color: c.text, marginBottom: 8 },
    subtext: { fontSize: 14, color: c.subtext, lineHeight: 21, marginBottom: 22 },
    label: { fontSize: 11, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 12, color: c.text, fontSize: 14, padding: 12, marginBottom: 13 },
    btnPrimary: { backgroundColor: c.accent, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 6 },
    btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: 15 },
    btnGhost: { padding: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: c.border, marginTop: 8 },
    btnGhostText: { color: c.subtext, fontWeight: '500', fontSize: 14 },
    featRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: c.surfaceElevated, borderRadius: 10, marginBottom: 8 },
  });

  const Progress = () => (
    <View style={s.progress}>
      {STEPS.map((_, i) => <View key={i} style={s.dot(i <= step)} />)}
    </View>
  );

  if (step === 0) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🏦</Text>
          <Text style={[s.heading, { textAlign: 'center', color: c.accent }]}>Welcome to Vault</Text>
          <Text style={[s.subtext, { textAlign: 'center' }]}>Your personal budget planner, powered by Notion. Set up in a few steps.</Text>
          <Progress />
          {[{ icon: '🖥️', label: 'Connect to the Vault server' }, { icon: '💼', label: 'Link your side hustle DB' }, { icon: '🎯', label: 'Set your budget limits' }].map(item => (
            <View key={item.label} style={s.featRow}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              <Text style={{ fontSize: 14, color: c.text }}>{item.label}</Text>
            </View>
          ))}
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 20 }]} onPress={() => setStep(1)}>
            <Text style={s.btnPrimaryText}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (step === 1) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Progress />
          <Text style={s.heading}>🖥️ Server Setup</Text>
          <Text style={s.subtext}>Enter the URL of your running Vault Express server. (Complete the web app setup first!)</Text>
          <Text style={s.label}>Server URL</Text>
          <TextInput style={s.input} placeholder="http://192.168.1.x:3001" placeholderTextColor={c.subtext} value={serverUrl} onChangeText={setServerUrl} autoCapitalize="none" keyboardType="url" />
          <Text style={{ fontSize: 11, color: c.subtext, marginBottom: 14, lineHeight: 18 }}>
            💡 Use your machine's local IP address (not localhost) when connecting from a phone on the same Wi-Fi.
          </Text>
          <TouchableOpacity style={[s.btnPrimary, { opacity: loading ? 0.7 : 1 }]} onPress={checkServer} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnPrimaryText}>🔌 Connect to Server</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (step === 2) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Progress />
          <Text style={s.heading}>💼 Side Hustle DB</Text>
          <Text style={s.subtext}>Connect your existing Notion database for side hustle income.</Text>
          <Text style={s.label}>Side Hustle DB URL</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
            <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="https://notion.so/..." placeholderTextColor={c.subtext} value={sideHustleUrl} onChangeText={setSideHustleUrl} autoCapitalize="none" />
            <TouchableOpacity style={{ padding: 12, borderRadius: 12, backgroundColor: c.accentLight, borderWidth: 1, borderColor: c.cardBorder, justifyContent: 'center' }} onPress={fetchFields} disabled={!sideHustleUrl || loading}>
              <Text style={{ color: c.accent, fontWeight: '600', fontSize: 13 }}>Fetch</Text>
            </TouchableOpacity>
          </View>
          {fields.length > 0 && (
            <>
              <Text style={s.label}>Amount Field</Text>
              <View style={{ marginBottom: 13 }}>
                {fields.map(f => (
                  <TouchableOpacity key={f.name} onPress={() => setAmountField(f.name)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 4, backgroundColor: amountField === f.name ? c.accentLight : c.surfaceElevated, borderWidth: 1, borderColor: amountField === f.name ? c.accent : c.border }}>
                    <Text style={{ fontSize: 13, color: amountField === f.name ? c.accent : c.text, fontWeight: '600' }}>{f.name}</Text>
                    <Text style={{ fontSize: 11, color: c.subtext }}>({f.type})</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.label}>Date Field</Text>
              <View style={{ marginBottom: 13 }}>
                {fields.map(f => (
                  <TouchableOpacity key={f.name} onPress={() => setDateField(f.name)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 4, backgroundColor: dateField === f.name ? c.accentLight : c.surfaceElevated, borderWidth: 1, borderColor: dateField === f.name ? c.accent : c.border }}>
                    <Text style={{ fontSize: 13, color: dateField === f.name ? c.accent : c.text, fontWeight: '600' }}>{f.name}</Text>
                    <Text style={{ fontSize: 11, color: c.subtext }}>({f.type})</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[s.btnPrimary, { opacity: loading ? 0.7 : 1 }]} onPress={mapSideHustle} disabled={loading}>
                <Text style={s.btnPrimaryText}>🔗 Map & Continue</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={s.btnGhost} onPress={() => setStep(3)}>
            <Text style={s.btnGhostText}>Skip for now →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (step === 3) return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Progress />
          <Text style={s.heading}>🎯 Budget Limits</Text>
          <Text style={s.subtext}>Set your monthly spending limits. You can always change these later.</Text>
          <ScrollView style={{ maxHeight: 360 }} nestedScrollEnabled>
            {DEFAULT_CATEGORIES.map(cat => (
              <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${cat.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: c.text }}>{cat.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 13, color: c.subtext }}>₹</Text>
                  <TextInput
                    style={{ width: 80, backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border, borderRadius: 8, color: c.text, fontSize: 14, padding: 7, textAlign: 'right' }}
                    keyboardType="numeric" placeholder="0" placeholderTextColor={c.subtext}
                    value={budgets[cat.id]} onChangeText={v => setBudgets(b => ({ ...b, [cat.id]: v }))}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 16, opacity: loading ? 0.7 : 1 }]} onPress={saveBudgets} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnPrimaryText}>💾 Save & Continue</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.btnGhost} onPress={() => setStep(4)}>
            <Text style={s.btnGhostText}>Skip for now →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={s.card}>
          <Progress />
          <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 16 }}>🎉</Text>
          <Text style={[s.heading, { textAlign: 'center', color: c.accent }]}>All Set!</Text>
          <Text style={[s.subtext, { textAlign: 'center' }]}>Vault is connected and ready. Start tracking your finances!</Text>
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 16 }]} onPress={() => { setIsConfigured(true); router.replace('/(tabs)'); }}>
            <Text style={s.btnPrimaryText}>🏦 Open Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
