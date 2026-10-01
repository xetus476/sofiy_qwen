import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BUILD_VERSION, BUILD_TIME } from './version';

console.log('🎬 ========================================');
console.log('🎬 FinanceBot Mini App');
console.log('📦 Version:', BUILD_VERSION);
console.log('🕐 Build time:', BUILD_TIME);
console.log('🎬 ========================================');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
