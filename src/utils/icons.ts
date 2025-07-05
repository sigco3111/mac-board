// src/utils/icons.ts

/**
 * 아이콘 목록
 * id: 아이콘 고유 식별자 (영문)
 * label: 아이콘 이름 (한글)
 * emoji: 아이콘 이모지
 */
export const ICONS = [
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

/**
 * 아이콘 ID로부터 이모지를 가져오는 유틸리티 함수
 * @param iconId 아이콘 ID
 * @returns 이모지 문자열, 없으면 빈 문자열 반환
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