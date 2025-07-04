import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { UIPost, Category, Menu, MenuItem, User } from '../src/types';
import Sidebar from './Sidebar';
import PostList from './PostList';
import PostDetail from './PostDetail';
import TrafficLights from './TrafficLights';
import NewPostModal from './NewPostModal';
import WindowMenuBar from './WindowMenuBar';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';
import { FolderIcon, MessagesSquareIcon, TagIcon } from './icons';
import { usePosts } from '../src/hooks/usePosts';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { deletePost, updatePost, createPost, movePost } from '../src/services/firebase/firestore';

const categoriesData: Category[] = [
  { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> },
  { id: 'tech', name: '기술', icon: <FolderIcon /> },
  { id: 'general', name: '자유게시판', icon: <TagIcon /> },
];

interface BulletinBoardProps {
    onClose: () => void;
    user: User;
    initialShowBookmarks?: boolean;
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ onClose, user, initialShowBookmarks = false }) => {
  const [categories] = useState<Category[]>(categoriesData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(initialShowBookmarks);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<UIPost | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  
  // 토스트 메시지 상태 추가
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      message,
      type,
      visible: true
    });
  }, []);

  // 토스트 메시지 닫기 함수
  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Selection API 관련 에러 처리를 위한 함수
  const clearSelection = useCallback(() => {
    try {
      // 현재 활성화된 요소에서 포커스 제거
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // 텍스트 선택 초기화 - 다양한 브라우저 지원
      const selection = window.getSelection();
      if (selection) {
        if (typeof selection.empty === 'function') {
          // Chrome, Safari
          selection.empty();
        } else if (typeof selection.removeAllRanges === 'function') {
          // Firefox
          selection.removeAllRanges();
        }
        // IE 지원 코드 제거 (더 이상 필요하지 않음)
      }
      
      // 현재 활성 요소가 있다면 블러 처리
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      
    } catch (error) {
      // 에러가 발생해도 앱 실행에 영향을 주지 않도록 함
      console.error("Selection API 에러 처리 중 오류:", error);
    }
  }, []);
  
  // 컴포넌트 마운트/언마운트 시 Selection API 관리 강화
  useEffect(() => {
    // 컴포넌트 마운트 시 Selection API 초기화 강화
    const disableSelection = () => {
      try {
        // document selection 비활성화
        document.onselectstart = () => false;
        
        // 표준 CSS 속성 사용
        document.body.style.userSelect = 'none';
        
        clearSelection();
      } catch (error) {
        console.error("Selection 비활성화 중 오류:", error);
      }
    };
    
    const enableSelection = () => {
      try {
        // document selection 활성화 복원
        document.onselectstart = null;
        
        // 표준 CSS 속성 사용
        document.body.style.userSelect = '';
      } catch (error) {
        console.error("Selection 활성화 중 오류:", error);
      }
    };
    
    // 마운트 시 실행
    disableSelection();
    
    // 언마운트 시 원상복구
    return enableSelection;
  }, [clearSelection]);

  // 북마크 관련 기능 가져오기
  const { 
    bookmarkedPosts, 
    loading: bookmarkLoading, 
    error: bookmarkError,
    refresh: refreshBookmarks
  } = useBookmarks(user?.uid);

  // Firebase에서 게시물 데이터 가져오기
  const { 
    posts: fetchedPosts, 
    loading: postsLoading, 
    error: postsError, 
    refresh: refreshPosts 
  } = usePosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    tag: selectedTag || undefined
  });

  // 초기 북마크 설정
  useEffect(() => {
    if (initialShowBookmarks) {
      // 선택 초기화
      clearSelection();
      
      // 안전한 상태 전환을 위해 단계적으로 처리
      setTimeout(() => {
        // 먼저 카테고리와 태그 초기화
        setSelectedCategory('all');
        setSelectedTag(null);
        
        // 약간의 지연 후 북마크 모드 활성화
        setTimeout(() => {
          setShowBookmarks(true);
          refreshBookmarks();
        }, 50);
      }, 10);
    }
  }, [initialShowBookmarks, refreshBookmarks, clearSelection]);

  // Selection API 에러 방지를 위한 전역 이벤트 리스너 설정
  useEffect(() => {
    // mousedown 이벤트 발생 시 Selection 초기화
    const handleMouseDown = () => {
      clearSelection();
    };

    // 전체 문서에 이벤트 리스너 등록
    document.addEventListener('mousedown', handleMouseDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [clearSelection]);

  // 표시할 게시물 결정
  const posts = useMemo(() => {
    let result;
    
    if (showBookmarks) {
      result = bookmarkedPosts;
      
      // 북마크 모드에서 카테고리 필터링
      if (selectedCategory !== 'all') {
        result = result.filter(post => post.category === selectedCategory);
      }
      
      // 북마크 모드에서 태그 필터링
      if (selectedTag) {
        result = result.filter(post => post.tags && post.tags.includes(selectedTag));
      }
    } else {
      result = fetchedPosts;
    }
    
    return result;
  }, [showBookmarks, bookmarkedPosts, fetchedPosts, selectedCategory, selectedTag]);

  // 로딩 및 에러 상태 통합
  const loading = showBookmarks ? bookmarkLoading : postsLoading;
  const error = showBookmarks ? bookmarkError : postsError;

  // 선택된 게시물 상태 관리
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);

  // 게시물 데이터가 로드되면 첫 번째 게시물을 선택
  useEffect(() => {
    if (posts.length > 0 && !selectedPost) {
      setSelectedPost(posts[0]);
    } else if (posts.length === 0) {
      setSelectedPost(null);
    } else if (selectedPost) {
      // 현재 선택된 게시물이 있으면 해당 게시물이 목록에 있는지 확인
      const currentPostStillExists = posts.some(p => p.id === selectedPost.id);
      if (!currentPostStillExists && posts.length > 0) {
        setSelectedPost(posts[0]);
      }
    }
  }, [posts, selectedPost]);

  // 윈도우 타이틀 업데이트
  useEffect(() => {
    // 북마크 모드인 경우 타이틀 변경
    if (showBookmarks) {
      document.title = "북마크 - Mac Board";
    } else {
      document.title = "게시판 - Mac Board";
    }
    
    return () => {
      document.title = "Mac Board";
    };
  }, [showBookmarks]);

  // Window management state
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const minSize = { width: 720, height: 500 };
  const [size, setSize] = useState({ width: 1178, height: 845 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const [startResize, setStartResize] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{ size: { width: number; height: number }; position: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const MENU_BAR_HEIGHT = 28; // Corresponds to h-7 in TailwindCSS
    const availableHeight = window.innerHeight - MENU_BAR_HEIGHT;
    
    const initialX = Math.max(0, (window.innerWidth - size.width) / 2);
    // Center vertically in the space below the menu bar
    const initialY = MENU_BAR_HEIGHT + Math.max(0, (availableHeight - size.height) / 2);
    
    setPosition({ x: initialX, y: initialY });
  }, []);

  // 북마크 필터링 토글 처리
  const handleToggleBookmarks = useCallback(() => {
    // 선택 초기화
    clearSelection();
    
    // 북마크 모드 전환 전에 현재 상태 저장
    const currentBookmarksState = showBookmarks;
    
    // 안전한 상태 전환을 위해 모든 상태 초기화
    setShowBookmarks(false);
    
    // 약간의 지연 후 상태 복원 및 전환
    setTimeout(() => {
      // 이전 상태의 반대로 북마크 모드 설정
      setShowBookmarks(!currentBookmarksState);
      
      if (!currentBookmarksState) {
        // 북마크 모드로 전환
        setSelectedCategory('all');
        setSelectedTag(null);
        refreshBookmarks();
      }
    }, 50);
  }, [showBookmarks, refreshBookmarks, clearSelection]);

  // 컴포넌트 마운트/언마운트 시 Selection API 관리
  useEffect(() => {
    // 컴포넌트 마운트 시 Selection 초기화
    clearSelection();
    
    // 컴포넌트 언마운트 시 Selection 초기화
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  // 게시물 데이터 새로고침 통합 함수
  const refreshPostData = useCallback(() => {
    if (showBookmarks) {
      refreshBookmarks();
    } else {
      refreshPosts();
    }
  }, [showBookmarks, refreshBookmarks, refreshPosts]);

  // 창 최대화 처리
  const handleToggleMaximize = useCallback(() => {
    const MENU_BAR_HEIGHT = 28; // Corresponds to h-7 in TailwindCSS
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
        setPreMaximizeState(null);
      }
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ size, position });
      setSize({ width: window.innerWidth, height: window.innerHeight - MENU_BAR_HEIGHT });
      setPosition({ x: 0, y: MENU_BAR_HEIGHT });
      setIsMaximized(true);
    }
  }, [isMaximized, preMaximizeState, size, position]);

  // 창 최소화 처리
  const handleMinimize = useCallback(() => {
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
        setPreMaximizeState(null);
      }
      setIsMaximized(false);
    }
  }, [isMaximized, preMaximizeState]);
  
  // 창 드래그 시작 처리
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isMaximized || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-menu-bar]')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: position.x, y: position.y, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, position]);

  // 창 크기 조절 시작 처리
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartResize({ width: size.width, height: size.height, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, size]);

  // 마우스 이동 및 마우스 업 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPosition.mouseX;
        const dy = e.clientY - startPosition.mouseY;
        setPosition({ x: startPosition.x + dx, y: startPosition.y + dy });
      }
      if (isResizing) {
        const newWidth = startResize.width + (e.clientX - startResize.mouseX);
        const newHeight = startResize.height + (e.clientY - startResize.mouseY);
        setSize({ width: Math.max(minSize.width, newWidth), height: Math.max(minSize.height, newHeight) });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, startPosition, startResize, minSize]);

  // 표시할 게시물 결정 (필터링 적용)
  const filteredPosts = useMemo(() => {
    // 검색어 필터링
    let result = posts;
    if (searchTerm.trim() !== '') {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return result;
  }, [posts, searchTerm]);

  // 게시물 선택 처리
  const handleSelectPost = useCallback((post: UIPost) => {
    setSelectedPost(post);
  }, []);

  // 북마크 모드에서 카테고리 선택 처리
  const handleSelectCategory = useCallback((categoryId: string) => {
    // 선택 초기화
    clearSelection();
    
    // 현재 상태 저장
    const wasInBookmarkMode = showBookmarks;
    
    // 모든 상태 초기화
    if (wasInBookmarkMode) {
      setShowBookmarks(false);
    }
    
    // 약간의 지연 후 새 상태 설정
    setTimeout(() => {
      setSelectedCategory(categoryId);
      setSelectedTag(null); // 태그 선택 초기화
      
      // 카테고리 변경 시 선택된 게시물 초기화 처리는 useEffect에서 자동으로 처리됨
    }, 50);
  }, [showBookmarks, clearSelection]);

  // 북마크 모드에서 태그 선택 처리
  const handleSelectTag = useCallback((tag: string | null) => {
    // 선택 초기화
    clearSelection();
    
    // 현재 상태 저장
    const wasInBookmarkMode = showBookmarks;
    
    // 모든 상태 초기화
    if (wasInBookmarkMode) {
      setShowBookmarks(false);
    }
    
    // 약간의 지연 후 새 상태 설정
    setTimeout(() => {
      setSelectedTag(tag); // 태그 선택 또는 해제
      setSelectedCategory('all'); // 카테고리 초기화
      
      // 태그 변경 시 선택된 게시물 초기화 처리는 useEffect에서 자동으로 처리됨
    }, 50);
  }, [showBookmarks, clearSelection]);

  const handleOpenNewPost = useCallback(() => {
    setPostToEdit(null);
    setIsModalOpen(true);
  },[]);
  
  // 게시물 작성자 확인 함수 추가
  const isPostOwner = useCallback((post: UIPost | null) => {
    if (!post || !user) return false;
    return post.authorId === user.uid;
  }, [user]);

  const handleOpenEditModal = useCallback(() => {
    if (selectedPost) {
      // 작성자 확인
      if (!isPostOwner(selectedPost)) {
        showToast('자신이 작성한 게시물만 수정할 수 있습니다.', 'error');
        return;
      }
      setPostToEdit(selectedPost);
      setIsModalOpen(true);
    }
  }, [selectedPost, isPostOwner, showToast]);
  
  const requestDeletePost = useCallback(() => {
    if (selectedPost) {
      // 작성자 확인
      if (!isPostOwner(selectedPost)) {
        showToast('자신이 작성한 게시물만 삭제할 수 있습니다.', 'error');
        return;
      }
      setIsDeleteModalOpen(true);
    }
  }, [selectedPost, isPostOwner, showToast]);

  const confirmDeletePost = useCallback(async () => {
    if (!selectedPost) return;
    
    try {
      // Firebase에서 게시물 삭제
      await deletePost(selectedPost.id, user.uid);
      
      // 삭제 성공 후 게시물 목록 새로고침
      refreshPostData();
      setIsDeleteModalOpen(false);
      showToast('게시물이 성공적으로 삭제되었습니다.', 'success');
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      showToast('게시물 삭제 중 오류가 발생했습니다.', 'error');
    }
  }, [selectedPost, user.uid, refreshPostData, showToast]);

  const handleMovePost = useCallback(async (categoryId: string) => {
    if (!selectedPost) return;
    
    try {
      // 이미 동일한 카테고리인 경우 처리
      if (selectedPost.category === categoryId) {
        showToast('이미 해당 카테고리에 속해 있는 게시물입니다.', 'info');
        return;
      }
      
      // 선택한 카테고리 이름 가져오기
      const categoryObj = categories.find(c => c.id === categoryId);
      const categoryName = categoryObj ? categoryObj.name : categoryId;
      
      // Firebase에서 게시물 이동 (id는 string 타입으로 확인됨)
      await movePost(selectedPost.id, categoryId, user.uid);
      
      // 이동 성공 메시지 (alert 대신 토스트 사용)
      showToast(`게시물이 "${categoryName}" 카테고리로 이동되었습니다.`, 'success');
      
      // 이동된 게시물의 UI 정보 업데이트 (새로고침하기 전에 UI 반영)
      setSelectedPost({
        ...selectedPost,
        category: categoryId,
      });
      
      // 게시물 목록 새로고침
      refreshPostData();
    } catch (error) {
      console.error('게시물 이동 오류:', error);
      showToast('게시물 이동 중 오류가 발생했습니다.', 'error');
    }
  }, [selectedPost, user.uid, refreshPostData, categories, showToast]);

  const handleSavePost = useCallback(async (postData: { title: string; category: string; content: string; tags: string[] }) => {
    try {
      // 로딩 상태 설정 (필요하면 상태 추가)
      
      if (postToEdit) {
        // 기존 게시물 수정
        await updatePost(postToEdit.id, {
          title: postData.title,
          category: postData.category,
          content: postData.content,
          tags: postData.tags,
          // updatedAt은 updatePost 함수 내부에서 자동 설정
        }, user.uid);
        showToast('게시물이 성공적으로 수정되었습니다.', 'success');
      } else {
        // 새 게시물 작성
        const newPostId = await createPost({
          title: postData.title,
          category: postData.category,
          content: postData.content,
          tags: postData.tags || [],
          author: {
            name: user.displayName || '익명 사용자',
          },
          authorId: user.uid,
          // createdAt과 updatedAt은 createPost 함수 내부에서 자동 설정
        });
        showToast('새 게시물이 성공적으로 생성되었습니다.', 'success');
      }
      
      // 모달 닫기
      setIsModalOpen(false);
      
      // 게시물 목록 새로고침
      refreshPostData();
    } catch (error) {
      console.error('게시물 저장 오류:', error);
      showToast('게시물 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
  }, [postToEdit, user, refreshPostData, showToast]);
  
  // 검색 필터링 처리
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  useEffect(() => {
    const isPostSelected = selectedPost !== null;
    // 권한 확인: 현재 사용자가 게시물 작성자인지 확인
    const canEditOrDelete = isPostSelected && isPostOwner(selectedPost);
    
    // 선택된 게시물이 속한 카테고리 이름 (UI에 표시용)
    let selectedCategoryName = '';
    if (selectedPost?.category) {
      const categoryObj = categories.find(c => c.id === selectedPost.category);
      selectedCategoryName = categoryObj ? categoryObj.name : selectedPost.category;
    }
    
    const moveSubMenu: MenuItem[] = categories
      .filter(c => c.id !== 'all' && c.id !== selectedPost?.category)
      .map(c => ({
        label: c.name,
        action: () => handleMovePost(c.id),
        isSeparator: false,
      }));

    setMenus([
      {
        name: '파일',
        items: [
          { label: '새 게시물...', action: handleOpenNewPost },
          { isSeparator: true },
          { label: '창 닫기', action: onClose }
        ],
      },
      {
        name: '편집',
        items: [
          { 
            label: '게시물 수정...', 
            action: handleOpenEditModal, 
            disabled: !isPostSelected || !canEditOrDelete 
          },
          { 
            label: '게시물 삭제', 
            action: requestDeletePost, 
            disabled: !isPostSelected || !canEditOrDelete 
          },
          { isSeparator: true },
          { 
            label: selectedPost?.category ? 
              `카테고리 이동 (현재: ${selectedCategoryName})` : 
              '카테고리 이동', 
            disabled: !isPostSelected || !canEditOrDelete || moveSubMenu.length === 0,
            items: moveSubMenu 
          },
        ]
      }
    ]);
  }, [selectedPost, categories, onClose, handleOpenEditModal, requestDeletePost, handleMovePost, handleOpenNewPost, isPostOwner]);
  
  return (
    <div
      ref={windowRef}
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: `${minSize.width}px`,
        minHeight: `${minSize.height}px`,
        transition: isDragging || isResizing ? 'none' : 'width 0.2s ease, height 0.2s ease, top 0.2s ease, left 0.2s ease'
      }}
      className={`bg-white/80 backdrop-blur-xl flex flex-col overflow-hidden ${isMaximized ? 'rounded-none shadow-none border-none' : 'rounded-xl shadow-2xl border border-slate-300/80'}`}
    >
      <header
        onMouseDown={handleDragStart}
        onDoubleClick={handleToggleMaximize}
        className={`flex-shrink-0 h-14 flex items-center px-4 border-b border-slate-200/80 ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <TrafficLights onClose={onClose} onMinimize={handleMinimize} onMaximize={handleToggleMaximize} />
        <div className="flex-grow text-center">
           <h1 className="font-semibold text-slate-700 select-none">{showBookmarks ? "북마크" : "게시판"}</h1>
        </div>
        <div className="w-16"></div>
      </header>
      <WindowMenuBar menus={menus} />
      <main className="flex flex-grow overflow-hidden" style={{ height: 'calc(100% - 56px - 32px)'}}>
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onNewPost={handleOpenNewPost}
          allTags={allTags}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
          showBookmarks={showBookmarks}
          onToggleBookmarks={handleToggleBookmarks}
        />
        
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-600">데이터 로딩 중...</p>
            </div>
          </div>
        ) : (
          <>
            <PostList
              posts={filteredPosts}
              selectedPostId={selectedPost?.id || null}
              onSelectPost={handleSelectPost}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <PostDetail 
              post={selectedPost} 
              onSelectTag={handleSelectTag} 
              onEditPost={handleOpenEditModal}
              onDeletePost={requestDeletePost}
            />
          </>
        )}
      </main>
      {isModalOpen && (
        <NewPostModal 
          categories={categories.filter(c => c.id !== 'all')} 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePost}
          postToEdit={postToEdit}
          allTags={allTags}
        />
      )}
      {isDeleteModalOpen && selectedPost && (
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeletePost}
            title="게시물 삭제"
            message={
                <>
                    <strong className="font-bold text-slate-900">"{selectedPost.title}"</strong> 게시물을 정말로 삭제하시겠습니까? 
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </>
            }
            confirmButtonText="삭제"
            cancelButtonText="취소"
        />
      )}
       <div
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 ${isMaximized ? 'hidden' : ''}`}
          aria-label="Resize window"
        >
          <svg className="w-full h-full text-slate-400 opacity-60" fill="none" viewBox="0 0 16 16" stroke="currentColor">
              <path d="M 12 4 L 4 12" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 12 7 L 7 12" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 12 10 L 10 12" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
      </div>
      
      {/* 토스트 메시지 추가 */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default BulletinBoard;