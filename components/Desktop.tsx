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
  const [isBoardOpen, setIsBoardOpen] = useState<boolean>(false);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [wallpaper, setWallpaper] = useState<string>(() => {
    // 로컬 스토리지에서 저장된 배경화면 타입 확인
    const type = localStorage.getItem(WALLPAPER_TYPE_KEY);
    
    if (type === 'default' || !type) {
      return DEFAULT_WALLPAPER;
    } else {
      // 사용자 지정 배경화면 (Base64 인코딩된 이미지)
      return localStorage.getItem(WALLPAPER_KEY) || DEFAULT_WALLPAPER;
    }
  });
  const [defaultImageError, setDefaultImageError] = useState<boolean>(false);

  // 기본 이미지 로딩 오류 감지
  useEffect(() => {
    if (wallpaper === DEFAULT_WALLPAPER) {
      const img = new Image();
      img.onload = () => setDefaultImageError(false);
      img.onerror = () => setDefaultImageError(true);
      img.src = DEFAULT_WALLPAPER;
    }
  }, [wallpaper]);

  // 데스크톱 아이템 정의
  const desktopItems = [
    { id: 'bulletin-board', name: '게시판', Icon: FolderIcon, onOpen: handleOpenBoard, color: 'text-sky-400' },
    { id: 'bookmark', name: '북마크', Icon: FolderIcon, onOpen: handleOpenBookmarks, color: 'text-sky-400' },
    { id: 'settings', name: '설정', Icon: SettingsIcon, onOpen: handleOpenSettings, color: 'text-gray-500' },
  ];
  
  /**
   * 게시판 열기 핸들러
   */
  function handleOpenBoard() {
    // 선택 및 포커스 관련 정리 - 비동기적으로 처리됨
    clearSelectionAndFocus();

    // 상태 변경을 위한 타임아웃 설정
    setTimeout(() => {
      if (isBoardOpen) {
        // 이미 게시판이 열려있으면 닫고 다시 열기
        setIsBoardOpen(false);
        
        // 약간의 지연 후 다시 열기
        setTimeout(() => {
          setShowBookmarks(false);
          setIsBoardOpen(true);
          onOpenBoard();
        }, 50);
      } else {
        // 게시판이 닫혀있으면 게시판 열기
        setShowBookmarks(false);
        setIsBoardOpen(true);
        onOpenBoard();
      }
    }, 10);
  }

  /**
   * 북마크 게시판 열기 핸들러
   * 북마크 모드로 게시판을 열어 북마크된 게시물만 표시합니다.
   */
  function handleOpenBookmarks() {
    // 선택 및 포커스 관련 정리 - 비동기적으로 처리됨
    clearSelectionAndFocus();
    
    // 현재 게시판이 열려있는지 확인
    if (isBoardOpen) {
      // 이미 게시판이 열려있으면 닫기
      setIsBoardOpen(false);
      
      // 약간의 지연 후 북마크 모드로 다시 열기
      setTimeout(() => {
        // 먼저 북마크 모드 설정
        setShowBookmarks(true);
        
        // 게시판 열기
        setIsBoardOpen(true);
        onOpenBoard();
      }, 100); // 충분한 지연시간 설정
    } else {
      // 북마크 모드 설정
      setShowBookmarks(true);
      
      // 게시판 열기
      setIsBoardOpen(true);
      onOpenBoard();
    }
  }

  /**
   * 설정 모달 열기 핸들러
   */
  function handleOpenSettings() {
    clearSelectionAndFocus();
    setSettingsModalOpen(true);
  }

  // Selection API 에러 방지를 위한 전역 이벤트 리스너 설정
  useEffect(() => {
    // mousedown 이벤트 발생 시 Selection 초기화
    const handleMouseDown = () => {
      // 안전하게 Selection 및 포커스 정리
      clearSelectionAndFocus();
    };

    // 전체 문서에 이벤트 리스너 등록 - 캡처 모드 활용
    document.addEventListener('mousedown', handleMouseDown, { capture: true, passive: true });

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
    };
  }, []);
  
  /**
   * 게시판 닫기 핸들러
   */
  const handleCloseBoard = () => {
    // 선택 및 포커스 초기화
    clearSelectionAndFocus();
    setIsBoardOpen(false);
  };

  /**
   * 배경화면 변경 핸들러
   */
  const handleWallpaperChange = (wallpaperUrl: string) => {
    if (wallpaperUrl) {
      // 사용자 지정 배경화면으로 설정
      setWallpaper(wallpaperUrl);
      setDefaultImageError(false);
    } else {
      // 빈 값이면 기본 배경화면으로 초기화
      setWallpaper(DEFAULT_WALLPAPER);
      
      // 기본 이미지 로딩 확인
      const img = new Image();
      img.onload = () => setDefaultImageError(false);
      img.onerror = () => setDefaultImageError(true);
      img.src = DEFAULT_WALLPAPER;
    }
  };
  
  /**
   * 로그아웃 핸들러 - 강화된 버전
   */
  const handleLogout = async () => {
    console.log('Desktop: 로그아웃 요청');
    
    // 로컬 스토리지에 로그아웃 플래그 설정
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    
    try {
      // 부모 컴포넌트의 로그아웃 핸들러 호출
      await onLogout();
    } catch (error) {
      console.error('Desktop: 로그아웃 오류:', error);
      
      // 오류가 발생해도 로그아웃 플래그는 유지
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    }
  };

  // 로그아웃 상태 모니터링 - 만약 로그아웃이 다른 곳에서 발생하면 자동으로 로그아웃
  useEffect(() => {
    const checkLogoutFlag = () => {
      if (localStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
        console.log('Desktop: 로그아웃 플래그 감지됨, 자동 로그아웃 시도');
        onLogout().catch(err => console.error('자동 로그아웃 오류:', err));
      }
    };
    
    // 1초마다 로그아웃 플래그 확인
    const interval = setInterval(checkLogoutFlag, 1000);
    
    return () => clearInterval(interval);
  }, [onLogout]);

  /**
   * Selection 및 포커스 정리 함수
   */
  const clearSelectionAndFocus = () => {
    try {
      // 비동기적으로 실행하여 React 렌더링 중 발생할 수 있는 충돌 방지
      setTimeout(() => {
        try {
          // 현재 활성화된 요소에서 포커스 제거
          if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }

          // 텍스트 선택 초기화
          const selection = window.getSelection();
          if (selection) {
            if (typeof selection.empty === 'function') {
              selection.empty();
            } else if (typeof selection.removeAllRanges === 'function') {
              selection.removeAllRanges();
            }
          }
        } catch (innerError) {
          // 내부 에러 무시 - 렌더링 흐름을 방해하지 않음
          console.error("내부 Selection API 에러 처리:", innerError);
        }
      }, 0);
    } catch (error) {
      // 외부 에러 처리 (무시)
      console.error("Selection API 에러 처리:", error);
    }
  };

  // 배경화면 스타일 결정
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
      {/* 상단 메뉴바 */}
      <MenuBar 
        onOpenHelp={() => setHelpModalOpen(true)}
        onLogout={handleLogout}
        user={user}
      />
      
      {/* 데스크톱 아이콘 */}
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
      
      {/* 모달 컴포넌트들 */}
      {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />}
      {isSettingsModalOpen && (
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setSettingsModalOpen(false)}
          onWallpaperChange={handleWallpaperChange}
        />
      )}
      
      {/* 게시판 앱 창 */}
      {isBoardOpen && (
        <BulletinBoard 
          onClose={handleCloseBoard} 
          user={user} 
          initialShowBookmarks={showBookmarks} 
        />
      )}
    </div>
  );
};

export default Desktop;