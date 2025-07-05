import React, { useState } from 'react';

// 아이콘 목록 정의
const ICONS = [
  { id: 'folder', label: '폴더', emoji: '📁' },
  { id: 'document', label: '문서', emoji: '📄' },
  { id: 'star', label: '별표', emoji: '⭐' },
  { id: 'heart', label: '하트', emoji: '❤️' },
  { id: 'bell', label: '알림', emoji: '🔔' },
  { id: 'check', label: '체크', emoji: '✅' },
  { id: 'warning', label: '경고', emoji: '⚠️' },
  { id: 'info', label: '정보', emoji: 'ℹ️' },
  { id: 'question', label: '질문', emoji: '❓' },
  { id: 'calendar', label: '달력', emoji: '📅' },
  { id: 'mail', label: '메일', emoji: '📧' },
  { id: 'chat', label: '채팅', emoji: '💬' },
  { id: 'settings', label: '설정', emoji: '⚙️' },
  { id: 'search', label: '검색', emoji: '🔍' },
  { id: 'user', label: '사용자', emoji: '👤' },
  { id: 'users', label: '사용자들', emoji: '👥' },
  { id: 'code', label: '코드', emoji: '💻' },
  { id: 'chart', label: '차트', emoji: '📊' },
  { id: 'time', label: '시간', emoji: '⏱️' },
  { id: 'book', label: '책', emoji: '📚' },
  { id: 'bookmark', label: '북마크', emoji: '🔖' },
  { id: 'tag', label: '태그', emoji: '🏷️' },
  { id: 'link', label: '링크', emoji: '🔗' },
  { id: 'pin', label: '핀', emoji: '📌' },
];

interface IconSelectorProps {
  selectedIcon?: string;
  onSelectIcon: (icon: string) => void;
}

/**
 * 카테고리 아이콘 선택 컴포넌트
 * 아이콘 목록을 표시하고 선택할 수 있는 UI를 제공합니다.
 */
const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectIcon }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // 선택된 아이콘 정보 찾기
  const selectedIconInfo = ICONS.find(icon => icon.id === selectedIcon) || ICONS[0];
  
  // 아이콘 선택 핸들러
  const handleSelectIcon = (iconId: string) => {
    onSelectIcon(iconId);
    setIsOpen(false);
  };
  
  // 아이콘 목록 토글
  const toggleIconList = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleIconList}
        className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="아이콘 선택"
        title="아이콘 선택"
      >
        {selectedIcon ? (
          <span className="text-xl">{selectedIconInfo.emoji}</span>
        ) : (
          <span className="text-gray-400">+</span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">아이콘 선택</h3>
          </div>
          <div className="p-2 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-6 gap-1">
              {ICONS.map(icon => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => handleSelectIcon(icon.id)}
                  className={`flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 ${
                    selectedIcon === icon.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                  }`}
                  title={icon.label}
                >
                  <span className="text-xl">{icon.emoji}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleSelectIcon('')}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              아이콘 제거
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconSelector;

/**
 * 아이콘 ID로부터 이모지를 가져오는 유틸리티 함수
 */
export const getIconEmoji = (iconId?: string): string => {
  if (!iconId) return '';
  const icon = ICONS.find(icon => icon.id === iconId);
  return icon ? icon.emoji : '';
};

/**
 * 아이콘 목록을 내보냅니다.
 */
export const ICON_LIST = ICONS; 