/**
 * Firebase 인증 관련 함수
 * 로그인, 로그아웃 등 인증 관련 기능을 제공합니다.
 */
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously as signInAnonymouslyFirebase,
  signOut as signOutFirebase,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';
import type { User } from '../../types/index';

// 로그인 상태 확인을 위한 로컬 스토리지 키
const AUTH_STATE_KEY = 'mac_board_auth_state';
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';

/**
 * 로컬 스토리지에 로그인 상태 저장
 */
const saveAuthState = (isLoggedIn: boolean, user?: User | null) => {
  try {
    if (isLoggedIn && user) {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
        isLoggedIn: true,
        user: user,
        timestamp: Date.now()
      }));
      console.log('로그인 상태 저장됨:', user.displayName);
    } else {
      localStorage.removeItem(AUTH_STATE_KEY);
      console.log('로그인 상태 삭제됨');
    }
  } catch (err) {
    console.error('로그인 상태 저장 오류:', err);
  }
};

/**
 * 로컬 스토리지에서 로그인 상태 확인
 */
export const getAuthState = (): { isLoggedIn: boolean, user?: User } => {
  try {
    // 로그아웃 강제 플래그 확인
    if (localStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
      console.log('강제 로그아웃 플래그 발견, 로그인 상태 무시');
      return { isLoggedIn: false };
    }
    
    const storedState = localStorage.getItem(AUTH_STATE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // 24시간 유효시간 확인 (86400000 밀리초 = 24시간)
      if (Date.now() - parsedState.timestamp < 86400000) {
        return {
          isLoggedIn: parsedState.isLoggedIn,
          user: parsedState.user
        };
      }
    }
  } catch (err) {
    console.error('로그인 상태 확인 오류:', err);
  }
  
  // 저장된 상태가 없거나 만료된 경우
  return { isLoggedIn: false };
};

/**
 * 구글 계정으로 로그인하는 함수
 * 팝업 창을 통해 구글 로그인을 진행합니다.
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    // 로그아웃 플래그 제거
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    if (result.user) {
      const user = {
        uid: result.user.uid,
        displayName: result.user.displayName || '사용자',
        email: result.user.email || undefined,
        photoURL: result.user.photoURL || undefined,
      };
      
      // 로컬 스토리지에 로그인 상태 저장
      saveAuthState(true, user);
      
      return user;
    }
    return null;
  } catch (error) {
    console.error('구글 로그인 오류:', error);
    throw error;
  }
};

/**
 * 익명으로 로그인하는 함수
 * 임시 사용자 계정으로 로그인합니다.
 */
export const signInAnonymously = async (): Promise<User | null> => {
  try {
    // 로그아웃 플래그 제거
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    
    const result = await signInAnonymouslyFirebase(auth);
    
    if (result.user) {
      const user = {
        uid: result.user.uid,
        displayName: '게스트',
        isAnonymous: true,
      };
      
      // 로컬 스토리지에 로그인 상태 저장
      saveAuthState(true, user);
      
      return user;
    }
    return null;
  } catch (error) {
    console.error('익명 로그인 오류:', error);
    throw error;
  }
};

/**
 * 브라우저 스토리지를 정리하는 함수
 */
const clearBrowserStorage = async () => {
  console.log('브라우저 스토리지 정리 시작');
  
  // 로그아웃 플래그 설정
  localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
  
  // 로컬 스토리지에서 로그인 상태 제거
  saveAuthState(false);
  
  // Firebase 관련 로컬 스토리지 키 삭제 시도
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('auth'))) {
        console.log(`삭제할 로컬 스토리지 키: ${key}`);
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('로컬 스토리지 정리 오류:', err);
  }
  
  // 세션 스토리지 정리
  try {
    sessionStorage.clear();
    console.log('세션 스토리지 삭제 완료');
  } catch (err) {
    console.warn('세션 스토리지 삭제 실패:', err);
  }
  
  // IndexedDB 정리
  try {
    const dbs = window.indexedDB.databases ? await window.indexedDB.databases() : [];
    for (const db of dbs) {
      if (db.name) {
        if (db.name.includes('firebase')) {
          console.log(`Firebase IndexedDB 삭제 시도: ${db.name}`);
        }
        window.indexedDB.deleteDatabase(db.name);
      }
    }
  } catch (err) {
    console.warn('IndexedDB 정리 오류:', err);
  }
  
  // 쿠키 정리
  try {
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('쿠키 정리 완료');
  } catch (err) {
    console.warn('쿠키 정리 오류:', err);
  }
  
  console.log('브라우저 스토리지 정리 완료');
};

/**
 * 로그아웃 함수
 */
export const signOut = async (): Promise<void> => {
  try {
    console.log('Firebase Auth: 로그아웃 시작');
    console.log('현재 인증된 사용자:', auth.currentUser?.uid);
    
    // 브라우저 스토리지 정리
    await clearBrowserStorage();
    
    console.log('Firebase Auth: signOutFirebase 호출');
    await signOutFirebase(auth);
    console.log('Firebase Auth: 로그아웃 완료');
    
  } catch (error) {
    console.error('Firebase Auth: 로그아웃 오류:', error);
    
    // 오류가 발생해도 로그아웃 플래그 설정
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    
    throw error;
  }
};

/**
 * Firebase 사용자 객체를 앱 사용자 객체로 변환하는 함수
 */
export const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || '사용자',
    email: firebaseUser.email || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    isAnonymous: firebaseUser.isAnonymous,
  };
};

/**
 * 현재 인증된 사용자 정보를 가져오는 함수
 */
export const getCurrentUser = (): User | null => {
  // 로그아웃 플래그 확인
  if (localStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
    return null;
  }
  
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  return mapFirebaseUserToUser(firebaseUser);
}; 