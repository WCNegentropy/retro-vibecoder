import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StatusProvider } from './hooks/useStatus';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <StatusProvider>
        <App />
      </StatusProvider>
    </HashRouter>
  </React.StrictMode>
);
