import React from 'react';
import { Utensils, Car, Zap, Film, PiggyBank, ShoppingBag, Heart } from 'lucide-react';

const CATEGORY_ICONS = {
  food:          Utensils,
  transport:     Car,
  bills:         Zap,
  entertainment: Film,
  savings:       PiggyBank,
  shopping:      ShoppingBag,
  health:        Heart,
};

export const CategoryIcon = ({ id, size = 20, color }) => {
  const Icon = CATEGORY_ICONS[id];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
};
