

import React, { useCallback, useEffect } from 'react';
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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories = [], // 기본값으로 빈 배열 설정 
  selectedCategory, 
  onSelectCategory, 
  onNewPost, 
  allTags = [], // 기본값으로 빈 배열 설정
  selectedTag, 
  onSelectTag,
  showBookmarks = false
}) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  
  // 텍스트 선택 허용을 위해 clearSelection 함수 제거
  // (이전에는 텍스트 선택을 막기 위해 사용했으나, 이제는 텍스트 선택을 허용함)
  
  // 카테고리 선택 핸들러 (텍스트 선택 허용)
  const handleSelectCategory = useCallback((e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    onSelectCategory(categoryId);
  }, [onSelectCategory]);
  
  // 태그 선택 핸들러 (텍스트 선택 허용)
  const handleSelectTag = useCallback((e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    onSelectTag(tag);
  }, [onSelectTag]);

  // 새 게시물 작성 핸들러
  const handleNewPost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onNewPost();
  }, [onNewPost]);

  // categories와 allTags의 안전한 처리를 위한 확인
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAllTags = Array.isArray(allTags) ? allTags : [];

  return (
    <div className="w-60 flex-shrink-0 bg-slate-100/80 p-3 flex flex-col h-full backdrop-blur-md border-r border-slate-200">
      {/* 북마크 토글 버튼 제거 */}

      <div className="text-xs font-semibold text-slate-500 px-3 pt-4 pb-2">카테고리</div>
      <nav>
        <ul>
          {safeCategories.map((category) => (
            <li key={category.id}>
              <button
                onClick={(e) => handleSelectCategory(e, category.id)}
                className={`w-full flex items-center space-x-3 text-sm font-medium p-2 rounded-md transition-colors duration-150 ${
                  selectedCategory === category.id && !selectedTag
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={selectedCategory === category.id && !selectedTag ? 'text-white' : 'text-slate-500'}>
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
          {safeAllTags.map((tag) => (
            <li key={tag}>
              <button
                onClick={(e) => handleSelectTag(e, tag)}
                className={`w-full flex items-center space-x-3 text-sm p-2 rounded-md transition-colors duration-150 ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HashtagIcon className={`w-4 h-4 flex-shrink-0 ${selectedTag === tag ? 'text-white/80' : 'text-slate-500'}`} />
                <span className="font-medium truncate">{tag}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4">
         <button onClick={handleNewPost} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-150">
            새 게시물 작성
          </button>
      </div>
    </div>
  );
};

export default Sidebar;