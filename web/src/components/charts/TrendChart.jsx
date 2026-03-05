import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';

export const TrendChart = ({ data = [] }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: c.subtext, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: c.subtext, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v, { compact: true })}
          width={60}
        />
        <Tooltip
          contentStyle={{
            background: c.surfaceElevated,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: 10,
            color: c.text,
            fontSize: 12,
          }}
          formatter={(value, name) => [formatCurrency(value), name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: c.subtext, fontSize: 12 }}>{value}</span>}
        />
        <Bar dataKey="totalIncome" name="Income" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="totalExpenses" name="Expenses" fill="#F44336" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="savings" name="Savings" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
};
