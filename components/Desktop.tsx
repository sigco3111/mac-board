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

// 로그아웃 상태를 저장하기 위한 로컬 스토리지 키
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';

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
  const [isBoardOpen, setIsBoardOpen] = useState<boolean>(false);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);

  // 데스크톱 아이템 정의
  const desktopItems = [
    { id: 'bulletin-board', name: '게시판', Icon: FolderIcon, onOpen: handleOpenBoard, color: 'text-sky-400' },
    { id: 'bookmark', name: '북마크', Icon: FolderIcon, onOpen: handleOpenBookmarks, color: 'text-sky-400' },
    { id: 'settings', name: '설정', Icon: SettingsIcon, onOpen: () => {}, color: 'text-gray-500' },
  ];
  
  /**
   * 게시판 열기 핸들러
   */
  function handleOpenBoard() {
    // 이미 게시판이 열려있으면 다시 열지 않음
    if (isBoardOpen) return;
    
    setShowBookmarks(false);
    setIsBoardOpen(true);
    onOpenBoard();
  }

  /**
   * 북마크 게시판 열기 핸들러
   */
  function handleOpenBookmarks() {
    // 이미 게시판이 열려있으면 다시 열지 않음
    if (isBoardOpen) {
      setShowBookmarks(true);
      return;
    }
    
    setShowBookmarks(true);
    setIsBoardOpen(true);
    onOpenBoard();
  }
  
  /**
   * 게시판 닫기 핸들러
   */
  const handleCloseBoard = () => {
    setIsBoardOpen(false);
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

  return (
    <div className="w-screen h-screen" onClick={() => setSelectedId(null)}>
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