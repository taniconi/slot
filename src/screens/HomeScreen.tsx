import React, { useState } from 'react';
import { User, ScreenType } from '../types';

interface HomeScreenProps {
  user: User;
  initialMode?: 'gain' | 'use';
  onNavigate: (screen: ScreenType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  initialMode = 'gain',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'gain' | 'use'>(initialMode);

  return (
    <div className="w-full flex flex-col items-center px-4 py-6 select-none animate-fadeIn pb-12">
      {/* Mode Switch Tabs (Figma Group 7 & Group 8: size 150x72 each) */}
      <div className="flex justify-center gap-4 w-full max-w-[340px] mb-8">
        <button
          onClick={() => setActiveTab('gain')}
          className={`flex-1 h-[60px] sm:h-[68px] font-bold text-xl sm:text-2xl rounded-md transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center ${
            activeTab === 'gain'
              ? 'bg-[#d88b33] text-[#1e1e1e]'
              : 'bg-[#4a4a4a] text-[#a3a3a3] hover:bg-[#5a5a5a]'
          }`}
        >
          ためる
        </button>
        <button
          onClick={() => setActiveTab('use')}
          className={`flex-1 h-[60px] sm:h-[68px] font-bold text-xl sm:text-2xl rounded-md transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center ${
            activeTab === 'use'
              ? 'bg-[#d88b33] text-[#1e1e1e]'
              : 'bg-[#4a4a4a] text-[#a3a3a3] hover:bg-[#5a5a5a]'
          }`}
        >
          つかう
        </button>
      </div>

      {/* Mode: ためる (Gain) */}
      {activeTab === 'gain' && (
        <div className="w-full max-w-[340px] flex flex-col gap-6 animate-fadeIn">
          {/* Card 1: なんだ〇〇のかコノヤロー 単語登録 */}
          <div
            onClick={() => onNavigate('konoyaro_register')}
            className="relative bg-[#d88b33] rounded-[24px] p-5 pt-6 text-[#1e1e1e] cursor-pointer hover:brightness-105 active:scale-98 transition-all shadow-xl group border-2 border-transparent hover:border-white/20"
          >
            {/* Top Right TP Badge */}
            <div className="absolute top-4 right-4 bg-[#e5e5e5] text-[#1e1e1e] font-black text-sm px-3 py-1 rounded-full shadow-sm">
              10TP
            </div>

            {/* Icon + Title Layout */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                💢
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-snug">
                  なんだOOのかコノヤロー
                </span>
                <span className="font-black text-xl sm:text-2xl leading-tight">
                  単語登録
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: 語録・名言 フリーワード登録 */}
          <div
            onClick={() => onNavigate('meigen_register')}
            className="relative bg-[#d88b33] rounded-[24px] p-5 pt-6 text-[#1e1e1e] cursor-pointer hover:brightness-105 active:scale-98 transition-all shadow-xl group border-2 border-transparent hover:border-white/20"
          >
            {/* Top Right TP Badge */}
            <div className="absolute top-4 right-4 bg-[#e5e5e5] text-[#1e1e1e] font-black text-sm px-3 py-1 rounded-full shadow-sm">
              10TP
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                👼
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-snug">
                  語録・名言
                </span>
                <span className="font-black text-xl sm:text-2xl leading-tight">
                  フリーワード登録
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode: つかう (Use) */}
      {activeTab === 'use' && (
        <div className="w-full max-w-[340px] flex flex-col gap-6 animate-fadeIn">
          {/* Card 1: なんだ〇〇のかコノヤロー 自動生成 (1TP) */}
          <div
            onClick={() => onNavigate('konoyaro_generate')}
            className="relative bg-[#d88b33] rounded-[24px] p-5 pt-6 text-[#1e1e1e] cursor-pointer hover:brightness-105 active:scale-98 transition-all shadow-xl group border-2 border-transparent hover:border-white/20"
          >
            <div className="absolute top-4 right-4 bg-[#e5e5e5] text-[#1e1e1e] font-black text-sm px-3 py-1 rounded-full shadow-sm">
              1TP
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                💢
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-snug">
                  なんだOOのかコノヤロー
                </span>
                <span className="font-black text-xl sm:text-2xl leading-tight">
                  自動生成
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: スロット式 ゆちゆちメーカー (10TP) */}
          <div
            onClick={() => onNavigate('yuchi_maker')}
            className="relative bg-[#d88b33] rounded-[24px] p-5 pt-6 text-[#1e1e1e] cursor-pointer hover:brightness-105 active:scale-98 transition-all shadow-xl group border-2 border-transparent hover:border-white/20"
          >
            <div className="absolute top-4 right-4 bg-[#e5e5e5] text-[#1e1e1e] font-black text-sm px-3 py-1 rounded-full shadow-sm">
              10TP
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                🏭
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-snug">
                  スロット式
                </span>
                <span className="font-black text-xl sm:text-2xl leading-tight">
                  ゆちゆちメーカー
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: みんなの顔面スロット (10TP) */}
          <div
            onClick={() => onNavigate('face_slot')}
            className="relative bg-[#d88b33] rounded-[24px] p-5 pt-6 text-[#1e1e1e] cursor-pointer hover:brightness-105 active:scale-98 transition-all shadow-xl group border-2 border-transparent hover:border-white/20"
          >
            <div className="absolute top-4 right-4 bg-[#e5e5e5] text-[#1e1e1e] font-black text-sm px-3 py-1 rounded-full shadow-sm">
              10TP
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl sm:text-4xl shadow-inner shrink-0">
                🎰
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-snug">
                  みんなの顔面
                </span>
                <span className="font-black text-xl sm:text-2xl leading-tight">
                  スロット
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
