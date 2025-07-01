/**
 * 애플리케이션 진입점 컴포넌트
 * 전체 앱의 레이아웃과 라우팅을 관리합니다.
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Desktop from './components/Desktop';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import './index.css';

/**
 * 애플리케이션 루트 컴포넌트
 */
const App: React.FC = () => {
  // 인증 상태 관리
  const { user, loading, error } = useAuth();
  
  // 로딩 화면
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-mac-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mac-blue mx-auto mb-4"></div>
          <p className="text-mac-dark">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-mac-light">
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-mac-window">
          <h2 className="text-xl font-medium text-red-600 mb-4">오류가 발생했습니다</h2>
          <p className="text-mac-dark mb-4">{error.message}</p>
          <button 
            className="mac-button" 
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        // 로그인 상태 - 데스크톱 환경 표시
        <Desktop user={user} />
      ) : (
        // 로그아웃 상태 - 로그인 화면 표시
        <LoginScreen />
      )}
    </Router>
  );
};

export default App; 