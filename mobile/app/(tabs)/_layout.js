import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Text } from 'react-native';

const TabIcon = ({ emoji, focused, color }) => (
  <Text style={{ fontSize: focused ? 22 : 20 }}>{emoji}</Text>
);

export default function TabLayout() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.subtext,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏠" focused={focused} color={color} />,
          headerTitle: '🏦 Vault',
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💳" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="💵" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="📊" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="⚙️" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
