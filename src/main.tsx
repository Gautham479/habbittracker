import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

declare global {
  interface Window {
    storage: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

window.storage = {
  get: async (key: string) => {
    const val = localStorage.getItem(key);
    return val ? { value: val } : null;
  },
  set: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
