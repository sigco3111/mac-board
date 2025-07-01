import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Post, Category, Menu, MenuItem, User } from '../types';
import Sidebar from './Sidebar';
import PostList from './PostList';
import PostDetail from './PostDetail';
import TrafficLights from './TrafficLights';
import NewPostModal from './NewPostModal';
import WindowMenuBar from './WindowMenuBar';
import ConfirmationModal from './ConfirmationModal';
import { FolderIcon, MessagesSquareIcon, TagIcon } from './icons';

const initialPosts: Post[] = [
  {
    id: 1,
    author: { name: '김민준', avatarUrl: 'https://picsum.photos/id/1005/48/48' },
    category: 'tech',
    title: '리액트 19 새로운 기능',
    content: '<p>리액트 19가 드디어 출시되었습니다! 이번 업데이트에는 Automatic Batching, 새로운 Concurrent features, 그리고 Server Components 개선 사항이 포함되어 있습니다.</p><p>특히 <strong>useTransition</strong> 훅은 UI 끊김 없이 상태를 업데이트하는 데 큰 도움이 될 것입니다.</p>',
    date: '3시간 전',
    comments: 5,
    isNew: true,
    tags: ['리액트', '프론트엔드', '자바스크립트'],
  },
  {
    id: 2,
    author: { name: '이수진', avatarUrl: 'https://picsum.photos/id/1011/48/48' },
    category: 'tech',
    title: 'Tailwind CSS vs. Styled Components',
    content: '<p>스타일링 방법에 대한 오랜 논쟁이죠. Tailwind CSS는 유틸리티-우선 접근 방식으로 빠르게 프로토타이핑할 수 있는 장점이 있고, Styled Components는 컴포넌트 레벨에서 스타일을 캡슐화하는 데 강력합니다. 여러분의 선택은 무엇인가요?</p>',
    date: '1일 전',
    comments: 12,
    isNew: false,
    tags: ['CSS', '프론트엔드', '스타일링'],
  },
   {
    id: 3,
    author: { name: '박서연', avatarUrl: 'https://picsum.photos/id/1027/48/48' },
    category: 'general',
    title: '주말에 가볼만한 곳 추천',
    content: '<h2>서울 근교 나들이</h2><p>이번 주말, 날씨가 좋다면 양평 두물머리에 가보는 건 어떠세요? 강과 산이 어우러진 풍경이 정말 아름답습니다. 맛있는 핫도그도 놓치지 마세요!</p><ul><li>두물머리</li><li>세미원</li><li>양평 레일바이크</li></ul>',
    date: '2일 전',
    comments: 8,
    isNew: false,
    tags: ['여행', '주말', '나들이'],
  },
  {
    id: 4,
    author: { name: '최현우', avatarUrl: 'https://picsum.photos/id/10/48/48' },
    category: 'tech',
    title: 'Gemini API 사용 후기',
    content: '<p>Google의 새로운 Gemini API를 사용해봤습니다. 텍스트 생성 능력뿐만 아니라 이미지 인식 능력도 뛰어나서 다양한 애플리케이션에 활용할 수 있을 것 같습니다. 특히 JSON 모드로 구조화된 데이터를 받아오는 기능이 인상적이었습니다.</p>',
    date: '5일 전',
    comments: 21,
    isNew: false,
    tags: ['AI', 'API', 'Gemini'],
  },
];

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
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [categories] = useState<Category[]>(categoriesData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(posts[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);

  // Window management state
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const minSize = { width: 720, height: 500 };
  const [size, setSize] = useState({ width: 1024, height: 700 });
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

  const handleSelectPost = useCallback((post: Post) => {
    setSelectedPost(post);
    setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? {...p, isNew: false} : p));
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTag(null); // Clear tag selection when category is selected
  }, []);

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTag(prev => (prev === tag ? null : tag)); // Toggle selection
    setSelectedCategory('all'); // Clear category selection
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

  const confirmDeletePost = useCallback(() => {
    if (!selectedPost) return;
    setPosts(prev => {
      const postIndex = prev.findIndex(p => p.id === selectedPost.id);
      const newPosts = prev.filter(p => p.id !== selectedPost.id);
      if (newPosts.length > 0) {
        const nextPostIndex = Math.min(postIndex, newPosts.length - 1);
        setSelectedPost(newPosts[nextPostIndex]);
      } else {
        setSelectedPost(null);
      }
      return newPosts;
    });
    setIsDeleteModalOpen(false);
  }, [selectedPost]);

  const handleMovePost = useCallback((categoryId: string) => {
    if (!selectedPost) return;
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, category: categoryId } : p));
    setSelectedPost(prev => prev ? { ...prev, category: categoryId } : null);
  }, [selectedPost]);

  const handleSavePost = useCallback((postData: { title: string; category: string; content: string; tags: string[] }) => {
    if (postToEdit) { // Editing existing post
      const updatedPost = { ...postToEdit, ...postData, date: '방금 수정됨' };
      const updatedPosts = posts.map(p => p.id === postToEdit.id ? updatedPost : p);
      setPosts(updatedPosts);
      setSelectedPost(updatedPost);
    } else { // Adding new post
      const newPost: Post = {
        id: Date.now(),
        author: { name: user.name, avatarUrl: user.avatarUrl },
        ...postData,
        date: '방금 전',
        comments: 0,
        isNew: true,
      };
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      handleSelectCategory(newPost.category);
      handleSelectPost(newPost);
    }
  }, [postToEdit, posts, handleSelectPost, handleSelectCategory, user]);
  
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
  
  const filteredPosts = useMemo(() => {
    let intermediatePosts: Post[];

    if (selectedTag) {
      intermediatePosts = posts.filter(post => post.tags?.includes(selectedTag));
    } else if (selectedCategory === 'all') {
      intermediatePosts = posts;
    } else {
      intermediatePosts = posts.filter(post => post.category === selectedCategory);
    }
    
    return intermediatePosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, selectedCategory, selectedTag, searchTerm]);

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
        <PostList
          posts={filteredPosts}
          selectedPostId={selectedPost?.id || null}
          onSelectPost={handleSelectPost}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <PostDetail post={selectedPost} onSelectTag={handleSelectTag} />
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