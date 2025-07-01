import React, { useState, useEffect } from 'react';
import { GoogleIcon, UserIcon } from './icons';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = () => {
    onLogin({ name: 'Google 사용자', avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJ-1F_vFRdw4v4vG1iS0A5lD-3sC2jwhiY8TmuaC5dF=s96-c' });
  };
  
  const handleGuestLogin = () => {
    onLogin({ name: '게스트', avatarUrl: `https://i.pravatar.cc/96?u=guest` });
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
            >
              <GoogleIcon className="w-12 h-12" />
            </button>
            <span className="text-white font-semibold text-lg" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>Google</span>
          </div>
          
          {/* Guest Login */}
          <div className="flex flex-col items-center">
             <button 
              onClick={handleGuestLogin} 
              className="w-24 h-24 rounded-full bg-slate-300 shadow-lg flex items-center justify-center mb-3 focus:outline-none focus:ring-4 focus:ring-slate-400/50 transition-transform transform hover:scale-105"
              aria-label="Login as Guest"
            >
              <UserIcon className="w-16 h-16 text-slate-600" />
            </button>
            <span className="text-white font-semibold text-lg" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>게스트</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 text-center text-white font-medium text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
        <p>프로필을 선택하여 로그인하세요.</p>
      </div>
    </div>
  );
};

export default LoginScreen;
