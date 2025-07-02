/**
 * 애플리케이션 진입점 컴포넌트
 * 전체 앱의 레이아웃과 라우팅을 관리합니다.
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Desktop from '../components/Desktop';
import LoginScreen from '../components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './services/firebase/config';
import './index.css';

// 로그아웃 상태를 저장하기 위한 로컬 스토리지 키
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';
const AUTH_STATE_KEY = 'mac_board_auth_state';

/**
 * 애플리케이션 루트 컴포넌트
 */
const App: React.FC = () => {
  // 인증 상태 관리
  const { user, isLoading, error, isAuthenticated, signOut } = useAuth();
  const [manualLoginUser, setManualLoginUser] = useState<any>(null);
  const [forceLogout, setForceLogout] = useState<boolean>(() => {
    return localStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
  });

  // 강제 로그아웃 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (forceLogout) {
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    } else {
      localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  }, [forceLogout]);
  
  // 로딩 화면
  if (isLoading) {
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
          <p className="text-mac-dark mb-4">{error}</p>
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

  /**
   * 게시판 열기 핸들러
   */
  const handleOpenBoard = () => {
    // 게시판 열기 로직
    console.log('게시판 열기');
  };

  /**
   * 로그아웃 핸들러 - 철저한 정리를 수행하는 버전
   */
  const handleLogout = async () => {
    console.log('App: 로그아웃 요청 받음');
    
    // 로그아웃 상태로 강제 설정
    setForceLogout(true);
    setManualLoginUser(null);
    
    // 로컬 스토리지에서 모든 인증 관련 데이터 삭제
    try {
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
      localStorage.removeItem(AUTH_STATE_KEY);
      
      // Firebase 관련 로컬 스토리지 키도 삭제 시도
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth'))) {
          console.log(`삭제할 로컬 스토리지 키 발견: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.error('로컬 스토리지 삭제 오류:', err);
    }
    
    // Firebase 로그아웃 시도
    try {
      console.log('App: Firebase 로그아웃 시도');
      await firebaseSignOut(auth);
      console.log('App: Firebase 로그아웃 성공');
    } catch (err) {
      console.error('App: Firebase 로그아웃 실패', err);
    }
    
    // useAuth의 signOut 함수도 호출
    try {
      console.log('App: useAuth의 signOut 함수 호출');
      await signOut();
    } catch (err) {
      console.error('App: useAuth 로그아웃 실패', err);
    }
    
    console.log('App: 로그아웃 완료, 강제 로그아웃 상태 설정됨');
    
    // 쿠키 삭제 시도
    try {
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      console.log('쿠키 삭제 시도 완료');
    } catch (err) {
      console.error('쿠키 삭제 오류:', err);
    }
    
    // Promise를 반환
    return Promise.resolve();
  };

  /**
   * 로그인 핸들러
   */
  const handleLogin = (loggedInUser: any) => {
    console.log('로그인 성공:', loggedInUser);
    setManualLoginUser(loggedInUser);
    setForceLogout(false);
    localStorage.removeItem(LOGOUT_FLAG_KEY);
  };

  // 로그인 상태 확인
  const effectiveUser = user || manualLoginUser;
  const isUserLoggedIn = (isAuthenticated || !!manualLoginUser) && !forceLogout;

  console.log('인증 상태:', { 
    user, 
    manualLoginUser, 
    isAuthenticated, 
    forceLogout, 
    isUserLoggedIn 
  });

  return (
    <Router>
      {isUserLoggedIn && effectiveUser ? (
        // 로그인 상태 - 데스크톱 환경 표시
        <Desktop 
          user={effectiveUser} 
          onOpenBoard={handleOpenBoard} 
          onLogout={handleLogout} 
        />
      ) : (
        // 로그아웃 상태 - 로그인 화면 표시
        <LoginScreen onLogin={handleLogin} />
      )}
    </Router>
  );
};

export default App; 