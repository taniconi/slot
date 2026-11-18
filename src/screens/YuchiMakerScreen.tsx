import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BackButton } from '../components/BackButton';
import { resolveYuchiAssets, playYuchiMaker } from '../firebase/services';
import { User, ThxState } from '../types';

interface YuchiMakerScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: (thxState: ThxState) => void;
  onUpdateUser: () => void;
}

export const YuchiMakerScreen: React.FC<YuchiMakerScreenProps> = ({
  user,
  onBack,
  onSuccess,
  onUpdateUser,
}) => {
  const [assets, setAssets] = useState<{ heads: string[]; body: string; leg: string }>({
    heads: [],
    body: '',
    leg: '',
  });
  const [currentHeadIndex, setCurrentHeadIndex] = useState<number>(3); // initial head03 as in Figma
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shuffleTimerRef = useRef<any>(null);

  useEffect(() => {
    resolveYuchiAssets().then((res) => {
      setAssets(res);
    });

    return () => {
      if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
    };
  }, []);

  const handleStart = async () => {
    if (user.tp < 10) {
      setError('TPが足りません (10TP必要です。「ためる」で単語や語録を登録しよう！)');
      return;
    }

    setError(null);
    setResultMessage(null);
    setIsRunning(true);
    setIsStopping(false);

    // Fast shuffle head
    let last = currentHeadIndex;
    shuffleTimerRef.current = setInterval(() => {
      let next = Math.floor(Math.random() * (assets.heads.length || 7));
      if (next === last) {
        next = (next + 1) % (assets.heads.length || 7);
      }
      last = next;
      setCurrentHeadIndex(next);
    }, 60);
  };

  const handleStop = async () => {
    if (!isRunning || isStopping) return;

    setIsStopping(true);
    if (shuffleTimerRef.current) {
      clearInterval(shuffleTimerRef.current);
      shuffleTimerRef.current = null;
    }

    // Determine stop head
    const stopIdx = Math.floor(Math.random() * (assets.heads.length || 7));
    setCurrentHeadIndex(stopIdx);

    try {
      const result = await playYuchiMaker(user.username, stopIdx);
      onUpdateUser();

      if (result.isJackpot) {
        // Confetti celebration!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d88b33', '#ffd700', '#ffffff', '#ff4500'],
        });

        setTimeout(() => {
          onSuccess({
            title: 'Amazing',
            message: '100TPを獲得',
            subMessage: 'ゆちゆちメーカーで頭（head00）が揃いました！大当たり！',
            returnScreen: 'use',
            gainedTp: 100,
            isJackpot: true,
          });
        }, 1200);
      } else {
        setResultMessage(`ハズレ... (停止: head0${stopIdx}) 10TP消費`);
        setIsRunning(false);
        setIsStopping(false);
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
      setIsRunning(false);
      setIsStopping(false);
    }
  };

  const currentHeadUrl =
    assets.heads[currentHeadIndex] ||
    `${import.meta.env.BASE_URL}assets/yuchi/head03.png`;
  const bodyUrl = assets.body || `${import.meta.env.BASE_URL}assets/yuchi/body.webp`;
  const legUrl = assets.leg || `${import.meta.env.BASE_URL}assets/yuchi/leg.webp`;

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-12">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* Screen Title & Icon (Figma 1:374) */}
      <div className="w-full max-w-[340px] flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl shadow-inner shrink-0">
          🏭
        </div>
        <div className="flex flex-col">
          <span className="text-[#fafafa] font-bold text-sm sm:text-base leading-tight">
            スロット式
          </span>
          <span className="text-[#fafafa] font-black text-lg sm:text-xl leading-tight">
            ゆちゆちメーカー
          </span>
        </div>
      </div>

      {/* Start / Stop Button */}
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
            <span>{isStopping ? '停止中...' : 'ストップ'}</span>
          </button>
        )}
      </div>

      {/* Error or warning */}
      {error && (
        <div className="w-full max-w-[340px] mb-4 p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs text-center font-bold animate-shake">
          {error}
        </div>
      )}

      {resultMessage && !isRunning && (
        <div className="w-full max-w-[340px] mb-4 p-2 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-300 text-xs text-center font-bold animate-fadeIn">
          {resultMessage}
        </div>
      )}

      {/* Yuchi Character Slot Area (3 stacked parts: head, body, leg) */}
      <div className="w-[180px] sm:w-[200px] flex flex-col items-center justify-center bg-neutral-900/60 p-4 rounded-3xl border border-[#d88b33]/40 shadow-2xl relative">
        {/* Head Part */}
        <div
          className={`w-[130px] h-[130px] flex items-center justify-center transition-transform ${
            isRunning ? 'scale-105 filter blur-[0.6px]' : ''
          }`}
        >
          <img
            src={currentHeadUrl}
            alt="Yuchi Head"
            className="w-full h-full object-contain drop-shadow"
            onError={(e: any) => {
              e.target.src = `${import.meta.env.BASE_URL}assets/yuchi/head00.webp`;
            }}
          />
        </div>

        {/* Body Part (Fixed) */}
        <div className="w-[130px] h-[130px] -mt-2 flex items-center justify-center">
          <img
            src={bodyUrl}
            alt="Yuchi Body"
            className="w-full h-full object-contain drop-shadow"
            onError={(e: any) => {
              e.target.src = `${import.meta.env.BASE_URL}assets/yuchi/body.webp`;
            }}
          />
        </div>

        {/* Leg Part (Fixed) */}
        <div className="w-[130px] h-[130px] -mt-2 flex items-center justify-center">
          <img
            src={legUrl}
            alt="Yuchi Leg"
            className="w-full h-full object-contain drop-shadow"
            onError={(e: any) => {
              e.target.src = `${import.meta.env.BASE_URL}assets/yuchi/leg.webp`;
            }}
          />
        </div>

        {/* Jackpot target badge */}
        <div className="absolute -top-3 bg-[#d88b33] text-[#1e1e1e] font-black text-[11px] px-3 py-0.5 rounded-full shadow">
          head00 で 100TP!
        </div>
      </div>

      <p className="text-xs text-neutral-400 mt-5 text-center">
        参加費: 10TP / 大当たりで +100TP
      </p>
    </div>
  );
};
