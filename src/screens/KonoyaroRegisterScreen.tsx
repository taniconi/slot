import React, { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { checkWordExists, registerKonoyaroWord } from '../firebase/services';
import { User, ScreenType, ThxState } from '../types';

interface KonoyaroRegisterScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: (thxState: ThxState) => void;
  onUpdateUser: () => void;
}

export const KonoyaroRegisterScreen: React.FC<KonoyaroRegisterScreenProps> = ({
  user,
  onBack,
  onSuccess,
  onUpdateUser,
}) => {
  const [word, setWord] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced duplicate check
  useEffect(() => {
    const trimmed = word.trim();
    if (!trimmed) {
      setIsDuplicate(false);
      setError(null);
      return;
    }

    if (trimmed.length > 10) {
      setError('単語は10文字以内で入力してください');
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const exists = await checkWordExists(trimmed);
        setIsDuplicate(exists);
        if (exists) {
          setError('この単語はすでに登録されています！');
        } else {
          setError(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [word]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = word.trim();
    if (!cleanWord || isDuplicate || checking || submitting) return;

    if (cleanWord.length > 10) {
      setError('単語は10文字以内で入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await registerKonoyaroWord(user.username, cleanWord);
      onUpdateUser();
      onSuccess({
        title: 'THANK YOU',
        message: '10TPを獲得しました',
        subMessage: `「なんだ${cleanWord}のかコノヤロー」を登録しました！`,
        returnScreen: 'gain',
        gainedTp: 10,
      });
    } catch (err: any) {
      setError(err.message || '登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const isButtonEnabled = word.trim().length > 0 && !isDuplicate && !checking && !submitting;

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-12">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* Screen Title & Icon (Figma 1:168) */}
      <div className="w-full max-w-[340px] flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#d9d9d9] flex items-center justify-center text-3xl shadow-inner shrink-0">
          💢
        </div>
        <div className="flex flex-col">
          <span className="text-[#fafafa] font-bold text-sm sm:text-base leading-tight">
            なんだOOのかコノヤロー
          </span>
          <span className="text-[#fafafa] font-black text-lg sm:text-xl leading-tight">
            単語登録
          </span>
        </div>
      </div>

      {/* Main Orange Card */}
      <div className="w-full max-w-[340px] bg-[#d88b33] rounded-[24px] p-6 shadow-xl text-[#1e1e1e] flex flex-col justify-between min-h-[220px]">
        {/* Line 1: なんだ */}
        <div className="font-brand font-black text-3xl tracking-wide">
          なんだ
        </div>

        {/* Line 2: [ Input ] のか */}
        <div className="flex items-center gap-3 my-2">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            maxLength={10}
            placeholder="入力してね"
            className="flex-1 bg-[#d9d9d9] text-[#1e1e1e] placeholder-[#8a8a8a] font-bold text-lg px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-black/40 shadow-inner"
          />
          <span className="font-brand font-black text-3xl shrink-0">
            のか
          </span>
        </div>

        {/* Line 3: コノヤロー */}
        <div className="font-brand font-black text-3xl tracking-wide">
          コノヤロー
        </div>
      </div>

      {/* Error or validation status */}
      {error && (
        <div className="w-full max-w-[340px] mt-4 p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs text-center font-bold animate-shake">
          {error}
        </div>
      )}

      {/* Submit Button (Figma Rectangle 13: 181x73, text 送信 ▶) */}
      <div className="w-full max-w-[340px] flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          disabled={!isButtonEnabled}
          className={`w-[200px] h-[64px] rounded-xl flex items-center justify-center gap-3 font-brand font-black text-2xl transition-all shadow-lg active:scale-95 cursor-pointer ${
            isButtonEnabled
              ? 'bg-[#d88b33] text-[#1e1e1e] hover:brightness-105'
              : 'bg-neutral-700 text-neutral-400 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>{submitting ? '登録中...' : '送信'}</span>
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </button>
      </div>
    </div>
  );
};
