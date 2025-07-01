/**
 * Firebase 설정 및 초기화
 * Firebase 서비스 연결을 위한 설정과 인스턴스를 제공합니다.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 객체
// 환경 변수에서 값을 가져옵니다
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 인증 서비스 인스턴스
export const auth = getAuth(app);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

export default app; 