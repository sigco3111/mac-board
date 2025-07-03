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
import type { Post, UIPost } from '../../types/index';

// Firestore 컬렉션 이름
const POSTS_COLLECTION = 'posts';
const BOOKMARKS_COLLECTION = 'bookmarks';
const SETTINGS_COLLECTION = 'settings';
const COMMENTS_COLLECTION = 'comments';
const USERS_COLLECTION = 'users';

// 에러 발생 시 최대 재시도 횟수
const MAX_RETRY_COUNT = 3;

/**
 * 지수 백오프 지연 함수
 * 재시도 사이에 점점 늘어나는 지연 시간을 적용합니다.
 */
const delay = (attempts: number) => {
  return new Promise(resolve => {
    // 1초, 2초, 4초 등으로 지연 시간 증가
    const waitTime = Math.pow(2, attempts - 1) * 1000;
    setTimeout(resolve, waitTime);
  });
};

/**
 * Firestore 문서를 앱 객체로 변환하는 함수
 * @param doc Firestore 문서 스냅샷
 * @returns Post 객체 
 */
const mapDocToPost = (doc: QueryDocumentSnapshot<DocumentData>): Post => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title || '제목 없음',
    content: data.content || '',
    category: data.category || 'general',
    author: {
      name: data.author?.name || '알 수 없음',
    },
    authorId: data.authorId || '',
    tags: data.tags || [],
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
    commentCount: data.commentCount || 0,
    viewCount: data.viewCount || 0,
    isNew: data.createdAt ? 
      (Timestamp.now().toMillis() - data.createdAt.toMillis()) < 24 * 60 * 60 * 1000 
      : false,
  };
};

/**
 * Firestore Post를 UI용 Post로 변환하는 함수
 * @param post Firestore Post 객체
 * @returns UIPost 객체
 */
export const convertToUIPost = (post: Post): UIPost => {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    author: post.author,
    authorId: post.authorId,
    date: post.createdAt.toDate().toISOString(),
    comments: post.commentCount,
    isNew: post.isNew || false,
    tags: post.tags || [],
  };
};

/**
 * 모든 게시물을 가져오는 함수
 * 실패 시 최대 MAX_RETRY_COUNT 회까지 재시도합니다.
 */
export const fetchPosts = async (): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error) {
      console.error(`게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`게시물 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  throw new Error(`게시물 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 특정 카테고리의 게시물을 가져오는 함수
 */
export const fetchPostsByCategory = async (category: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  // 카테고리가 유효하지 않은 경우 모든 게시물 반환
  if (!category || category === 'all') {
    return fetchPosts();
  }
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`${category} 카테고리 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`${category} 카테고리 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`${category} 카테고리 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`${category} 카테고리 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 특정 태그의 게시물을 가져오는 함수
 */
export const fetchPostsByTag = async (tag: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`${tag} 태그 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`${tag} 태그 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`${tag} 태그 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`${tag} 태그 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 게시물 상세 정보를 가져오는 함수
 */
export const fetchPostById = async (postId: string): Promise<UIPost | null> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const docRef = doc(db, POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const post = mapDocToPost(docSnap as QueryDocumentSnapshot<DocumentData>);
        return convertToUIPost(post);
      } else {
        console.log('게시물을 찾을 수 없습니다');
        return null;
      }
    } catch (error) {
      console.error(`게시물 상세 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`게시물 상세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`게시물 상세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 새 게시물을 생성하는 함수
 */
export const createPost = async (postData: Partial<Post>): Promise<string> => {
  try {
    const { author, title, content, category, tags = [], authorId } = postData;
    
    if (!title || !content || !category || !author || !authorId) {
      throw new Error('필수 필드가 누락되었습니다.');
    }
    
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      title,
      content,
      category,
      author,
      authorId,
      tags,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentCount: 0,
      viewCount: 0,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    throw new Error('게시물을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 수정하는 함수
 * @param postId 수정할 게시물 ID
 * @param postData 수정할 게시물 데이터
 * @param userId 현재 로그인한 사용자 ID
 * @returns 수정 완료 Promise
 */
export const updatePost = async (postId: string | number, postData: Partial<Post> | Partial<UIPost>, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 수정할 수 있습니다.');
      }
    }
    
    const updateData: Record<string, any> = { ...postData };
    
    // updatedAt은 항상 현재 시간으로 설정
    updateData.updatedAt = Timestamp.now();
    
    // UIPost 타입인 경우 변환
    if ('date' in updateData) {
      delete updateData.date;  // Firestore에 저장하지 않음
    }
    if ('comments' in updateData) {
      updateData.commentCount = updateData.comments;
      delete updateData.comments;  // 필드명 변환
    }
    
    // createdAt은 수정 불가
    delete updateData.createdAt;
    
    // id 필드는 수정 불가
    delete updateData.id;
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('게시물 수정 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 수정하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 삭제하는 함수
 * @param postId 삭제할 게시물 ID
 * @param userId 현재 로그인한 사용자 ID
 * @returns 삭제 완료 Promise
 */
export const deletePost = async (postId: string | number, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 삭제할 수 있습니다.');
      }
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 다른 카테고리로 이동하는 함수
 * @param postId 이동할 게시물 ID
 * @param categoryId 이동할 카테고리 ID
 * @param userId 현재 로그인한 사용자 ID
 * @returns 이동 완료 Promise
 */
export const movePost = async (postId: string | number, categoryId: string, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 이동할 수 있습니다.');
      }
      
      // 동일한 카테고리로 이동하려는 경우
      if (docSnap.data().category === categoryId) {
        throw new Error('이미 해당 카테고리에 속해 있는 게시물입니다.');
      }
    }
    
    // 카테고리 업데이트 및 수정 시간 갱신
    await updateDoc(docRef, {
      category: categoryId,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('게시물 이동 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 이동하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
}; 