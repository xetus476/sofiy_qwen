import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BUILD_VERSION, BUILD_TIME } from './version';

console.log('🎬 main.tsx: Application starting...');
console.log('📦 Build version:', BUILD_VERSION);
console.log('🕐 Build time:', BUILD_TIME);
alert(`App starting!\nVersion: ${BUILD_VERSION}\nTime: ${BUILD_TIME}`); // Временная отладка

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
