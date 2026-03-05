import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: `linear-gradient(90deg, ${c.surface} 25%, ${c.surfaceElevated} 50%, ${c.surface} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }} />
  );
};

export const CardSkeleton = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 16,
      padding: 20,
    }}>
      <Skeleton height={14} width="40%" style={{ marginBottom: 12 }} />
      <Skeleton height={32} width="60%" style={{ marginBottom: 8 }} />
      <Skeleton height={12} width="30%" />
    </div>
  );
};

export const SkeletonList = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
