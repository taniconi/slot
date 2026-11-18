import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { KonoyaroRegisterScreen } from './screens/KonoyaroRegisterScreen';
import { MeigenRegisterScreen } from './screens/MeigenRegisterScreen';
import { KonoyaroGenerateScreen } from './screens/KonoyaroGenerateScreen';
import { YuchiMakerScreen } from './screens/YuchiMakerScreen';
import { FaceSlotScreen } from './screens/FaceSlotScreen';
import { ThxScreen } from './screens/ThxScreen';
import { MypageScreen } from './screens/MypageScreen';
import { SendScreen } from './screens/SendScreen';
import { getUserData } from './firebase/services';
import { User, ScreenType, ThxState } from './types';

const SESSION_KEY = 'konoyaro_slot_user';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [thxState, setThxState] = useState<ThxState>({
    title: 'THANK YOU',
    message: '10TPを獲得しました',
    returnScreen: 'gain',
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize session and hash routing
  useEffect(() => {
    const savedUsername = localStorage.getItem(SESSION_KEY);
    if (savedUsername) {
      getUserData(savedUsername).then((user) => {
        if (user) {
          setCurrentUser(user);
          // Check hash
          const hash = window.location.hash.replace('#', '') as ScreenType;
          if (hash && hash !== 'login') {
            setCurrentScreen(hash);
          } else {
            setCurrentScreen('gain');
          }
        }
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, []);

  // Sync hash when screen changes
  const navigateTo = (screen: ScreenType) => {
    setCurrentScreen(screen);
    window.location.hash = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Refresh current user TP from DB
  const refreshUser = async () => {
    if (currentUser?.username) {
      const updated = await getUserData(currentUser.username);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user.username);
    navigateTo('gain');
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    navigateTo('login');
  };

  const handleThxSuccess = (state: ThxState) => {
    setThxState(state);
    navigateTo('thx');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#141414] text-[#d88b33] flex items-center justify-center font-brand font-black text-2xl animate-pulse">
        KONOYARO SLOT LOADING...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#fafafa] flex flex-col items-center justify-start">
      {/* Mobile-first centered frame container (max width 430px for native app feel) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#141414] flex flex-col relative shadow-2xl border-x border-neutral-900/50">
        {/* Common Header for all authenticated screens */}
        {currentUser && currentScreen !== 'login' && (
          <Header
            user={currentUser}
            onNavigate={navigateTo}
            onLogoClick={() => navigateTo('gain')}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          {(!currentUser || currentScreen === 'login') && (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}

          {currentUser && currentScreen === 'gain' && (
            <HomeScreen
              user={currentUser}
              initialMode="gain"
              onNavigate={navigateTo}
            />
          )}

          {currentUser && currentScreen === 'use' && (
            <HomeScreen
              user={currentUser}
              initialMode="use"
              onNavigate={navigateTo}
            />
          )}

          {currentUser && currentScreen === 'konoyaro_register' && (
            <KonoyaroRegisterScreen
              user={currentUser}
              onBack={() => navigateTo('gain')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}

          {currentUser && currentScreen === 'meigen_register' && (
            <MeigenRegisterScreen
              user={currentUser}
              onBack={() => navigateTo('gain')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}

          {currentUser && currentScreen === 'konoyaro_generate' && (
            <KonoyaroGenerateScreen
              user={currentUser}
              onBack={() => navigateTo('use')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}

          {currentUser && currentScreen === 'yuchi_maker' && (
            <YuchiMakerScreen
              user={currentUser}
              onBack={() => navigateTo('use')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}

          {currentUser && currentScreen === 'face_slot' && (
            <FaceSlotScreen
              user={currentUser}
              onBack={() => navigateTo('use')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}

          {currentUser && currentScreen === 'thx' && (
            <ThxScreen
              state={thxState}
              onNavigate={navigateTo}
            />
          )}

          {currentUser && currentScreen === 'mypage' && (
            <MypageScreen
              user={currentUser}
              onBack={() => navigateTo('gain')}
              onNavigate={navigateTo}
            />
          )}

          {currentUser && currentScreen === 'send' && (
            <SendScreen
              user={currentUser}
              onBack={() => navigateTo('mypage')}
              onSuccess={handleThxSuccess}
              onUpdateUser={refreshUser}
            />
          )}
        </main>
      </div>
    </div>
  );
};
