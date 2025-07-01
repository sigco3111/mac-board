# MAC-BOARD 개발 가이드라인

## 1. 프로젝트 개요

- MAC-BOARD는 Mac OS 인터페이스에서 영감을 받은 직관적인 온라인 게시판 시스템
- **기술 스택**: React, TypeScript, Tailwind CSS, Firebase
- **주요 기능**: 게시물 CRUD, 구글 로그인, 마크다운 지원, 북마크 시스템, 반응형 디자인

## 2. 프로젝트 아키텍처

### 2.1 폴더 구조

- `components/`: 모든 UI 컴포넌트 (현재 가장 활발한 개발 영역)
- `services/`: 외부 서비스(Firebase) 연동 코드 (반드시 여기에 구현)
- `hooks/`: React 커스텀 훅 (상태 관리, 로직 재사용)
- `utils/`: 유틸리티 함수 (날짜 포맷팅, 데이터 처리 등)
- `assets/`: 이미지, 아이콘 등 정적 리소스
- `types.ts`: 핵심 타입 정의 파일

### 2.2 주요 파일 역할

- `App.tsx`: 애플리케이션 진입점, 상태 관리, 라우팅
- `types.ts`: 타입 정의 (Post, Category, User 등)
- `components/BulletinBoard.tsx`: 메인 게시판 컴포넌트
- `components/LoginScreen.tsx`: 로그인 화면
- `components/Desktop.tsx`: 바탕화면 환경 시뮬레이션
- `components/NewPostModal.tsx`: 게시물 작성/편집 모달

## 3. 코드 작성 표준

### 3.1 주석 규칙

- 모든 함수와 주요 로직 상단에 한국어로 목적 설명
- 복잡한 로직에는 한국어로 맥락 설명 필수

```tsx
/**
 * 게시물 목록을 필터링하는 함수
 * 카테고리와 태그를 기준으로 필터링합니다.
 */
const filterPosts = (posts: Post[], category: string, tag: string | null) => {
  // 카테고리가 'all'이 아니면 해당 카테고리만 필터링
  const categoryFiltered = category === 'all' 
    ? posts 
    : posts.filter(post => post.category === category);
  
  // 태그가 있으면 해당 태그를 가진 게시물만 필터링
  return tag 
    ? categoryFiltered.filter(post => post.tags?.includes(tag)) 
    : categoryFiltered;
};
```

### 3.2 네이밍 규칙

- **상수**: 대문자와 언더스코어 (`MAX_POSTS_PER_PAGE`)
- **Boolean 변수**: is, has, can으로 시작 (`isVisible`, `hasPermission`)
- **함수**: 동사로 시작하는 camelCase (`fetchPosts`, `handleSubmit`)
- **컴포넌트**: PascalCase (`PostList`, `LoginButton`)

### 3.3 에러 처리

- 모든 비동기 작업은 try-catch로 처리
- 에러 발생 시 로그 기록 및 사용자 친화적 메시지 제공
- 에러 메시지는 구체적이지 않게 일반화

```tsx
try {
  await createPost(newPost);
} catch (error) {
  console.error('게시물 생성 오류:', error);
  // 사용자에게는 구체적이지 않은 메시지
  setErrorMessage('게시물을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
}
```

## 4. Firebase 연동 규칙

### 4.1 Firebase 구성

- `services/firebase/config.ts`: Firebase 설정 정보 (반드시 환경변수 사용)
- `services/firebase/auth.ts`: 인증 관련 함수
- `services/firebase/firestore.ts`: Firestore 데이터 액세스 함수

### 4.2 인증 구현

```tsx
// services/firebase/auth.ts
import { auth } from './config';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously as signInAnonymouslyFirebase } from 'firebase/auth';

/**
 * 구글 계정으로 로그인하는 함수
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('구글 로그인 오류:', error);
    throw error;
  }
};

/**
 * 익명으로 로그인하는 함수
 */
export const signInAnonymously = async () => {
  try {
    const result = await signInAnonymouslyFirebase(auth);
    return result.user;
  } catch (error) {
    console.error('익명 로그인 오류:', error);
    throw error;
  }
};
```

### 4.3 Firestore 데이터 액세스

```tsx
// services/firebase/firestore.ts
import { db } from './config';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { Post } from '../../types';

/**
 * 게시물 목록을 가져오는 함수
 * 카테고리가 지정된 경우 해당 카테고리의 게시물만 반환
 */
export const fetchPosts = async (category?: string) => {
  try {
    let postsQuery;
    
    if (category && category !== 'all') {
      postsQuery = query(collection(db, 'posts'), where('category', '==', category));
    } else {
      postsQuery = collection(db, 'posts');
    }
    
    const snapshot = await getDocs(postsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    throw error;
  }
};

/**
 * 새 게시물을 생성하는 함수
 */
export const createPost = async (post: Omit<Post, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...post,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      bookmarkCount: 0
    });
    
    return docRef.id;
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    throw error;
  }
};
```

### 4.4 인증 상태 관리 (커스텀 훅)

