import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

console.log('🚀 Obour Platform Loaded: v2.0-Polished (Build ' + new Date().toISOString() + ')');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("CRITICAL: Could not find root element to mount to.");
}

// CRITICAL FIX: Wipe the root element clean before rendering.
// This ensures that if 'index.tsx' ran before this, its content is removed.
rootElement.innerHTML = '';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);