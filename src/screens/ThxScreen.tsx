import React from 'react';
import { ThxState, ScreenType } from '../types';

interface ThxScreenProps {
  state: ThxState;
  onNavigate: (screen: ScreenType) => void;
}

export const ThxScreen: React.FC<ThxScreenProps> = ({ state, onNavigate }) => {
  const isJackpot = state.isJackpot || state.title === 'Amazing';

  return (
    <div className="w-full min-h-[75vh] flex flex-col items-center justify-center px-4 py-8 select-none animate-fadeIn text-center">
      {/* Circle Icon (Figma 1:248 & 1:427) */}
      <div
        className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#d9d9d9] flex items-center justify-center text-6xl sm:text-7xl shadow-2xl mb-8 ${
          isJackpot ? 'animate-bounce border-4 border-[#d88b33]' : ''
        }`}
      >
        {isJackpot ? '🎰' : '😎'}
      </div>

      {/* Main Title: THANK YOU or Amazing */}
      <h1
        className={`font-brand font-black text-4xl sm:text-5xl tracking-wide mb-4 ${
          isJackpot ? 'text-[#d88b33] animate-pulse' : 'text-[#fafafa]'
        }`}
      >
        {state.title}
      </h1>

      {/* Main Message */}
      <p className="text-xl sm:text-2xl font-bold text-[#fafafa] mb-2 px-2">
        {state.message}
      </p>

      {/* Optional Sub-message */}
      {state.subMessage && (
        <p className="text-xs sm:text-sm text-neutral-400 mb-8 max-w-[280px]">
          {state.subMessage}
        </p>
      )}

      {/* Return Button (Figma Rectangle 13: 181x73, text もどる ▶) */}
      <div className="w-full max-w-[340px] flex justify-center mt-6">
        <button
          onClick={() => onNavigate(state.returnScreen)}
          className="w-[200px] h-[64px] bg-[#d88b33] rounded-xl flex items-center justify-center gap-3 text-[#1e1e1e] font-brand font-black text-2xl transition-all shadow-xl hover:brightness-105 active:scale-95 cursor-pointer"
        >
          <span>もどる</span>
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </button>
      </div>
    </div>
  );
};