```tsx
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { auth } from '../services/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from '../types';

/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || '사용자',
          avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/96?u=${firebaseUser.uid}`,
          uid: firebaseUser.uid
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return { user, loading };
};
```

## 5. 컴포넌트 관리 및 확장

### 5.1 기존 컴포넌트 수정 규칙

- 컴포넌트 인터페이스(props)를 변경할 때는 타입 정의 수정 필수
- 컴포넌트 상태 관리는 내부에서 처리하고 이벤트는 props로 전달
- 기존 컴포넌트 수정 시 일관된 스타일 유지

### 5.2 새 컴포넌트 추가 규칙

- 단일 책임 원칙 준수 (한 컴포넌트는 한 가지 역할만)
- Props 타입 인터페이스 명시적 정의
- 컴포넌트 파일명은 PascalCase로 작성

```tsx
// 올바른 예: MarkdownPreview.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * 마크다운 콘텐츠를 렌더링하는 컴포넌트
 */
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  return (
    <div className={`markdown-preview ${className || ''}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
```

### 5.3 Tailwind CSS 사용 규칙

- 일관된 색상 및 간격 사용 (커스텀 테마 참조)
- 반응형 클래스 적절히 사용 (`md:`, `lg:` 등)
- 복잡한 스타일은 컴포넌트로 추출

## 6. 마크다운 및 북마크 기능

### 6.1 마크다운 지원

- react-markdown 패키지 사용
- NewPostModal에서 마크다운 입력 및 프리뷰 기능 구현
- 마크다운 에디터와 프리뷰를 탭으로 전환 가능하게 구현

```tsx
// 마크다운 프리뷰 탭 구현 예시
const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

return (
  <div>
    <div className="flex border-b mb-4">
      <button 
        onClick={() => setActiveTab('write')} 
        className={`py-2 px-4 ${activeTab === 'write' ? 'border-b-2 border-blue-500' : ''}`}
      >
        작성
      </button>
      <button 
        onClick={() => setActiveTab('preview')} 
        className={`py-2 px-4 ${activeTab === 'preview' ? 'border-b-2 border-blue-500' : ''}`}
      >
        미리보기
      </button>
    </div>
    
    {activeTab === 'write' ? (
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        className="w-full p-2 border rounded"
      />
    ) : (
      <MarkdownPreview content={content} className="p-2 border rounded" />
    )}
  </div>
);
```

### 6.2 북마크 시스템

- 북마크 데이터 모델:
  ```tsx
  interface Bookmark {
    id: string;
    userId: string;
    postId: string;
    createdAt: string;
    folder?: string;
  }
  ```

- 북마크 상태 관리는 전역 상태 또는 컨텍스트 사용
- 바탕화면에 북마크 폴더 아이콘 추가
- 북마크 폴더 클릭 시 북마크된 게시물 목록 표시

## 7. 반응형 디자인

### 7.1 모바일 최적화

- 기본 화면 사이즈는 최소 320px 기준으로 디자인
- 모바일에서는 메뉴 축소 및 햄버거 메뉴 사용
- 작은 화면에서 게시판은 목록만 보이고 상세보기는 전체 화면으로 전환

### 7.2 반응형 클래스 사용

```tsx
// 반응형 레이아웃 예시
<div className="flex flex-col md:flex-row">
  <Sidebar className="w-full md:w-60 mb-4 md:mb-0" />
  <div className="flex-grow">
    <PostList />
  </div>
</div>
```

### 7.3 모바일 제스처 지원

- 터치 이벤트 및 스와이프 제스처 구현
- 모바일에서 편리한 네비게이션 경험 제공

## 8. 작업 흐름 가이드

### 8.1 Firebase 설정 및 연동

1. Firebase 프로젝트 설정 파일 생성
2. 인증 서비스 구현
3. Firestore 데이터 모델 및 액세스 함수 구현

### 8.2 컴포넌트 개발 흐름

1. 데이터 모델 및 인터페이스 정의 (`types.ts`)
2. 서비스 계층 구현 (`services/`)
3. 상태 관리 훅 개발 (`hooks/`)
4. UI 컴포넌트 구현 (`components/`)

### 8.3 기능 구현 우선순위

1. Firebase 인증 (구글 로그인, 익명 로그인)
2. 게시물 CRUD 기능
3. 마크다운 지원 및 프리뷰
4. 북마크 시스템
5. 반응형 최적화
6. 바탕화면 이미지 설정

## 9. AI 에이전트 의사결정 기준

### 9.1 모호한 상황에서의 판단

1. 기존 코드 패턴 및 구조를 최우선으로 따름
2. PRD 문서에 명시된 요구사항 준수
3. 사용자 경험을 해치지 않는 방향으로 결정
4. 확장성과 유지보수성 고려

### 9.2 기능 추가 판단 기준

- **필수 구현**: PRD에 명시된 모든 기능
- **권장 구현**: 사용자 경험 향상을 위한 기능 (로딩 상태, 에러 처리 등)
- **선택 구현**: 추가적인 개선 사항 (애니메이션, 테마 등)

## 10. 금지 사항

### 10.1 안티패턴

- ❌ 컴포넌트 내에서 직접 Firebase 호출
- ❌ 인라인 스타일 사용 (대신 Tailwind 클래스 사용)
- ❌ any 타입 사용 (명확한 타입 정의 필수)
- ❌ 중복 상태 관리 (props 드릴링 대신 컨텍스트 사용)

### 10.2 예시: 잘못된 구현

```tsx
// ❌ 잘못된 예: 컴포넌트 내 직접 Firebase 호출
const PostList = () => {
  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
    // 직접 Firebase 호출 - 금지!
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'posts'));
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);
  
  return (/* ... */);
};
```

### 10.3 예시: 올바른 구현

```tsx
// ✅ 올바른 예: 서비스 함수 사용
import { fetchPosts } from '../services/firebase/firestore';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
      } catch (err) {
        console.error('게시물 로딩 오류:', err);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (/* ... */);
};
``` 