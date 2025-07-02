import React, { useState, useEffect } from 'react';
import { GoogleIcon, UserIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [time, setTime] = useState(new Date());
  const { signInWithGoogle, signInAnonymously, isLoading, error, user } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error) {
      setLoginError(error);
      const timer = setTimeout(() => setLoginError(null), 5000); // 5초 후 에러 메시지 제거
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      console.log('사용자 로그인 감지:', user);
      onLogin(user);
    }
  }, [user, onLogin]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        console.log('구글 로그인 성공:', result);
        onLogin(result);
      }
    } catch (err) {
      console.error('구글 로그인 처리 중 오류:', err);
    }
  };
  
  const handleGuestLogin = async () => {
    try {
      if (signInAnonymously) {
        const result = await signInAnonymously();
        if (result) {
          console.log('게스트 로그인 성공:', result);
          onLogin(result);
        }
      } else {
        const guestUser = {
          uid: 'guest-' + Math.random().toString(36).substring(2, 15),
          displayName: '게스트',
          isAnonymous: true
        };
        console.log('임시 게스트 로그인 생성:', guestUser);
        onLogin(guestUser);
      }
    } catch (err) {
      console.error('게스트 로그인 처리 중 오류:', err);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-black/10 backdrop-blur-2xl">
      <div className="fixed top-0 left-0 right-0 h-7 flex items-center justify-end px-4 text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
        <span>{time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex flex-col items-center space-y-10 text-center">
        <div className="flex items-center space-x-12">
          {/* Google Login */}
          <div className="flex flex-col items-center">
            <button 
              onClick={handleGoogleLogin} 
              className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center mb-3 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-transform transform hover:scale-105"
              aria-label="Login with Google"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <GoogleIcon className="w-12 h-12" />
              )}
            </button>
            <span className="text-white font-semibold text-lg" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>Google</span>
          </div>
          
          {/* Guest Login */}
          <div className="flex flex-col items-center">
             <button 
              onClick={handleGuestLogin} 
              className="w-24 h-24 rounded-full bg-slate-300 shadow-lg flex items-center justify-center mb-3 focus:outline-none focus:ring-4 focus:ring-slate-400/50 transition-transform transform hover:scale-105"
              aria-label="Login as Guest"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UserIcon className="w-16 h-16 text-slate-600" />
              )}
            </button>
            <span className="text-white font-semibold text-lg" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>게스트</span>
          </div>
        </div>
        
        {loginError && (
          <div className="bg-red-500/80 text-white px-6 py-3 rounded-lg shadow-lg">
            <p>{loginError}</p>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-10 text-center text-white font-medium text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
        <p>프로필을 선택하여 로그인하세요.</p>
      </div>
    </div>
  );
};

export default LoginScreen;
