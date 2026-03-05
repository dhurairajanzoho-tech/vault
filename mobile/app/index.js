import { Redirect } from 'expo-router';
import { useApp } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Index() {
  const { isConfigured } = useApp();
  const { theme } = useTheme();

  if (isConfigured === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  if (!isConfigured) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
