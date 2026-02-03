import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Global Error Handler for startup
window.onerror = function (message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="color: #ff4d4d; background: #1a1a1a; padding: 20px; font-family: monospace; height: 100vh;">
        <h1>CRITICAL STARTUP ERROR</h1>
        <h2>${message}</h2>
        <p>Source: ${source}:${lineno}:${colno}</p>
        <pre>${error ? error.stack : 'No stack trace'}</pre>
      </div>
    `;
  }
};

import { GoogleOAuthProvider } from '@react-oauth/google';

// ... (existing code)

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        font-family: 'Inter', system-ui, sans-serif;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #050505;
        color: #e5e5e5;
        text-align: center;
        padding: 24px;
      ">
        <div style="
          max-width: 600px;
          background: #111;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 32px;
        ">
          <h1 style="color: #ff4d4d; margin-bottom: 16px;">Configuração Necessária</h1>
          <p style="color: #a3a3a3; margin-bottom: 24px;">
            A chave de conexão com o Google (Client ID) não foi detectada.
          </p>
          <div style="background: #222; padding: 16px; border-radius: 8px; text-align: left; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #fff;">Como resolver no Netlify:</p>
            <ol style="margin: 0; padding-left: 20px; color: #a3a3a3; font-size: 14px; line-height: 1.6;">
              <li>Vá em <strong>Site settings</strong> > <strong>Environment variables</strong></li>
              <li>Clique em <strong>Add a variable</strong></li>
              <li>Key: <code style="color: #82E0AA;">VITE_GOOGLE_CLIENT_ID</code></li>
              <li>Value: (Copie do seu arquivo .env local)</li>
              <li>Clique em <strong>Create variable</strong> e faça um novo deploy.</li>
            </ol>
          </div>
          <button onclick="window.location.reload()" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
          ">
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
  }
} else {
  try {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
          <App />
        </GoogleOAuthProvider>
      </React.StrictMode>,
    )
  } catch (e) {
    console.error("React Mount Error:", e);
    document.getElementById('root').innerHTML = `
        <div style="color: #ff4d4d; background: #1a1a1a; padding: 20px; font-family: monospace;">
          <h1>REACT MOUNT ERROR</h1>
          <pre>${e.stack}</pre>
        </div>
      `;
  }
}
