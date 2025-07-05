/**
 * 게시물 목록을 관리하는 커스텀 훅
 * @returns 게시물 관련 상태 및 함수들
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchPosts, fetchPostsByCategory, fetchPostsByTag, UIPost, fetchCategoriesFromFirestore } from '../services/firebase/firestore';
import { Category } from '../types';

/**
 * 게시물 목록을 관리하는 커스텀 훅
 * @param options 필터링 옵션 (카테고리, 태그)
 * @returns 게시물 관련 상태 및 함수들
 */
export const usePosts = (options?: { category?: string; tag?: string }) => {
  // 게시물 목록 상태
  const [posts, setPosts] = useState<UIPost[]>([]);
  // 로딩 상태
  const [loading, setLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<Error | null>(null);
  // 카테고리 목록 상태
  const [categories, setCategories] = useState<Category[]>([]);
  // 카테고리 로딩 상태
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  // 태그 목록 상태
  const [allTags, setAllTags] = useState<string[]>([]);

  // 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const categoriesData = await fetchCategoriesFromFirestore();
        
        // Firestore에서 가져온 카테고리 데이터를 UI 컴포넌트에 맞게 변환
        const uiCategories: Category[] = [
          { id: 'all', name: '모든 게시물' },
          ...categoriesData.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon // 아이콘 필드 추가
          }))
        ];
        
        setCategories(uiCategories);
      } catch (err) {
        console.error('카테고리 로드 오류:', err);
        setError(err instanceof Error ? err : new Error('카테고리 로드 중 오류가 발생했습니다.'));
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  // 전체 게시물 로드
  const loadAllPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('모든 게시물 로드 중...');
      const postsData = await fetchPosts();
      setPosts(postsData);
      
      // 모든 태그 추출 및 중복 제거
      const tags = postsData.flatMap(post => post.tags || []);
      setAllTags([...new Set(tags)]);
    } catch (err) {
      console.error('게시물 로드 오류:', err);
      setError(err instanceof Error ? err : new Error('게시물 로드 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // 카테고리별 게시물 로드
  const loadPostsByCategory = useCallback(async (category: string) => {
    if (category === 'all') {
      return loadAllPosts();
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log(`'${category}' 카테고리 게시물 로드 중...`);
      const postsData = await fetchPostsByCategory(category);
      console.log(`'${category}' 카테고리 게시물 로드 완료:`, postsData.length);
      setPosts(postsData);
      
      // 해당 카테고리의 모든 태그 추출 및 중복 제거
      const tags = postsData.flatMap(post => post.tags || []);
      setAllTags([...new Set(tags)]);
    } catch (err) {
      console.error(`${category} 카테고리 게시물 로드 오류:`, err);
      setError(err instanceof Error ? err : new Error(`${category} 카테고리 게시물 로드 중 오류가 발생했습니다.`));
    } finally {
      setLoading(false);
    }
  }, [loadAllPosts]);

  // 태그별 게시물 로드
  const loadPostsByTag = useCallback(async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`'${tag}' 태그 게시물 로드 중...`);
      const postsData = await fetchPostsByTag(tag);
      console.log(`'${tag}' 태그 게시물 로드 완료:`, postsData.length);
      setPosts(postsData);
    } catch (err) {
      console.error(`${tag} 태그 게시물 로드 오류:`, err);
      setError(err instanceof Error ? err : new Error(`${tag} 태그 게시물 로드 중 오류가 발생했습니다.`));
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드 및 필터링 옵션 변경 시 데이터 다시 로드
  useEffect(() => {
    if (options?.tag) {
      loadPostsByTag(options.tag);
    } else if (options?.category && options.category !== 'all') {
      loadPostsByCategory(options.category);
    } else {
      loadAllPosts();
    }
  }, [options?.category, options?.tag, loadAllPosts, loadPostsByCategory, loadPostsByTag]);

  // 데이터 새로고침 함수
  const refresh = useCallback(() => {
    if (options?.tag) {
      loadPostsByTag(options.tag);
    } else if (options?.category && options.category !== 'all') {
      loadPostsByCategory(options.category);
    } else {
      loadAllPosts();
    }
  }, [options?.category, options?.tag, loadAllPosts, loadPostsByCategory, loadPostsByTag]);

  return {
    posts,
    loading,
    error,
    categories,
    categoriesLoading,
    allTags,
    loadAllPosts,
    loadPostsByCategory,
    loadPostsByTag,
    refresh,
  };
}; 