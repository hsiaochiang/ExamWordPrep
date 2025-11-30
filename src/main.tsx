import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './store/AuthContext';
import { WordSetProvider } from './store/WordSetContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <WordSetProvider>
          <App />
        </WordSetProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
