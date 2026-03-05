import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Dev proxy: forwards /api → local Express server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // In production, API calls go to VITE_API_URL env var (your Railway URL)
  // If not set, falls back to relative /api (works when frontend+backend on same domain)
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
});
