/**
 * Firebase Firestore 관련 함수
 * 게시물 CRUD 및 데이터 관리 기능을 제공합니다.
 */
import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './config';
import type { Post } from '../../types/index';

// Firestore 컬렉션 이름
const POSTS_COLLECTION = 'posts';
const BOOKMARKS_COLLECTION = 'bookmarks';
const SETTINGS_COLLECTION = 'settings';

/**
 * Firestore 문서를 앱 객체로 변환하는 함수
 */
const mapDocToPost = (doc: QueryDocumentSnapshot<DocumentData>): Post => {
  const data = doc.data();
  return {
    id: parseInt(doc.id),
    author: {
      name: data.author?.displayName || '알 수 없음',
      avatarUrl: data.author?.photoURL || '',
    },
    category: data.category || 'general',
    title: data.title || '제목 없음',
    content: data.content || '',
    date: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
    comments: data.commentCount || 0,
    isNew: data.createdAt ? (new Date().getTime() - new Date(data.createdAt).getTime()) < 24 * 60 * 60 * 1000 : false,
    tags: data.tags || [],
  };
};

/**
 * 모든 게시물을 가져오는 함수
 */
export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToPost);
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 카테고리의 게시물을 가져오는 함수
 */
export const fetchPostsByCategory = async (category: string): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToPost);
  } catch (error) {
    console.error(`${category} 카테고리 게시물 조회 오류:`, error);
    throw error;
  }
};

/**
 * 특정 태그의 게시물을 가져오는 함수
 */
export const fetchPostsByTag = async (tag: string): Promise<Post[]> => {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapDocToPost);
  } catch (error) {
    console.error(`${tag} 태그 게시물 조회 오류:`, error);
    throw error;
  }
};

/**
 * 게시물 상세 정보를 가져오는 함수
 */
export const fetchPostById = async (postId: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return mapDocToPost(docSnap as QueryDocumentSnapshot<DocumentData>);
    } else {
      console.log('게시물을 찾을 수 없습니다');
      return null;
    }
  } catch (error) {
    console.error('게시물 상세 조회 오류:', error);
    throw error;
  }
};

/**
 * 새 게시물을 생성하는 함수
 */
export const createPost = async (postData: Omit<Post, 'id' | 'date' | 'comments' | 'isNew'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      ...postData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentCount: 0,
      viewCount: 0,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    throw error;
  }
};

/**
 * 게시물을 수정하는 함수
 */
export const updatePost = async (postId: string, postData: Partial<Post>): Promise<void> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    
    await updateDoc(docRef, {
      ...postData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('게시물 수정 오류:', error);
    throw error;
  }
};

/**
 * 게시물을 삭제하는 함수
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    throw error;
  }
}; 