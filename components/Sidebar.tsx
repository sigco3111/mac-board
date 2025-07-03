

import React from 'react';
import type { Category } from '../src/types';
import { HashtagIcon, BookmarkIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onNewPost: () => void;
  allTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  showBookmarks?: boolean; // 북마크 필터링 활성화 상태
  onToggleBookmarks?: () => void; // 북마크 필터링 토글 함수
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  onNewPost, 
  allTags, 
  selectedTag, 
  onSelectTag,
  showBookmarks = false,
  onToggleBookmarks 
}) => {
  // 인증 정보 가져오기
  const { user } = useAuth();

  return (
    <div className="w-60 flex-shrink-0 bg-slate-100/80 p-3 flex flex-col h-full backdrop-blur-md border-r border-slate-200">
      <div className="text-xs font-semibold text-slate-500 px-3 pt-4 pb-2">메뉴</div>
      <nav>
        <ul className="space-y-1">
          {/* 북마크 메뉴 */}
          {user && (
            <li>
              <button
                onClick={onToggleBookmarks}
                className={`w-full flex items-center space-x-3 text-sm font-medium p-2 rounded-md transition-colors duration-150 ${
                  showBookmarks
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <BookmarkIcon className={`w-4 h-4 flex-shrink-0 ${showBookmarks ? 'text-white' : 'text-slate-500'}`} fill={showBookmarks ? 'white' : 'none'} />
                <span>북마크</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <div className="text-xs font-semibold text-slate-500 px-3 pt-4 pb-2">카테고리</div>
      <nav>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => onSelectCategory(category.id)}
                className={`w-full flex items-center space-x-3 text-sm font-medium p-2 rounded-md transition-colors duration-150 ${
                  selectedCategory === category.id && !selectedTag && !showBookmarks
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={selectedCategory === category.id && !selectedTag && !showBookmarks ? 'text-white' : 'text-slate-500'}>
                  {category.icon}
                </span>
                <span>{category.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="text-xs font-semibold text-slate-500 px-3 pt-6 pb-2">태그</div>
      <nav className="flex-grow overflow-y-auto">
         <ul className="space-y-1">
          {allTags.map((tag) => (
            <li key={tag}>
              <button
                onClick={() => onSelectTag(tag)}
                className={`w-full flex items-center space-x-3 text-sm p-2 rounded-md transition-colors duration-150 ${
                  selectedTag === tag && !showBookmarks
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HashtagIcon className={`w-4 h-4 flex-shrink-0 ${selectedTag === tag && !showBookmarks ? 'text-white/80' : 'text-slate-500'}`} />
                <span className="font-medium truncate">{tag}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4">
         <button onClick={onNewPost} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-150">
            새 게시물 작성
          </button>
      </div>
    </div>
  );
};

export default Sidebar;