/**
 * 게시물 데이터를 관리하는 커스텀 훅
 * 게시물 목록 조회, 필터링 등 기능을 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchPosts, 
  fetchPostsByCategory, 
  fetchPostsByTag 
} from '../services/firebase/firestore';
import type { Post } from '../types/index';

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: Error | null;
}

interface UsePostsOptions {
  category?: string;
  tag?: string;
}

/**
 * 게시물 데이터를 관리하는 커스텀 훅
 */
export const usePosts = (options: UsePostsOptions = {}): PostsState & { refresh: () => Promise<void> } => {
  const { category, tag } = options;
  const [state, setState] = useState<PostsState>({
    posts: [],
    loading: true,
    error: null,
  });

  // 게시물 데이터 조회 함수
  const loadPosts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let posts: Post[];
      
      if (tag) {
        // 태그로 필터링
        posts = await fetchPostsByTag(tag);
      } else if (category && category !== 'all') {
        // 카테고리로 필터링
        posts = await fetchPostsByCategory(category);
      } else {
        // 모든 게시물 조회
        posts = await fetchPosts();
      }
      
      setState({
        posts,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('게시물 조회 오류:', error);
      setState({
        posts: [],
        loading: false,
        error: error as Error,
      });
    }
  }, [category, tag]);

  // 컴포넌트 마운트 시 또는 의존성 변경 시 게시물 조회
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 상태와 새로고침 함수 반환
  return {
    ...state,
    refresh: loadPosts,
  };
}; 