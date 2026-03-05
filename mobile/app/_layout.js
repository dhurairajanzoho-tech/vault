import React from 'react';
import { Slot } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Slot />
      </AppProvider>
    </ThemeProvider>
  );
}
