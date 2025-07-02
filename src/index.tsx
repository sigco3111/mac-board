/**
 * 애플리케이션 렌더링 진입점
 * React 앱을 DOM에 마운트합니다.
 */
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initFirestore } from './services/firebase/initFirestore';

// URL 파라미터에서 'init=firestore'가 있는지 확인하여 Firestore 초기화
const checkAndInitFirestore = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shouldInit = urlParams.get('init');
  
  if (shouldInit === 'firestore') {
    try {
      console.log('🚀 Firestore 초기화 시작...');
      await initFirestore();
      console.log('✅ Firestore 초기화가 완료되었습니다. URL 파라미터를 제거합니다.');
      
      // 초기화 완료 후 URL 파라미터 제거
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    } catch (error) {
      console.error('❌ Firestore 초기화 중 오류 발생:', error);
    }
  }
};

// 앱 초기화 시 Firestore 초기화 체크
checkAndInitFirestore();

// React 앱을 DOM에 마운트
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 