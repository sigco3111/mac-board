/**
 * 관리자 전용 카테고리 관리 함수
 * 카테고리 목록 조회, 추가, 수정, 삭제 기능을 제공합니다.
 */
import { 
  doc,
  getDoc, 
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isAdminAuthenticated } from './auth';

// Firestore 설정 문서 정보
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global-settings';
const POSTS_COLLECTION = 'posts';

// 관리자 권한 검증 에러 메시지
const ADMIN_AUTH_ERROR = '관리자 권한이 필요합니다.';
const NOT_FOUND_ERROR = '설정 데이터를 찾을 수 없습니다.';
const UPDATE_ERROR = '카테고리 업데이트 중 오류가 발생했습니다.';

/**
 * 카테고리 인터페이스
 */
export interface CategoryItem {
  id: string;
  name: string;
}

/**
 * 관리자 권한 검증 함수
 * @throws {Error} 관리자가 아닌 경우 에러 발생
 */
const verifyAdminAuth = () => {
  if (!isAdminAuthenticated()) {
    throw new Error(ADMIN_AUTH_ERROR);
  }
};

/**
 * 모든 카테고리 조회 함수
 * @returns 카테고리 목록
 */
export const fetchCategories = async (): Promise<CategoryItem[]> => {
  try {
    // 전역 설정 문서 조회
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      throw new Error(NOT_FOUND_ERROR);
    }
    
    const settingsData = settingsSnap.data();
    return settingsData.categories || [];
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    throw new Error(`카테고리 목록을 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 카테고리 추가 함수
 * @param category 추가할 카테고리 정보
 * @returns 추가된 카테고리 ID
 */
export const addCategory = async (category: Omit<CategoryItem, 'id'>): Promise<string> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  try {
    // 새 카테고리 ID 생성 (소문자 알파벳과 숫자만 포함)
    const newId = category.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    if (!newId) {
      throw new Error('유효한 카테고리 ID를 생성할 수 없습니다. 카테고리 이름을 확인해주세요.');
    }

    // 설정 문서 참조
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    // 트랜잭션으로 중복 검사 및 추가
    return await runTransaction(db, async (transaction) => {
      const settingsDoc = await transaction.get(settingsRef);
      
      if (!settingsDoc.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      const settingsData = settingsDoc.data();
      const categories = settingsData.categories || [];
      
      // 중복 ID 검사
      if (categories.some((cat: CategoryItem) => cat.id === newId)) {
        throw new Error(`ID '${newId}'는 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 중복 이름 검사
      if (categories.some((cat: CategoryItem) => cat.name === category.name)) {
        throw new Error(`이름 '${category.name}'은(는) 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 새 카테고리 추가
      const newCategory = { id: newId, name: category.name };
      transaction.update(settingsRef, {
        categories: arrayUnion(newCategory),
        updatedAt: Timestamp.now()
      });
      
      return newId;
    });
  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    throw new Error(`카테고리 추가 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 카테고리 수정 함수
 * @param categoryId 수정할 카테고리 ID
 * @param updatedName 새 카테고리 이름
 * @returns 수정 성공 여부
 */
export const updateCategory = async (categoryId: string, updatedName: string): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  // 시스템 카테고리 수정 제한
  if (categoryId === 'general' || categoryId === 'tech' || categoryId === 'questions') {
    throw new Error('기본 시스템 카테고리는 수정할 수 없습니다.');
  }
  
  try {
    // 설정 문서 참조
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    
    // 트랜잭션으로 중복 검사 및 수정
    return await runTransaction(db, async (transaction) => {
      const settingsDoc = await transaction.get(settingsRef);
      
      if (!settingsDoc.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      const settingsData = settingsDoc.data();
      const categories = settingsData.categories || [];
      
      // 대상 카테고리 검색
      const categoryIndex = categories.findIndex((cat: CategoryItem) => cat.id === categoryId);
      
      if (categoryIndex === -1) {
        throw new Error(`ID가 '${categoryId}'인 카테고리를 찾을 수 없습니다.`);
      }
      
      // 중복 이름 검사 (다른 카테고리와 이름 중복 확인)
      if (categories.some((cat: CategoryItem, index: number) => 
          cat.name === updatedName && index !== categoryIndex)) {
        throw new Error(`이름 '${updatedName}'은(는) 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 새 카테고리 배열 생성
      const updatedCategories = [...categories];
      updatedCategories[categoryIndex] = { 
        ...updatedCategories[categoryIndex], 
        name: updatedName 
      };
      
      // 업데이트 실행
      transaction.update(settingsRef, {
        categories: updatedCategories,
        updatedAt: Timestamp.now()
      });
      
      return true;
    });
  } catch (error) {
    console.error(`카테고리 수정 오류 (ID: ${categoryId}):`, error);
    throw new Error(`카테고리 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 카테고리 삭제 함수
 * @param categoryId 삭제할 카테고리 ID
 * @returns 삭제 성공 여부
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  // 시스템 카테고리 삭제 제한
  if (categoryId === 'general' || categoryId === 'tech' || categoryId === 'questions') {
    throw new Error('기본 시스템 카테고리는 삭제할 수 없습니다.');
  }
  
  try {
    // 설정 문서 참조
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      throw new Error(NOT_FOUND_ERROR);
    }
    
    const settingsData = settingsSnap.data();
    const categories = settingsData.categories || [];
    
    // 대상 카테고리 검색
    const categoryToDelete = categories.find((cat: CategoryItem) => cat.id === categoryId);
    
    if (!categoryToDelete) {
      throw new Error(`ID가 '${categoryId}'인 카테고리를 찾을 수 없습니다.`);
    }
    
    // 트랜잭션 시작 - 카테고리 삭제 및 게시물 카테고리 변경
    return await runTransaction(db, async (transaction) => {
      // 1. 해당 카테고리의 게시물 조회
      const postsQuery = query(
        collection(db, POSTS_COLLECTION),
        where('category', '==', categoryId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      // 2. 모든 게시물의 카테고리를 'general'로 변경
      postsSnapshot.docs.forEach(postDoc => {
        const postRef = doc(db, POSTS_COLLECTION, postDoc.id);
        transaction.update(postRef, { 
          category: 'general',
          updatedAt: Timestamp.now()
        });
      });
      
      // 3. 카테고리 삭제
      transaction.update(settingsRef, {
        categories: arrayRemove(categoryToDelete),
        updatedAt: Timestamp.now()
      });
      
      console.log(`카테고리 '${categoryId}' 삭제 완료, ${postsSnapshot.size}개의 게시물을 'general' 카테고리로 이동했습니다.`);
      return true;
    });
  } catch (error) {
    console.error(`카테고리 삭제 오류 (ID: ${categoryId}):`, error);
    throw new Error(`카테고리 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 카테고리 순서 변경 함수
 * @param sortedCategories 정렬된 카테고리 목록
 * @returns 업데이트 성공 여부
 */
export const reorderCategories = async (sortedCategories: CategoryItem[]): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  try {
    // 기존 카테고리 가져오기
    const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      throw new Error(NOT_FOUND_ERROR);
    }
    
    // 카테고리 유효성 검사 (모든 기존 카테고리가 포함되어 있는지)
    const existingCategories = settingsSnap.data().categories || [];
    const existingIds = new Set(existingCategories.map((cat: CategoryItem) => cat.id));
    const newIds = new Set(sortedCategories.map(cat => cat.id));
    
    // 삭제된 ID 확인
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        throw new Error(`카테고리 ID '${id}'가 누락되었습니다. 모든 기존 카테고리를 포함해야 합니다.`);
      }
    }
    
    // 추가된 ID 확인
    for (const id of newIds) {
      if (!existingIds.has(id)) {
        throw new Error(`카테고리 ID '${id}'는 기존에 존재하지 않습니다. 새 카테고리는 추가할 수 없습니다.`);
      }
    }
    
    // 순서 업데이트
    await updateDoc(settingsRef, {
      categories: sortedCategories,
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('카테고리 순서 변경 오류:', error);
    throw new Error(`카테고리 순서 변경 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}; 