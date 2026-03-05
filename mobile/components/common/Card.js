import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const Card = ({ children, style, onPress }) => {
  const { theme } = useTheme();
  const c = theme.colors;

  const cardStyle = {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};
