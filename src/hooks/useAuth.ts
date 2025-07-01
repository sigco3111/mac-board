/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 * Firebase 인증 상태를 구독하고 사용자 정보를 제공합니다.
 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { mapFirebaseUserToUser } from '../services/firebase/auth';
import type { User } from '../types/index';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 */
export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Firebase 인증 상태 변경 구독
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // 로그인 상태
          setState({
            user: mapFirebaseUserToUser(firebaseUser),
            loading: false,
            error: null,
          });
        } else {
          // 로그아웃 상태
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        // 에러 발생
        console.error('인증 상태 변경 구독 오류:', error);
        setState({
          user: null,
          loading: false,
          error: error as Error,
        });
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  return state;
}; 