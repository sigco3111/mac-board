import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { UIPost, Category, Menu, MenuItem, User } from '../src/types';
import Sidebar from './Sidebar';
import PostList from './PostList';
import PostDetail from './PostDetail';
import TrafficLights from './TrafficLights';
import NewPostModal from './NewPostModal';
import WindowMenuBar from './WindowMenuBar';
import ConfirmationModal from './ConfirmationModal';
import { FolderIcon, MessagesSquareIcon, TagIcon } from './icons';
import { usePosts } from '../src/hooks/usePosts';
import { deletePost } from '../src/services/firebase/firestore';

const categoriesData: Category[] = [
  { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> },
  { id: 'tech', name: '기술', icon: <FolderIcon /> },
  { id: 'general', name: '자유게시판', icon: <TagIcon /> },
];

interface BulletinBoardProps {
    onClose: () => void;
    user: User;
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ onClose, user }) => {
  const [categories] = useState<Category[]>(categoriesData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<UIPost | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);

  // Firebase에서 게시물 데이터 가져오기
  const { 
    posts, 
    loading, 
    error, 
    refresh: refreshPosts 
  } = usePosts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    tag: selectedTag || undefined
  });

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

  // Window management state
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const minSize = { width: 720, height: 500 };
  const [size, setSize] = useState({ width: 1178, height: 805 });
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
  
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isMaximized || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-menu-bar]')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: position.x, y: position.y, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, position]);

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartResize({ width: size.width, height: size.height, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, size]);

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

  const handleSelectPost = useCallback((post: UIPost) => {
    setSelectedPost(post);
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTag(null); // Clear tag selection when category is selected
    
    // 카테고리 변경 시 선택된 게시물 초기화
    setSelectedPost(null);
  }, []);

  const handleSelectTag = useCallback((tag: string | null) => {
    setSelectedTag(tag); // 태그 선택 또는 해제
    setSelectedCategory('all'); // 카테고리 선택 초기화
    
    // 태그 변경 시 선택된 게시물 초기화
    setSelectedPost(null);
  }, []);

  const handleOpenNewPost = useCallback(() => {
    setPostToEdit(null);
    setIsModalOpen(true);
  },[]);
  
  const handleOpenEditModal = useCallback(() => {
    if (selectedPost) {
      setPostToEdit(selectedPost);
      setIsModalOpen(true);
    }
  }, [selectedPost]);
  
  const requestDeletePost = useCallback(() => {
    if (selectedPost) {
      setIsDeleteModalOpen(true);
    }
  }, [selectedPost]);

  const confirmDeletePost = useCallback(async () => {
    if (!selectedPost) return;
    
    try {
      // Firebase에서 게시물 삭제
      await deletePost(selectedPost.id);
      
      // 삭제 성공 후 게시물 목록 새로고침
      refreshPosts();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert('게시물 삭제 중 오류가 발생했습니다.');
    }
  }, [selectedPost, refreshPosts]);

  const handleMovePost = useCallback((categoryId: string) => {
    // 이 기능은 추후 구현 예정
    console.log('게시물 이동 기능은 아직 구현되지 않았습니다:', categoryId);
  }, []);

  const handleSavePost = useCallback((postData: { title: string; category: string; content: string; tags: string[] }) => {
    // 이 기능은 추후 구현 예정
    console.log('게시물 저장 기능은 아직 구현되지 않았습니다:', postData);
    setIsModalOpen(false);
    
    // 게시물 목록 새로고침
    refreshPosts();
  }, [refreshPosts]);
  
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  useEffect(() => {
    const isPostSelected = selectedPost !== null;
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
          { label: '수정...', action: handleOpenEditModal, disabled: !isPostSelected },
          { label: '삭제', action: requestDeletePost, disabled: !isPostSelected },
          { isSeparator: true },
          { 
            label: '게시물 이동', 
            disabled: !isPostSelected || moveSubMenu.length === 0,
            items: moveSubMenu 
          },
        ]
      }
    ]);
  }, [selectedPost, categories, onClose, handleOpenEditModal, requestDeletePost, handleMovePost, handleOpenNewPost]);
  
  // 검색 필터링 처리
  const filteredPosts = useMemo(() => {
    if (searchTerm.trim() === '') {
      return posts;
    }
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [posts, searchTerm]);

  // 로딩 및 에러 상태 처리
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/80 backdrop-blur-xl">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-medium text-red-600 mb-4">데이터 로드 오류</h2>
          <p className="text-slate-700 mb-4">{error.message}</p>
          <button 
            onClick={refreshPosts}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

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
           <h1 className="font-semibold text-slate-700 select-none">게시판</h1>
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
            <PostDetail post={selectedPost} onSelectTag={handleSelectTag} />
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
    </div>
  );
};

export default BulletinBoard;