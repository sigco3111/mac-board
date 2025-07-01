import React, { useState } from 'react';
import Desktop from './components/Desktop';
import BulletinBoard from './components/BulletinBoard';
import LoginScreen from './components/LoginScreen';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isBoardOpen, setBoardOpen] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setBoardOpen(false); // also close board on logout
  };

  const handleOpenBoard = () => setBoardOpen(true);
  const handleCloseBoard = () => setBoardOpen(false);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen font-sans antialiased">
      <Desktop onOpenBoard={handleOpenBoard} onLogout={handleLogout} user={user} />
      {isBoardOpen && <BulletinBoard onClose={handleCloseBoard} user={user} />}
    </div>
  );
};

export default App;
