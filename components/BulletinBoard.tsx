import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Post, UIPost, Category, Menu, MenuItem, User } from '../src/types';
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
import { deletePost, updatePost, createPost, movePost, fetchCategoriesFromFirestore } from '../src/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// 기본 카테고리 데이터 (Firestore 로드 전에 임시로 사용)
const defaultCategories: Category[] = [
  { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> }
];

interface BulletinBoardProps {
    onClose: () => void;
    user: User;
    initialShowBookmarks?: boolean;
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ onClose, user, initialShowBookmarks = false }) => {
  // 카테고리 상태를 동적 데이터로 변경
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(initialShowBookmarks);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<UIPost | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  
  // 모바일 상세 뷰 상태 추가
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  
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

  // Firestore에서 카테고리 데이터 로드
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const categoriesData = await fetchCategoriesFromFirestore();
        
        // Firestore에서 가져온 카테고리 데이터를 UI 컴포넌트에 맞게 변환
        const uiCategories: Category[] = [
          { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> },
          ...categoriesData.map(cat => ({
            id: cat.id,
            name: cat.name,
            // 카테고리에 설정된 아이콘 사용
            icon: cat.icon ? (
              <span className="text-lg">{cat.icon}</span>
            ) : (
              cat.id === 'tech' ? <FolderIcon /> : 
              cat.id === 'general' ? <TagIcon /> : <FolderIcon />
            )
          }))
        ];
        
        // 카테고리 중복 제거 (id 기준)
        const uniqueCategories = uiCategories.filter(
          (cat, index, self) => index === self.findIndex(c => c.id === cat.id)
        );
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("카테고리 데이터 로드 중 오류 발생:", error);
        // 에러 시 기본 카테고리라도 보여주기
        if (categories.length <= 1) {
          setCategories([
            { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> },
            { id: 'general', name: '자유게시판', icon: <TagIcon /> },
            { id: 'tech', name: '기술', icon: <FolderIcon /> }
          ]);
        }
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    loadCategories();
  }, []);

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
  
  // 게시물 선택 및 상세 표시 관련 상태 및 함수
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const handleSelectPost = useCallback((post: UIPost) => {
    console.log('게시물 선택됨:', post.id, post.title);
    setSelectedPost(post);
    // 모바일에서는 상세 페이지로 전환
    if (window.innerWidth < 768) {
      setIsMobileDetailView(true);
    }
  }, []);

  // 선택된 게시물 초기화
  const handleDeselectPost = useCallback(() => {
    setSelectedPost(null);
    setIsMobileDetailView(false);
  }, []);
  
  // 로딩 및 에러 상태 통합
  const loading = showBookmarks ? bookmarkLoading : postsLoading;
  const error = showBookmarks ? bookmarkError : postsError;

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

  // 검색 필터링 처리
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) {
      return posts;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerSearchTerm) || 
      post.content.toLowerCase().includes(lowerSearchTerm) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
  }, [posts, searchTerm]);

  // 게시물 데이터가 로드되면 첫 번째 게시물을 자동으로 선택
  useEffect(() => {
    if (!loading && filteredPosts.length > 0 && !selectedPost) {
      setSelectedPost(filteredPosts[0]);
    } else if (!loading && filteredPosts.length === 0) {
      setSelectedPost(null);
    } else if (selectedPost && !filteredPosts.some(p => p.id === selectedPost.id) && filteredPosts.length > 0) {
      // 선택된 게시물이 필터링된 목록에 없으면 첫 번째 게시물 선택
      setSelectedPost(filteredPosts[0]);
    }
  }, [loading, filteredPosts, selectedPost]);

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
          // 북마크 데이터 새로고침 (최신 상태 유지)
          refreshBookmarks();
        }, 50);
      }, 10);
    }
  }, [initialShowBookmarks, refreshBookmarks, clearSelection]);
  
  // 컴포넌트 재랜더링 시에도 북마크 설정이 유지되도록 추가
  useEffect(() => {
    // 컴포넌트 마운트 시 북마크 모드 상태 동기화
    setShowBookmarks(initialShowBookmarks);
    
    if (initialShowBookmarks) {
      // 북마크 데이터 로드
      refreshBookmarks();
    }
  }, [initialShowBookmarks, refreshBookmarks]);

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

  // 북마크된 게시물에서 사용된 카테고리 추출
  const bookmarkedCategories = useMemo(() => {
    if (!showBookmarks) return categories; // 카테고리 데이터가 로드되지 않았을 경우 기본 카테고리 사용
    
    // 북마크된 게시물에서 사용된 카테고리 ID 추출
    const categoryIds = new Set<string>();
    bookmarkedPosts.forEach(post => {
      if (post.category) {
        categoryIds.add(post.category);
      }
    });
    
    // '전체' 카테고리는 항상 포함
    const filteredCategories = [
      categories[0], // '모든 게시물' 카테고리
      ...categories.slice(1).filter(category => categoryIds.has(category.id))
    ];
    
    return filteredCategories;
  }, [showBookmarks, bookmarkedPosts, categories]);

  // 게시물 태그 목록 추출
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    const postsToUse = showBookmarks ? bookmarkedPosts : posts;
    
    postsToUse.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag) {
            tagsSet.add(tag);
          }
        });
      }
    });
    
    return Array.from(tagsSet).sort();
  }, [showBookmarks, bookmarkedPosts, posts]);
  
  // 현재 선택된 카테고리에서 사용 가능한 태그 목록 추출
  const availableTags = useMemo(() => {
    if (selectedCategory === 'all') {
      return allTags;
    }
    
    const tagsInCategory = new Set<string>();
    const postsInCategory = posts.filter(post => post.category === selectedCategory);
    
    postsInCategory.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag) {
            tagsInCategory.add(tag);
          }
        });
      }
    });
    
    return Array.from(tagsInCategory).sort();
  }, [posts, selectedCategory, allTags]);
  
  // 사이드바에 표시할 카테고리 (북마크 모드에 따라 다름)
  const sidebarCategories = useMemo(() => {
    return showBookmarks ? bookmarkedCategories : categories;
  }, [showBookmarks, bookmarkedCategories, categories]);

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

  // 창 위치 초기화
  useEffect(() => {
    const MENU_BAR_HEIGHT = 28; // Corresponds to h-7 in TailwindCSS
    const availableHeight = window.innerHeight - MENU_BAR_HEIGHT;
    
    const initialX = Math.max(0, (window.innerWidth - size.width) / 2);
    // Center vertically in the space below the menu bar
    const initialY = MENU_BAR_HEIGHT + Math.max(0, (availableHeight - size.height) / 2);
    
    setPosition({ x: initialX, y: initialY });
  }, []);

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
  
  // 카테고리 선택 처리
  const handleSelectCategory = useCallback((categoryId: string) => {
    console.log('카테고리 선택:', categoryId);
    
    // 선택 초기화
    clearSelection();
    
    // 현재 북마크 모드 유지하면서 카테고리 변경
    setTimeout(() => {
      setSelectedCategory(categoryId);
      setSelectedTag(null); // 태그 선택 초기화
      setSelectedPost(null); // 선택된 게시물 초기화
      
      // 북마크 모드일 때 북마크 데이터 새로고침
      if (showBookmarks) {
        refreshBookmarks();
      } else {
        // 일반 모드일 때 해당 카테고리 게시물 로드
        refreshPosts();
      }
    }, 20);
  }, [showBookmarks, clearSelection, refreshBookmarks, refreshPosts]);

  // 태그 선택 처리
  const handleSelectTag = useCallback((tag: string | null) => {
    console.log('태그 선택:', tag);
    
    // 선택 초기화
    clearSelection();
    
    // 북마크 모드 유지하면서 태그 변경
    setTimeout(() => {
      setSelectedTag(tag); // 태그 선택 또는 해제
      setSelectedPost(null); // 선택된 게시물 초기화
      
      // 태그만 필터링할 때는 전체 카테고리로 설정
      if (tag) {
        setSelectedCategory('all');
      }
      
      // 북마크 모드일 때 북마크 데이터 새로고침
      if (showBookmarks) {
        refreshBookmarks();
      } else {
        // 일반 모드일 때 해당 태그 게시물 로드
        refreshPosts();
      }
    }, 20);
  }, [showBookmarks, clearSelection, refreshBookmarks, refreshPosts]);

  // 게시물 작성 및 수정 관련 함수
  const handleOpenNewPost = useCallback(() => {
    setPostToEdit(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((post: UIPost) => {
    setPostToEdit(post);
    setIsModalOpen(true);
  }, []);

  const handleSavePost = useCallback(async (postData: { title: string; category: string; content: string; tags: string[] }) => {
    try {
      if (postToEdit) {
        await updatePost(postToEdit.id, {
          ...postToEdit,
          ...postData,
          updatedAt: Timestamp.now(), // Firestore Timestamp로 수정
        }, user?.uid);
        showToast('게시물이 수정되었습니다.', 'success');
      } else {
        if (!user) {
          showToast('로그인이 필요합니다.', 'error');
          return;
        }
        const newPost: Partial<Post> = {
          ...postData,
          author: {
            name: user.displayName || 'Anonymous',
          },
          authorId: user.uid,
          createdAt: Timestamp.now(), // Firestore Timestamp로 수정
          updatedAt: Timestamp.now(), // Firestore Timestamp로 수정
          commentCount: 0,
          viewCount: 0,
        };
        await createPost(newPost);
        showToast('게시물이 작성되었습니다.', 'success');
      }
      setIsModalOpen(false);
      refreshPosts();
      refreshBookmarks();
    } catch (error) {
      showToast('게시물 저장 중 오류가 발생했습니다.', 'error');
      console.error("게시물 저장 중 오류:", error);
    }
  }, [postToEdit, refreshPosts, refreshBookmarks, showToast, user]);

  // 게시물 삭제 관련 함수
  const requestDeletePost = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeletePost = useCallback(async () => {
    if (!selectedPost) return;
    try {
      await deletePost(selectedPost.id);
      showToast('게시물이 삭제되었습니다.', 'success');
      setIsDeleteModalOpen(false);
      refreshPosts();
      refreshBookmarks();
    } catch (error) {
      showToast('게시물 삭제 중 오류가 발생했습니다.', 'error');
      console.error("게시물 삭제 중 오류:", error);
    }
  }, [selectedPost, refreshPosts, refreshBookmarks, showToast]);

  // 게시물 이동 관련 함수
  const handleMovePost = useCallback(async (newCategoryId: string) => {
    if (!selectedPost) return;
    try {
      await movePost(selectedPost.id, newCategoryId);
      showToast('게시물이 이동되었습니다.', 'success');
      setIsDeleteModalOpen(false); // 이동 후 삭제 모달 닫기
      refreshPosts();
      refreshBookmarks();
    } catch (error) {
      showToast('게시물 이동 중 오류가 발생했습니다.', 'error');
      console.error("게시물 이동 중 오류:", error);
    }
  }, [selectedPost, refreshPosts, refreshBookmarks, showToast]);

  // 게시물 데이터 새로고침 함수
  const refreshPostData = useCallback(() => {
    refreshPosts();
    refreshBookmarks();
  }, [refreshPosts, refreshBookmarks]);

  // 게시물 소유자 확인 함수
  const isPostOwner = useCallback((post: UIPost | null) => {
    return post?.userId === user?.uid;
  }, [user?.uid]);

  // 메뉴 생성 및 업데이트
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
           <h1 className="font-semibold text-slate-700 select-none">
              {showBookmarks ? "북마크" : "게시판"}
           </h1>
        </div>
        <div className="w-16"></div>
      </header>
      <WindowMenuBar menus={menus} />
      <main className="flex flex-grow overflow-hidden" style={{ height: 'calc(100% - 56px - 32px)'}}>
        <Sidebar 
          categories={sidebarCategories}
          selectedCategory={selectedCategory} 
          onSelectCategory={handleSelectCategory}
          onNewPost={handleOpenNewPost}
          allTags={availableTags} 
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
          showBookmarks={showBookmarks} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PostList 
            posts={filteredPosts} 
            selectedPost={selectedPost} 
            onSelectPost={handleSelectPost} 
            loading={loading}
            error={error?.message}
          />
          <div className="flex-1 overflow-auto bg-white">
            <PostDetail 
              post={selectedPost} 
              onEdit={handleOpenEditModal} 
              onDelete={requestDeletePost}
              onMove={handleMovePost}
              categories={categories.filter(cat => cat.id !== 'all')} // 'all' 카테고리는 제외
              isPostOwner={isPostOwner(selectedPost)}
              onRefresh={refreshPostData}
              userId={user?.uid}
            />
          </div>
        </div>
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