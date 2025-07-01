/**
 * 애플리케이션 렌더링 진입점
 * React 앱을 DOM에 마운트합니다.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// React 앱을 DOM에 마운트
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 