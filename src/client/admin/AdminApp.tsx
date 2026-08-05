import React, { useState, useEffect } from 'react';
import '../styles/style.css';
import './admin.css';
import './editor.css';
import { ParticleCanvas } from '../components/ParticleCanvas.js';
import { adminApi } from './api.js';
import { LoginPanel } from './components/LoginPanel.js';
import { Dashboard } from './components/Dashboard.js';

export const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    const controller = new AbortController();
    adminApi<{ authenticated: boolean }>('/session', { signal: controller.signal })
      .then(() => setIsAuthenticated(true))
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setIsAuthenticated(false);
      });
    return () => controller.abort();
  }, []);

  const handleLogin = async (password: string) => {
    setLoginError('');
    try {
      await adminApi<{ success: boolean }>('/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      setIsAuthenticated(true);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : '登录失败');
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi<{ success: boolean }>('/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
    }
  };

  const handleUnauthorized = () => {
    setLoginError('登录已过期，请重新登录。');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <main className="admin-shell">
        <ParticleCanvas />
        <div className="empty-state glass-panel" style={{ marginTop: '4rem' }}>
          正在加载管理台...
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <ParticleCanvas />
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} onUnauthorized={handleUnauthorized} />
      ) : (
        <LoginPanel onLogin={handleLogin} errorMessage={loginError} />
      )}
    </main>
  );
};
