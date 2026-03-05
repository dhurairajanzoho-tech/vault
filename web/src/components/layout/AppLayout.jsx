import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: c.background,
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          padding: '28px 32px',
          maxWidth: 1320,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
