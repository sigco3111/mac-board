# MAC-BOARD

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

MAC-BOARD는 Mac OS 인터페이스에서 영감을 받은 직관적이고 심미적인 온라인 게시판 시스템입니다. 사용자들은 다양한 주제에 대한 게시물을 작성하고, 공유하며 커뮤니티를 형성할 수 있습니다. 데스크톱 환경을 시뮬레이션하는 UI를 통해 친숙하고 직관적인 사용자 경험을 제공합니다.

## 🌟 주요 기능

- **Mac OS 스타일 인터페이스**
  - 바탕화면, 창 시스템, Dock 등 Mac OS 스타일 UI
  - 창 드래그, 리사이즈, 최소화/최대화 기능
  - 사용자 지정 배경화면 설정

- **Firebase 인증**
  - 구글 소셜 로그인
  - 익명 사용자 접근 지원
  - 로그인 상태 유지 및 관리

- **게시판 시스템**
  - 카테고리 기반 게시물 관리 (모든 게시물, 공지사항, 자유게시판, 라이브러리, 뉴스 스크랩)
  - 게시물 CRUD 기능
  - 댓글 및 대댓글 지원

- **고급 기능**
  - 마크다운 지원 및 실시간 프리뷰
  - 게시물 북마크 및 Quick Look 미리보기
  - 태그, 작성자, 기간 등 다양한 필터 기반 고급 검색

- **반응형 디자인**
  - 모바일, 태블릿, 데스크톱 지원
  - 모든 화면 크기에 최적화된 레이아웃

## 💻 기술 스택

### 프론트엔드
- React (TypeScript)
- Tailwind CSS
- React Markdown
- React Draggable/Resizable

### 백엔드
- Firebase Authentication
- Firestore Database
- Firebase Hosting
- Firebase Security Rules

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js (v14 이상)
- npm 또는 yarn

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/mac-board.git
cd mac-board
```

2. 의존성 패키지 설치
```bash
npm install
# 또는
yarn install
```

3. 환경 변수 설정
- `.env.local` 파일을 생성하고 Firebase 설정 정보 추가
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

5. 빌드
```bash
npm run build
# 또는
yarn build
```

## 📂 프로젝트 구조

```
mac-board/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Desktop.tsx
│   │   ├── Window.tsx
│   │   ├── Dock.tsx
│   │   ├── Finder.tsx
│   │   ├── MarkdownEditor.tsx
│   │   └── ...
│   ├── services/
│   │   └── firebase/
│   │       ├── config.ts
│   │       ├── auth.ts
│   │       └── firestore.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   └── ...
│   ├── utils/
│   ├── App.tsx
│   ├── index.tsx
│   └── types.ts
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🔍 주요 기능 구현

### 1. 인증 시스템
Firebase Authentication을 활용하여 구글 로그인 및 익명 로그인을 지원합니다. 사용자의 인증 상태는 전역적으로 관리되며, 로그인 상태에 따라 접근 가능한 기능이 달라집니다.

### 2. 게시판 시스템
Firestore를 사용하여 게시물 데이터를 저장하고 관리합니다. 카테고리별 게시물 조회, 필터링, 태그 기반 검색 등의 기능을 제공합니다.

### 3. 마크다운 지원
게시물 작성 시 마크다운 문법을 지원하여 풍부한 텍스트 포맷팅이 가능합니다. 실시간 프리뷰 기능을 통해 작성 중인 마크다운의 렌더링 결과를 바로 확인할 수 있습니다.

### 4. Mac OS 스타일 UI
데스크톱 환경, 창 시스템, Dock 등 Mac OS의 사용자 경험을 웹에서 구현하였습니다. 창 드래그, 리사이즈, Dock 애니메이션 등 OS와 유사한 상호작용을 제공합니다.

## 🔄 개발 로드맵

1. **기본 인프라 및 UI 구성** - 프로젝트 초기 설정, Firebase 연동, 기본 UI 컴포넌트
2. **핵심 기능 개발** - 게시글 CRUD, Finder 인터페이스, 마크다운 에디터
3. **고급 기능 구현** - 댓글 시스템, 북마크 기능, 고급 검색, 설정
4. **최적화 및 배포** - 반응형 디자인, 성능 최적화, 테스트, Vercel 배포

## 🤝 기여하기

1. Fork 저장소
2. 새로운 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 관리자 - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

프로젝트 링크: [https://github.com/yourusername/mac-board](https://github.com/yourusername/mac-board) 