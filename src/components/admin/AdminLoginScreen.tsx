/**
 * 관리자 로그인 화면 컴포넌트
 * .env 파일의 ADMIN_ID와 ADMIN_PW를 사용하여 관리자 인증을 수행합니다.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Admin } from '../../types';

interface AdminLoginScreenProps {
  onLogin?: (admin: Admin) => void;
}

/**
 * 관리자 로그인 화면 컴포넌트
 */
const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLogin }) => {
  // 상태 관리
  const [id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  
  // 로그인 시도 여부 추적을 위한 ref
  const loginAttemptedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  
  // 관리자 인증 훅 사용
  const { login, isLoading, error, admin } = useAdminAuth();

  // 컴포넌트 언마운트 시 isMountedRef 업데이트
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 시간 업데이트 효과
  useEffect(() => {
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setTime(new Date());
      }
    }, 30000); // 30초마다 업데이트
    
    return () => clearInterval(timer);
  }, []);

  // 에러 처리 효과
  useEffect(() => {
    if (error && isMountedRef.current) {
      setLoginError(error);
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setLoginError(null);
        }
      }, 5000); // 5초 후 에러 메시지 제거
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * 현재 선택(Selection) 초기화 함수
   */
  const clearSelection = () => {
    try {
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }
    } catch (e) {
      console.error('선택 초기화 중 오류:', e);
    }
  };

  /**
   * 안전한 페이지 이동 함수
   */
  const safeRedirect = (url: string) => {
    // 현재 선택 초기화
    clearSelection();
    
    // 이벤트 루프의 다음 틱에서 실행하여 DOM 업데이트 완료 보장
    Promise.resolve().then(() => {
      try {
        console.log(`페이지 이동: ${url}`);
        // 히스토리 스택에 영향을 주지 않고 페이지 전환
        window.location.replace(url);
      } catch (e) {
        console.error('페이지 이동 중 오류:', e);
        // 오류 발생 시 일반 새로고침 시도
        window.location.href = url;
      }
    });
  };

  // 로그인 성공 처리 효과
  useEffect(() => {
    // 로그인 시도 후 admin 상태가 변경되었을 때만 실행
    if (loginAttemptedRef.current && admin && isMountedRef.current) {
      console.log('로그인 성공 감지, 관리자 페이지로 이동 준비:', admin);
      
      // 안전하게 콜백 호출 및 페이지 전환
      try {
        if (onLogin) {
          onLogin(admin);
        }
        
        // 즉시 페이지 전환 시도
        safeRedirect('/admin');
      } catch (err) {
        console.error('로그인 성공 처리 중 오류:', err);
      }
    }
  }, [admin, onLogin]);

  /**
   * 로그인 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id.trim() || !password.trim()) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 로그인 에러 초기화
    setLoginError(null);
    // 로그인 시도 상태 설정
    loginAttemptedRef.current = true;
    
    try {
      // 로그인 시도
      const success = await login(id, password);
      
      if (success && isMountedRef.current) {
        console.log('로그인 성공, 상태 업데이트');
        // 로그인 성공 시 useEffect에서 처리
      } else if (isMountedRef.current) {
        // 로그인 실패 시 에러 메시지 표시
        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
        loginAttemptedRef.current = false;
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('로그인 처리 중 오류:', err);
        setLoginError(err.message || '로그인 중 오류가 발생했습니다.');
        loginAttemptedRef.current = false;
      }
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* 상단 시간 표시 */}
      <div className="fixed top-0 left-0 right-0 h-7 flex items-center justify-end px-4 text-sm font-semibold text-gray-700">
        <span>{time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      
      {/* 로그인 폼 */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">관리자 로그인</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 아이디 입력 */}
          <div>
            <label htmlFor="admin-id" className="block text-sm font-medium text-gray-700 mb-1">
              관리자 아이디
            </label>
            <input
              id="admin-id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="관리자 아이디 입력"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          
          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호 입력"
              disabled={isLoading}
            />
          </div>
          
          {/* 에러 메시지 */}
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{loginError}</p>
            </div>
          )}
          
          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* 하단 안내 메시지 */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>관리자 계정으로 로그인하세요.</p>
        <p className="mt-1">계정 정보는 .env 파일에 설정된 값을 사용합니다.</p>
      </div>
    </div>
  );
};

export default AdminLoginScreen; 