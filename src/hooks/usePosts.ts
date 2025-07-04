/**
 * 게시물 데이터를 관리하는 커스텀 훅
 * 게시물 목록 조회, 필터링 등 기능을 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchPosts, 
  fetchPostsByCategory, 
  fetchPostsByTag,
  fetchPostsByDateRange,
  fetchUpdatedPostsByDateRange
} from '../services/firebase/firestore';
import type { UIPost } from '../types/index';

interface PostsState {
  posts: UIPost[];
  loading: boolean;
  error: Error | null;
}

interface UsePostsOptions {
  category?: string;
  tag?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
    type?: 'created' | 'updated';
  };
}

/**
 * 게시물 데이터를 관리하는 커스텀 훅
 * @param options 게시물 조회 옵션 (카테고리, 태그, 날짜 범위 등)
 * @returns 게시물 목록, 로딩 상태, 에러 상태 및 새로고침 함수
 */
export const usePosts = (options: UsePostsOptions = {}): PostsState & { refresh: () => Promise<void> } => {
  const { category, tag, dateRange } = options;
  const [state, setState] = useState<PostsState>({
    posts: [],
    loading: true,
    error: null,
  });

  // 게시물 데이터 조회 함수
  const loadPosts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let posts: UIPost[];
      
      if (dateRange) {
        // 날짜 범위로 필터링
        const { startDate, endDate, type = 'created' } = dateRange;
        if (type === 'updated') {
          posts = await fetchUpdatedPostsByDateRange(startDate, endDate);
        } else {
          posts = await fetchPostsByDateRange(startDate, endDate);
        }
      } else if (tag) {
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
        error: error instanceof Error ? error : new Error('게시물을 가져오는 중 오류가 발생했습니다.'),
      });
    }
  }, [category, tag, dateRange]);

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