import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useStore } from './lib/store';

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
