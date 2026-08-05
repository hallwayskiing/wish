import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp.js';

const container = document.getElementById('admin-root');
if (!container) {
  throw new Error('Root container #admin-root not found in document');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
