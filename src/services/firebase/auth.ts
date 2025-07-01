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

/**
 * 구글 계정으로 로그인하는 함수
 * 팝업 창을 통해 구글 로그인을 진행합니다.
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    if (result.user) {
      return {
        uid: result.user.uid,
        displayName: result.user.displayName || '사용자',
        email: result.user.email || undefined,
        photoURL: result.user.photoURL || undefined,
      };
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
    const result = await signInAnonymouslyFirebase(auth);
    
    if (result.user) {
      return {
        uid: result.user.uid,
        displayName: '게스트',
        isAnonymous: true,
      };
    }
    return null;
  } catch (error) {
    console.error('익명 로그인 오류:', error);
    throw error;
  }
};

/**
 * 로그아웃 함수
 */
export const signOut = async (): Promise<void> => {
  try {
    await signOutFirebase(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
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
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  return mapFirebaseUserToUser(firebaseUser);
}; 