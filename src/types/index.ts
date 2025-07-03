import React from 'react';
import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;             // 게시물 고유 ID
  title: string;          // 게시물 제목
  content: string;        // 게시물 내용 (HTML 형식 지원)
  category: string;       // 게시물 카테고리 ('general', 'tech' 등)
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
  };
  authorId: string;       // 작성자 고유 ID (사용자 인증 시스템과 연동)
  tags: string[];         // 게시물 태그 목록
  createdAt: Timestamp;   // 생성 시간 (Firebase Timestamp)
  updatedAt: Timestamp;   // 수정 시간 (Firebase Timestamp)
  commentCount: number;   // 댓글 수
  viewCount: number;      // 조회수
  // UI 용도로 사용되는 필드
  isNew?: boolean;        // 새 게시물 여부 (24시간 내 작성)
}

// UI에서 표시할 때 사용하는 포스트 타입
export interface UIPost {
  id: string;
  author: {
    name: string;
  };
  authorId: string;
  category: string;
  title: string;
  content: string;
  date: string;
  comments: number;
  isNew: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  name:string;
  icon: React.ReactNode;
}

export type MenuItem =
  | {
      label: string;
      action?: () => void;
      disabled?: boolean;
      items?: MenuItem[];
      isSeparator?: false;
    }
  | {
      isSeparator: true;
    };


export interface Menu {
  name: string;
  items: MenuItem[];
}

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isAnonymous?: boolean;
} 