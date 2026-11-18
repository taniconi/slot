import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BackButton } from '../components/BackButton';
import { resolveFaceAssets, playFaceSlot } from '../firebase/services';
import { User, ThxState } from '../types';

interface FaceSlotScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: (thxState: ThxState) => void;
  onUpdateUser: () => void;
}

export const FaceSlotScreen: React.FC<FaceSlotScreenProps> = ({
  user,
  onBack,
  onSuccess,
  onUpdateUser,
}) => {
  const [faces, setFaces] = useState<string[]>([]);
  const [reels, setReels] = useState<[number, number, number]>([0, 1, 2]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reelIntervalsRef = useRef<any[]>([null, null, null]);

  useEffect(() => {
    resolveFaceAssets().then((list) => {
      setFaces(list);
    });

    return () => {
      reelIntervalsRef.current.forEach((t) => {
        if (t) clearInterval(t);
      });
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

    // Spin reels independently with fast shuffle
    const totalFaces = faces.length || 7;
    [0, 1, 2].forEach((reelIndex) => {
      reelIntervalsRef.current[reelIndex] = setInterval(() => {
        setReels((prev) => {
          const next = [...prev] as [number, number, number];
          next[reelIndex] = (next[reelIndex] + 1) % totalFaces;
          return next;
        });
      }, 50 + reelIndex * 15);
    });
  };

  const handleStop = async () => {
    if (!isRunning || isStopping) return;

    setIsStopping(true);

    // Stop reel 0 immediately, reel 1 after 300ms, reel 2 after 600ms
    const totalFaces = faces.length || 7;

    // Pick random outcomes (or weighted chance)
    const final0 = Math.floor(Math.random() * totalFaces);
    const final1 = Math.random() < 0.35 ? final0 : Math.floor(Math.random() * totalFaces);
    const final2 =
      final0 === final1 && Math.random() < 0.25
        ? final0
        : Math.floor(Math.random() * totalFaces);

    const finalResult: [number, number, number] = [final0, final1, final2];

    // Stop reel 0
    clearInterval(reelIntervalsRef.current[0]);
    reelIntervalsRef.current[0] = null;
    setReels((prev) => [final0, prev[1], prev[2]]);

    // Stop reel 1
    setTimeout(() => {
      clearInterval(reelIntervalsRef.current[1]);
      reelIntervalsRef.current[1] = null;
      setReels((prev) => [final0, final1, prev[2]]);
    }, 350);

    // Stop reel 2
    setTimeout(async () => {
      clearInterval(reelIntervalsRef.current[2]);
      reelIntervalsRef.current[2] = null;
      setReels(finalResult);

      try {
        const outcome = await playFaceSlot(user.username, finalResult);
        onUpdateUser();

        if (outcome.matchCount === 3) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#d88b33', '#ffd700', '#ffffff', '#ff1493'],
          });

          setTimeout(() => {
            onSuccess({
              title: 'Amazing',
              message: '100TPを獲得',
              subMessage: '顔面スロットで3つ揃いました！JACKPOT！',
              returnScreen: 'use',
              gainedTp: 100,
              isJackpot: true,
            });
          }, 1200);
        } else if (outcome.matchCount === 2) {
          setTimeout(() => {
            onSuccess({
              title: 'THANK YOU',
              message: '10TPを獲得しました',
              subMessage: '2つ揃いで10TP払い戻し！（プラマイゼロ）',
              returnScreen: 'use',
              gainedTp: 10,
            });
          }, 1200);
        } else {
          setResultMessage('不揃い... 0TP (10TP消費)');
          setIsRunning(false);
          setIsStopping(false);
        }
      } catch (err: any) {
        setError(err.message || 'エラーが発生しました');
        setIsRunning(false);
        setIsStopping(false);
      }
    }, 700);
  };

  const getFaceUrl = (idx: number) => {
    if (faces[idx]) return faces[idx];
    const pad = idx.toString().padStart(2, '0');
    return `${import.meta.env.BASE_URL}assets/faces/${pad}.png`;
  };

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-12">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* Screen Title & Icon (Figma 1:401) */}
      <div className="w-full max-w-[340px] flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl shadow-inner shrink-0">
          🎰
        </div>
        <div className="flex flex-col">
          <span className="text-[#fafafa] font-bold text-sm sm:text-base leading-tight">
            みんなの顔面
          </span>
          <span className="text-[#fafafa] font-black text-lg sm:text-xl leading-tight">
            スロット
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

      {/* 3 Slot Reels (Figma: yzk 1, imai 1, kimo 1 each 106x106) */}
      <div className="w-full max-w-[340px] bg-neutral-900/80 p-3.5 rounded-3xl border-2 border-[#d88b33]/40 shadow-2xl flex items-center justify-between gap-2">
        {[0, 1, 2].map((reelIndex) => {
          const faceIndex = reels[reelIndex];
          const isReelSpinning = isRunning && reelIntervalsRef.current[reelIndex] !== null;

          return (
            <div
              key={reelIndex}
              className="flex-1 aspect-square bg-[#1a1a1a] rounded-2xl border-2 border-neutral-800 overflow-hidden flex items-center justify-center relative shadow-inner"
            >
              <img
                src={getFaceUrl(faceIndex)}
                alt={`Reel ${reelIndex}`}
                className={`w-[90%] h-[90%] object-contain transition-all ${
                  isReelSpinning ? 'filter blur-[1px] scale-110' : 'scale-100'
                }`}
                onError={(e: any) => {
                  e.target.src = `${import.meta.env.BASE_URL}assets/faces/00.png`;
                }}
              />
              {/* Highlight bar */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Paytable info */}
      <div className="w-full max-w-[340px] mt-6 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
        <div className="flex justify-between">
          <span>3つ揃い:</span>
          <span className="text-[#d88b33] font-bold">+100TP (大当たり)</span>
        </div>
        <div className="flex justify-between">
          <span>2つ揃い:</span>
          <span className="text-neutral-200 font-bold">+10TP (払い戻し)</span>
        </div>
        <div className="flex justify-between">
          <span>不揃い:</span>
          <span className="text-neutral-500">0TP</span>
        </div>
      </div>
    </div>
  );
};
