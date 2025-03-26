// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { GameProvider } from './context/GameContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
);

// Register service worker for PWA

