import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { getMonthKey } from '../../../../shared/utils/dateUtils.js';
import { DEFAULT_CATEGORIES } from '../../../../shared/constants/categories.js';
import { Card } from '../../components/common/Card';

export default function StatsScreen() {
  const { theme } = useTheme();
  const { apiUrl } = useApp();
  const c = theme.colors;

  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const month = getMonthKey();
      const [statsRes, trendRes] = await Promise.all([
        fetch(`${apiUrl}/api/stats?month=${month}`).then(r => r.json()),
        fetch(`${apiUrl}/api/stats/trend`).then(r => r.json()),
      ]);
      setStats(statsRes);
      setTrend(trendRes.trend || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { padding: 16, paddingBottom: 4 },
    title: { fontSize: 22, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 12, color: c.subtext, marginTop: 2 },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
    statCard: { width: '47%', backgroundColor: c.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.cardBorder },
    statLabel: { fontSize: 10, color: c.subtext, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
    statValue: { fontSize: 20, fontWeight: '800' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 12 },
    catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: c.surfaceElevated, borderRadius: 10, marginBottom: 8 },
    catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catIcon: (color) => ({ width: 34, height: 34, borderRadius: 8, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }),
    trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingVertical: 4 },
    trendLabel: { fontSize: 11, color: c.subtext, width: 36, textAlign: 'center' },
    bar: (value, max, color) => ({
      width: 20, borderRadius: 4, backgroundColor: color,
      height: max > 0 ? Math.max(4, (value / max) * 80) : 4,
    }),
    trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
    legendDot: (color) => ({ width: 8, height: 8, borderRadius: 4, backgroundColor: color }),
    legendLabel: { fontSize: 11, color: c.subtext },
    top3Row: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    top3Card: { flex: 1, backgroundColor: c.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center' },
  });

  if (loading || !stats) {
    return (
      <SafeAreaView style={s.container} edges={['bottom']}>
        <View style={s.header}>
          <Text style={s.title}>Statistics</Text>
          <Text style={s.subtitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxTrend = Math.max(...trend.map(t => Math.max(t.totalIncome, t.totalExpenses, t.savings || 0)));

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <View style={s.header}>
        <Text style={s.title}>Statistics</Text>
        <Text style={s.subtitle}>Monthly financial summary</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
      >
        {/* Summary grid */}
        <View style={s.statGrid}>
          {[
            { label: '💵 Income', value: stats.totalIncome, color: c.accent },
            { label: '💳 Expenses', value: stats.totalExpenses, color: '#F44336' },
            { label: '💰 Savings', value: stats.savings, color: '#4CAF50' },
            { label: '📈 Savings Rate', value: `${(stats.savingsPercent || 0).toFixed(1)}%`, raw: true, color: (stats.savingsPercent || 0) >= 20 ? '#4CAF50' : '#FF9800' },
          ].map(item => (
            <View key={item.label} style={s.statCard}>
              <Text style={s.statLabel}>{item.label}</Text>
              <Text style={[s.statValue, { color: item.color }]}>
                {item.raw ? item.value : formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </View>

        {/* Top 3 */}
        {stats.top3?.length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <Text style={s.sectionTitle}>🏆 Top Spending</Text>
            <View style={s.top3Row}>
              {stats.top3.map((item, i) => {
                const cat = DEFAULT_CATEGORIES.find(c => c.id === item.category);
                return (
                  <View key={i} style={s.top3Card}>
                    <Text style={{ fontSize: 26, marginBottom: 4 }}>{cat?.icon || '💳'}</Text>
                    <Text style={{ fontSize: 11, color: c.subtext, textAlign: 'center' }}>{cat?.label || item.category}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#F44336', marginTop: 4 }}>{formatCurrency(item.amount)}</Text>
                    <Text style={{ fontSize: 10, color: c.subtext }}>#{i + 1}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Category breakdown */}
        {Object.keys(stats.categoryBreakdown || {}).length > 0 && (
          <Card style={{ marginBottom: 14 }}>
            <Text style={s.sectionTitle}>📊 Category Breakdown</Text>
            {Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a).map(([catId, amount]) => {
              const cat = DEFAULT_CATEGORIES.find(c => c.id === catId);
              const pct = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0;
              return (
                <View key={catId} style={{ marginBottom: 12 }}>
                  <View style={s.catRow}>
                    <View style={s.catLeft}>
                      <View style={s.catIcon(cat?.color || c.accent)}>
                        <Text style={{ fontSize: 18 }}>{cat?.icon || '💳'}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{cat?.label || catId}</Text>
                        <Text style={{ fontSize: 11, color: c.subtext }}>{pct.toFixed(1)}% of total</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#F44336' }}>{formatCurrency(amount)}</Text>
                  </View>
                  <View style={{ height: 5, backgroundColor: c.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                    <View style={{ height: 5, borderRadius: 3, width: `${pct}%`, backgroundColor: cat?.color || c.accent }} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* 6-month trend */}
        {trend.length > 0 && (
          <Card>
            <Text style={s.sectionTitle}>📈 6-Month Trend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
                  {trend.map((t, i) => (
                    <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                        <View style={s.bar(t.totalIncome, maxTrend, c.accent)} />
                        <View style={s.bar(t.totalExpenses, maxTrend, '#F44336')} />
                        <View style={s.bar(Math.max(0, t.savings), maxTrend, '#4CAF50')} />
                      </View>
                      <Text style={s.trendLabel}>{t.label}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.trendLegend}>
                  {[{ color: c.accent, label: 'Income' }, { color: '#F44336', label: 'Expenses' }, { color: '#4CAF50', label: 'Savings' }].map(item => (
                    <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={s.legendDot(item.color)} />
                      <Text style={s.legendLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
