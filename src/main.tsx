import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useStore } from './lib/store';

// The app uses hash routing. If someone opens a plain path such as /report or /issues/GVP-1250
// (served index.html via the Vercel rewrite), convert it to the equivalent hash route.
{
  const { pathname, search, hash } = window.location;
  if (pathname !== '/' && pathname !== '/index.html' && !hash) {
    window.history.replaceState(null, '', `/#${pathname}${search}`);
  }
}

// Persist the demo dataset on first load so seeded timestamps stay stable across reloads.
try {
  if (!localStorage.getItem('smkc-cleanloop')) useStore.setState({});
} catch {
  /* storage unavailable — app still runs in memory */
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
