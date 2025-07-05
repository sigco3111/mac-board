import React, { useState, useEffect } from 'react';
import type { Category, Post } from '../src/types';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface NewPostModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (newPost: { title: string; category: string; content: string; tags: string[] }) => void;
  postToEdit?: Post | null;
  allTags: string[];
  selectedCategory: string | null;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ categories, onClose, onSave, postToEdit, allTags, selectedCategory }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allVisibleTags, setAllVisibleTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const isEditing = postToEdit != null;

  useEffect(() => {
    if (isEditing && postToEdit) {
      setTitle(postToEdit.title);
      setCategory(postToEdit.category);
      setContent(postToEdit.content.replace(/<[^>]+>/g, '')); // Basic HTML tag stripping
      setSelectedTags(postToEdit.tags || []);
    } else {
      // Reset form for new post
      setTitle('');
      setCategory(selectedCategory || categories[0]?.id || '');
      setContent('');
      setSelectedTags([]);
    }
  }, [postToEdit, isEditing, categories, selectedCategory]);

  // 시스템 다크 모드 감지
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setColorMode(isDarkMode ? 'dark' : 'light');

    // 시스템 다크 모드 변경 감지 이벤트 리스너
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    // Combine passed `allTags` with the currently `selectedTags` to form the list of all visible tags
    setAllVisibleTags([...new Set([...allTags, ...selectedTags])].sort());
  }, [allTags, selectedTags]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    const newTag = newTagInput.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]); // This will trigger the effect above
    }
    setNewTagInput('');
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewTag();
    }
  };
  
  const handleRemoveSelectedTag = (tagToRemove: string) => {
      setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) return;
    onSave({ title, category, content, tags: selectedTags });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">{isEditing ? '게시물 수정' : '새 게시물 작성'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">제목</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="게시물 제목"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* TAGS SECTION */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">태그</label>
              
              <div className="flex flex-wrap items-center gap-2 p-2 mb-2 bg-slate-50 border border-slate-200 rounded-md min-h-[44px]">
                {selectedTags.length === 0 ? (
                    <span className="text-sm text-slate-400 px-1">아래에서 태그를 선택하거나 새 태그를 추가하세요.</span>
                ) : (
                    selectedTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-blue-500 text-white text-sm font-medium pl-2.5 pr-1.5 py-1 rounded-full">
                        {tag}
                        <button type="button" onClick={() => handleRemoveSelectedTag(tag)} className="text-white/70 hover:text-white rounded-full hover:bg-black/20 p-0.5 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))
                )}
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  id="tags-input"
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleNewTagKeyDown}
                  className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="새 태그 추가 후 Enter 또는 추가 버튼"
                />
                 <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-4 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  추가
                </button>
              </div>

              {allVisibleTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-md max-h-32 overflow-y-auto">
                    {allVisibleTags.map(tag => (
                    <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`text-sm font-medium px-2.5 py-1 rounded-full transition-all duration-150 ${
                        selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white shadow'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        {selectedTags.includes(tag) ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">내용</label>
              <div data-color-mode={colorMode} className="w-full">
                <MDEditor
                  id="content"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  height={300}
                  preview="edit"
                  className="w-full"
                />
                <div className="mt-1 text-xs text-slate-500">
                  마크다운 문법을 사용하여 글을 작성할 수 있습니다.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? '저장' : '게시'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;