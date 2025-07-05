/**
 * 데스크톱 화면을 표현하는 컴포넌트
 * macOS 스타일의 데스크톱 환경을 제공합니다.
 */
import React, { useState, useEffect } from 'react';
import MenuBar from './MenuBar';
import { FolderIcon, SettingsIcon } from './icons';
import HelpModal from './HelpModal';
import BulletinBoard from './BulletinBoard';
import { User } from '../src/types';
import SettingsModal from './SettingsModal';

// 로그아웃 상태를 저장하기 위한 로컬 스토리지 키
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';
// 배경화면 저장을 위한 로컬 스토리지 키
const WALLPAPER_KEY = 'mac_board_wallpaper';
const WALLPAPER_TYPE_KEY = 'mac_board_wallpaper_type';
// 기본 배경화면 경로
const DEFAULT_WALLPAPER = '/assets/wallpapers/default.jpg';
// 대체 배경색
const FALLBACK_BG_COLOR = '#1E3A8A'; // 짙은 파란색

type BoardState = 'closed' | 'board' | 'bookmarks';

/**
 * Desktop 컴포넌트 속성
 */
interface DesktopProps {
  /** 현재 로그인된 사용자 정보 */
  user: User;
  /** 게시판 열기 핸들러 */
  onOpenBoard: () => void;
  /** 로그아웃 핸들러 */
  onLogout: () => Promise<void>;
}

/**
 * Desktop 컴포넌트
 */
const Desktop: React.FC<DesktopProps> = ({ user, onOpenBoard, onLogout }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [boardState, setBoardState] = useState<BoardState>('closed');
  const [wallpaper, setWallpaper] = useState<string>(() => {
    const type = localStorage.getItem(WALLPAPER_TYPE_KEY);
    if (type === 'default' || !type) {
      return DEFAULT_WALLPAPER;
    } else {
      return localStorage.getItem(WALLPAPER_KEY) || DEFAULT_WALLPAPER;
    }
  });
  const [defaultImageError, setDefaultImageError] = useState<boolean>(false);

  useEffect(() => {
    if (wallpaper === DEFAULT_WALLPAPER) {
      const img = new Image();
      img.onload = () => setDefaultImageError(false);
      img.onerror = () => setDefaultImageError(true);
      img.src = DEFAULT_WALLPAPER;
    }
  }, [wallpaper]);

  const desktopItems = [
    { id: 'bulletin-board', name: '게시판', Icon: FolderIcon, onOpen: () => setBoardState('board'), color: 'text-sky-400' },
    { id: 'bookmark', name: '북마크', Icon: FolderIcon, onOpen: () => setBoardState('bookmarks'), color: 'text-sky-400' },
    { id: 'settings', name: '설정', Icon: SettingsIcon, onOpen: () => setSettingsModalOpen(true), color: 'text-gray-500' },
  ];

  const handleCloseBoard = () => {
    setBoardState('closed');
  };

  const handleWallpaperChange = (wallpaperUrl: string) => {
    if (wallpaperUrl) {
      setWallpaper(wallpaperUrl);
      setDefaultImageError(false);
    } else {
      setWallpaper(DEFAULT_WALLPAPER);
      const img = new Image();
      img.onload = () => setDefaultImageError(false);
      img.onerror = () => setDefaultImageError(true);
      img.src = DEFAULT_WALLPAPER;
    }
  };

  const handleLogout = async () => {
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    try {
      await onLogout();
    } catch (error) {
      console.error('Desktop: 로그아웃 오류:', error);
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    }
  };

  useEffect(() => {
    const checkLogoutFlag = () => {
      if (localStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
        onLogout().catch(err => console.error('자동 로그아웃 오류:', err));
      }
    };
    const interval = setInterval(checkLogoutFlag, 1000);
    return () => clearInterval(interval);
  }, [onLogout]);

  const bgStyle = defaultImageError || (wallpaper === DEFAULT_WALLPAPER && defaultImageError) ?
    { backgroundColor: FALLBACK_BG_COLOR } :
    {
      backgroundImage: `url(${wallpaper})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };

  return (
    <div
      className="w-screen h-screen"
      onClick={() => setSelectedId(null)}
      style={bgStyle}
    >
      <MenuBar
        onOpenHelp={() => setHelpModalOpen(true)}
        onLogout={handleLogout}
        user={user}
      />
      <div className="w-full h-full pt-16 p-4 flex flex-col flex-wrap content-start">
        {desktopItems.map(item => (
          <button
            key={item.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(item.id);
              item.onOpen();
            }}
            className="flex flex-col items-center w-28 h-28 space-y-1 text-white font-medium focus:outline-none rounded-lg p-2 transition-colors"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
          >
            <item.Icon className={`w-20 h-20 ${item.color} drop-shadow-lg`} />
            <span className={`text-base font-semibold px-2 py-0.5 rounded-md ${selectedId === item.id ? 'bg-blue-600 text-white' : 'bg-transparent'}`}>
              {item.name}
            </span>
          </button>
        ))}
      </div>
      {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          onWallpaperChange={handleWallpaperChange}
        />
      )}
      {boardState !== 'closed' && (
        <BulletinBoard
          onClose={handleCloseBoard}
          user={user}
          initialShowBookmarks={boardState === 'bookmarks'}
        />
      )}
    </div>
  );
};

export default Desktop;
