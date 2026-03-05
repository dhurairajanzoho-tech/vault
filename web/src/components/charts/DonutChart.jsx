import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../../../shared/utils/formatCurrency.js';
import { DEFAULT_CATEGORIES } from '../../../../shared/constants/categories.js';

const RADIAN = Math.PI / 180;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div style={{
      background: color,
      borderRadius: 10,
      padding: '8px 14px',
      fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
    }}>
      <div style={{ color: '#fff', fontWeight: 700, marginBottom: 2 }}>{name}</div>
      <div style={{ color: 'rgba(255,255,255,0.85)' }}>{formatCurrency(value)}</div>
    </div>
  );
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const DonutChart = ({ data = {}, size = 'full' }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const chartData = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => {
      const cat = DEFAULT_CATEGORIES.find(c => c.id === key);
      return { name: cat?.label || key, value, color: cat?.color || c.accent };
    });

  if (!chartData.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <span style={{ color: c.subtext, fontSize: 13 }}>No spending data</span>
      </div>
    );
  }

  const isSmall = size === 'mini';

  return (
    <ResponsiveContainer width="100%" height={isSmall ? 180 : 300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={isSmall ? 45 : 70}
          outerRadius={isSmall ? 75 : 110}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={isSmall ? undefined : CustomLabel}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {!isSmall && (
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: c.subtext, fontSize: 12 }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};
