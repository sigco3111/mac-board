/**
 * Firebase 설정 및 초기화
 * Firebase 서비스 연결을 위한 설정과 인스턴스를 제공합니다.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 파일
// Firebase 초기화 및 앱 설정을 관리합니다.

// 개발 모드 여부 확인
const isDevelopment = import.meta.env.MODE === 'development';

// Firebase 설정 정보
// 실제 프로젝트에서는 환경변수로 관리하는 것을 권장합니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// 필수 환경변수 확인
const missingEnvVars = [];
if (!firebaseConfig.apiKey) missingEnvVars.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingEnvVars.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingEnvVars.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingEnvVars.push('VITE_FIREBASE_APP_ID');

if (missingEnvVars.length > 0) {
  const errorMessage = `Firebase 설정 오류: 다음 환경변수가 설정되지 않았습니다: ${missingEnvVars.join(', ')}. .env 파일을 확인하세요.`;
  if (isDevelopment) {
    console.error(errorMessage);
    console.info('참고: .env.example 파일을 .env로 복사하고 Firebase 콘솔에서 프로젝트 설정 값을 추가하세요.');
  }
}

// Firebase 설정 정보 디버깅 로그 (개발 모드에서만 출력)
if (isDevelopment) {
  console.log('Firebase 설정 정보:', {
    apiKeyExists: !!firebaseConfig.apiKey,
    authDomainExists: !!firebaseConfig.authDomain,
    projectIdExists: !!firebaseConfig.projectId,
    appIdExists: !!firebaseConfig.appId
  });
}

// Firebase 앱 초기화
export const firebaseApp = initializeApp(firebaseConfig);

// 인증 서비스 인스턴스
export const auth = getAuth(firebaseApp);
if (isDevelopment) {
  console.log('Firebase 인증 서비스 초기화됨:', auth.currentUser ? '사용자 있음' : '사용자 없음');
}

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(firebaseApp);

/**
 * Firebase 설정이 완료되었는지 확인하는 함수
 * @returns {boolean} Firebase 설정 여부
 */
export const isFirebaseConfigured = (): boolean => {
  const { apiKey, authDomain, projectId } = firebaseConfig;
  const isConfigured = Boolean(apiKey && authDomain && projectId);
  if (isDevelopment) {
    console.log('Firebase 설정 완료 여부:', isConfigured);
  }
  return isConfigured;
};

/**
 * Firebase 설정 상태를 확인하고 오류 메시지를 반환하는 함수
 * 환경변수가 설정되지 않은 경우 사용자에게 안내 메시지를 제공합니다.
 * @returns {string | null} 오류 메시지 또는 null
 */
export const getFirebaseConfigErrorMessage = (): string | null => {
  if (missingEnvVars.length > 0) {
    return '환경 설정이 완료되지 않았습니다. 관리자에게 문의하세요.';
  }
  return null;
};

export default firebaseApp; 