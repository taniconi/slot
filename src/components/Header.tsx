import React from 'react';
import { User, ScreenType } from '../types';

interface HeaderProps {
  user: User | null;
  onNavigate: (screen: ScreenType) => void;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onNavigate, onLogoClick }) => {
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-neutral-900 sticky top-0 z-40 select-none">
      {/* Brand Logo */}
      <button
        onClick={onLogoClick}
        className="text-left group cursor-pointer focus:outline-none transition-transform active:scale-95"
      >
        <span className="font-brand text-[#d88b33] text-lg font-black leading-tight tracking-wider block">
          KONOYARO
        </span>
        <span className="font-brand text-[#d88b33] text-lg font-black leading-none tracking-widest block">
          SLOT
        </span>
      </button>

      {/* User Status Pill */}
      {user && (
        <button
          onClick={() => onNavigate('mypage')}
          className="flex items-center gap-2 bg-[#d88b33] text-[#1e1e1e] pl-2 pr-3 py-1.5 rounded-full hover:brightness-105 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
        >
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-brand font-black text-black text-sm shadow-inner">
            {initial}
          </div>

          <div className="flex flex-col text-left leading-none">
            <span className="font-bold text-xs tracking-tight truncate max-w-[80px]">
              {user.username}
            </span>
            <span className="font-black text-sm text-[#1e1e1e]">
              {user.tp} <span className="text-[10px]">tp</span>
            </span>
          </div>
        </button>
      )}
    </header>
  );
};
