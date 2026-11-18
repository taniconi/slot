import React, { useState, useEffect, useRef } from 'react';
import { BackButton } from '../components/BackButton';
import { getAllKonoyaroWords, saveGeneratedKonoyaro } from '../firebase/services';
import { User, ThxState } from '../types';

interface KonoyaroGenerateScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: (thxState: ThxState) => void;
  onUpdateUser: () => void;
}

export const KonoyaroGenerateScreen: React.FC<KonoyaroGenerateScreenProps> = ({
  user,
  onBack,
  onSuccess,
  onUpdateUser,
}) => {
  const [words, setWords] = useState<string[]>([]);
  const [displayWord, setDisplayWord] = useState<string>('〇〇');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const shuffleIntervalRef = useRef<any>(null);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    // Fetch registered words
    getAllKonoyaroWords().then((list) => {
      if (list && list.length > 0) {
        setWords(list);
        wordsRef.current = list;
      } else {
        const fallbacks = ['バカ', 'アホ', 'ハゲ', '神', '天才', 'ゆちゆち'];
        setWords(fallbacks);
        wordsRef.current = fallbacks;
      }
    });

    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
    };
  }, []);

  const handleStart = async () => {
    if (user.tp < 1) {
      setError('TPが足りません (1TP必要です。「ためる」で単語や語録を登録しよう！)');
      return;
    }

    setError(null);
    setIsRunning(true);
    setIsStopping(false);

    // Fast shuffle animation
    let lastIdx = -1;
    shuffleIntervalRef.current = setInterval(() => {
      const list = wordsRef.current.length > 0 ? wordsRef.current : ['コノヤロー'];
      let nextIdx = Math.floor(Math.random() * list.length);
      if (nextIdx === lastIdx && list.length > 1) {
        nextIdx = (nextIdx + 1) % list.length;
      }
      lastIdx = nextIdx;
      setDisplayWord(list[nextIdx]);
    }, 60);
  };

  const handleStop = async () => {
    if (!isRunning || isStopping) return;

    setIsStopping(true);
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }

    // Pick final word
    const list = wordsRef.current.length > 0 ? wordsRef.current : ['バカ'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    setDisplayWord(chosen);

    try {
      // Deduct 1TP, record history, save owned konoyaro
      await saveGeneratedKonoyaro(user.username, chosen);
      onUpdateUser();

      // Short delay before showing Thank You screen
      setTimeout(() => {
        onSuccess({
          title: 'THANK YOU',
          message: `なんだ${chosen}のかコノヤローを獲得`,
          subMessage: 'マイページの「コノヤロー」一覧から確認できます！',
          returnScreen: 'use',
        });
      }, 1200);
    } catch (err: any) {
      setError(err.message || '生成処理中にエラーが発生しました');
      setIsRunning(false);
      setIsStopping(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-12">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* Screen Title & Icon (Figma 1:280) */}
      <div className="w-full max-w-[340px] flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl shadow-inner shrink-0">
          💢
        </div>
        <div className="flex flex-col">
          <span className="text-[#fafafa] font-bold text-sm sm:text-base leading-tight">
            なんだOOのかコノヤロー
          </span>
          <span className="text-[#fafafa] font-black text-lg sm:text-xl leading-tight">
            自動生成
          </span>
        </div>
      </div>

      {/* Action Button: はじめる or ストップ (Figma 1:280 Rectangle 13) */}
      <div className="w-full max-w-[340px] flex justify-center mb-6">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-[200px] h-[64px] bg-[#d88b33] rounded-xl flex items-center justify-center gap-3 text-[#1e1e1e] font-brand font-black text-2xl transition-all shadow-lg hover:brightness-105 active:scale-95 cursor-pointer"
          >
            <span>はじめる</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isStopping}
            className={`w-[200px] h-[64px] rounded-xl flex items-center justify-center gap-2 font-brand font-black text-2xl transition-all shadow-lg active:scale-95 cursor-pointer ${
              isStopping
                ? 'bg-neutral-600 text-neutral-300'
                : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            }`}
          >
            <span>{isStopping ? '確定中...' : 'ストップ'}</span>
          </button>
        )}
      </div>

      {/* Error or warning */}
      {error && (
        <div className="w-full max-w-[340px] mb-4 p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs text-center font-bold animate-shake">
          {error}
        </div>
      )}

      {/* Main Orange Display Card */}
      <div className="w-full max-w-[340px] bg-[#d88b33] rounded-[24px] p-6 shadow-xl text-[#1e1e1e] flex flex-col justify-between min-h-[220px]">
        {/* Line 1: なんだ */}
        <div className="font-brand font-black text-3xl tracking-wide">
          なんだ
        </div>

        {/* Line 2: {data} のか */}
        <div className="flex items-center justify-between gap-2 my-2 bg-white/10 px-3 py-1 rounded-xl">
          <div
            className={`font-brand font-black text-3xl sm:text-4xl text-[#1e1e1e] tracking-tight truncate max-w-[210px] ${
              isRunning ? 'animate-bounce text-neutral-900 scale-105' : ''
            }`}
          >
            {displayWord}
          </div>
          <span className="font-brand font-black text-3xl shrink-0">
            のか
          </span>
        </div>

        {/* Line 3: コノヤロー */}
        <div className="font-brand font-black text-3xl tracking-wide">
          コノヤロー
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-4 text-center">
        消費: 1TP（登録されている単語からランダムに1つ獲得）
      </p>
    </div>
  );
};
