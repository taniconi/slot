import React, { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { getUserHistory, getUserOwnedKonoyaros } from '../firebase/services';
import { User, TPHistory, UserKonoyaro, ScreenType } from '../types';

interface MypageScreenProps {
  user: User;
  onBack: () => void;
  onNavigate: (screen: ScreenType) => void;
}

export const MypageScreen: React.FC<MypageScreenProps> = ({
  user,
  onBack,
  onNavigate,
}) => {
  const [histories, setHistories] = useState<TPHistory[]>([]);
  const [ownedKonoyaros, setOwnedKonoyaros] = useState<UserKonoyaro[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKonoyaroModal, setShowKonoyaroModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getUserHistory(user.username),
      getUserOwnedKonoyaros(user.username),
    ])
      .then(([hList, kList]) => {
        setHistories(hList);
        setOwnedKonoyaros(kList);
      })
      .finally(() => setLoading(false));
  }, [user.username]);

  const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-16">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* User Avatar Circle (Figma 1:456: size 94x94) */}
      <div className="w-24 h-24 rounded-full bg-[#d9d9d9] flex items-center justify-center font-brand font-black text-black text-5xl shadow-xl mb-3">
        {initial}
      </div>

      {/* Username (Figma 1:458: 40px) */}
      <h2 className="font-brand font-black text-3xl sm:text-4xl text-[#fafafa] tracking-wide mb-3">
        {user.username}
      </h2>

      {/* TP & Total Konoyaro stats */}
      <div className="flex flex-col items-center gap-1 mb-6 text-center">
        <div className="text-lg sm:text-xl font-black text-[#fafafa]">
          所持TP: <span className="text-[#d88b33]">{user.tp}TP</span>
        </div>
        <div className="text-lg sm:text-xl font-black text-[#fafafa]">
          総コノヤロー: <span className="text-[#d88b33]">{ownedKonoyaros.length}個</span>
        </div>
      </div>

      {/* Two Action Buttons: 送金 & コノヤロー (Figma Rectangle 16 & 17) */}
      <div className="w-full max-w-[340px] flex gap-4 mb-8">
        <button
          onClick={() => onNavigate('send')}
          className="flex-1 h-[56px] bg-[#d88b33] hover:brightness-105 active:scale-95 transition-all rounded-xl font-brand font-black text-xl text-[#1e1e1e] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💰</span>
          <span>送金</span>
        </button>

        <button
          onClick={() => setShowKonoyaroModal(true)}
          className="flex-1 h-[56px] bg-[#d88b33] hover:brightness-105 active:scale-95 transition-all rounded-xl font-brand font-black text-xl text-[#1e1e1e] shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💢</span>
          <span>コノヤロー</span>
        </button>
      </div>

      {/* History Section (Figma 1:463) */}
      <div className="w-full max-w-[340px] flex flex-col">
        <h3 className="font-brand font-black text-2xl sm:text-3xl text-[#fafafa] mb-4 text-left border-b border-neutral-800 pb-2">
          履歴
        </h3>

        {loading ? (
          <div className="text-neutral-500 text-sm text-center py-6">読み込み中...</div>
        ) : histories.length === 0 ? (
          <div className="text-neutral-500 text-sm text-center py-6 bg-neutral-900/40 rounded-xl">
            まだ履歴がありません
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            {histories.map((h, i) => {
              const isPositive = h.amount > 0;
              return (
                <div
                  key={h.id || i}
                  className="w-full flex items-center justify-between py-2.5 px-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-sm"
                >
                  <span className="text-[#fafafa] font-bold truncate max-w-[200px]">
                    {h.title}
                  </span>
                  <span
                    className={`font-black text-base shrink-0 ${
                      isPositive ? 'text-[#d88b33]' : 'text-neutral-400'
                    }`}
                  >
                    {isPositive ? `+${h.amount}` : h.amount}TP
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Owned Konoyaros Modal */}
      {showKonoyaroModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#1e1e1e] border-2 border-[#d88b33] rounded-3xl p-6 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-brand font-black text-xl text-[#d88b33] flex items-center gap-2">
                <span>💢</span>
                <span>獲得したコノヤロー</span>
              </h3>
              <button
                onClick={() => setShowKonoyaroModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 font-bold hover:bg-neutral-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              自動生成で集めた「なんだ〇〇のかコノヤロー」コレクション
            </p>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
              {ownedKonoyaros.length === 0 ? (
                <div className="text-neutral-500 text-sm text-center py-8">
                  まだ獲得したコノヤローがありません。「つかう」の自動生成で獲得しよう！
                </div>
              ) : (
                ownedKonoyaros.map((k, idx) => (
                  <div
                    key={k.id || idx}
                    className="p-3 bg-[#d88b33]/20 border border-[#d88b33]/40 rounded-xl flex items-center gap-2 text-sm text-[#fafafa] font-bold"
                  >
                    <span className="text-neutral-400 text-xs shrink-0">#{idx + 1}</span>
                    <span className="truncate">なんだ<span className="text-[#d88b33] font-black">{k.word}</span>のかコノヤロー</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowKonoyaroModal(false)}
              className="mt-4 w-full py-3 bg-[#d88b33] text-[#1e1e1e] font-brand font-black rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
