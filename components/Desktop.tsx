import React, { useState } from 'react';
import { FolderIcon, SettingsIcon } from './icons';
import MenuBar from './MenuBar';
import HelpModal from './HelpModal';
import type { User } from '../types';

interface DesktopProps {
  onOpenBoard: () => void;
  onLogout: () => void;
  user: User;
}

const Desktop: React.FC<DesktopProps> = ({ onOpenBoard, onLogout, user }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);

  const desktopItems = [
    { id: 'bulletin-board', name: '게시판', Icon: FolderIcon, onOpen: onOpenBoard, color: 'text-sky-400' },
    { id: 'bookmark', name: '북마크', Icon: FolderIcon, onOpen: () => {}, color: 'text-sky-400' },
    { id: 'settings', name: '설정', Icon: SettingsIcon, onOpen: () => {}, color: 'text-gray-500' },
  ];

  return (
    <div className="w-screen h-screen" onClick={() => setSelectedId(null)}>
      <MenuBar 
        onOpenHelp={() => setHelpModalOpen(true)}
        onLogout={onLogout}
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
    </div>
  );
};

export default Desktop;