import React, { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { sendTP } from '../firebase/services';
import { User, ThxState } from '../types';

interface SendScreenProps {
  user: User;
  onBack: () => void;
  onSuccess: (thxState: ThxState) => void;
  onUpdateUser: () => void;
}

export const SendScreen: React.FC<SendScreenProps> = ({
  user,
  onBack,
  onSuccess,
  onUpdateUser,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTo = recipient.trim();
    const amount = parseInt(amountStr, 10);

    if (!cleanTo) {
      setError('うけとる人のIDを入力してください');
      return;
    }
    if (cleanTo.toLowerCase() === user.username.toLowerCase()) {
      setError('自分自身には送金できません');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('送金する数量を正しく入力してください');
      return;
    }
    if (user.tp < amount) {
      setError(`所持TPが不足しています (所持: ${user.tp}TP)`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendTP(user.username, cleanTo, amount);
      onUpdateUser();
      onSuccess({
        title: 'THANK YOU',
        message: `${amount}TPを送金しました`,
        subMessage: `@${cleanTo} さんへ送金が完了しました`,
        returnScreen: 'mypage',
        gainedTp: -amount,
      });
    } catch (err: any) {
      setError(err.message || '送金処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const isButtonEnabled = recipient.trim().length > 0 && parseInt(amountStr, 10) > 0 && !loading;

  return (
    <div className="w-full flex flex-col items-center px-4 py-4 select-none animate-fadeIn pb-12">
      {/* Back button */}
      <div className="w-full max-w-[340px] mb-6 flex justify-start">
        <BackButton onClick={onBack} />
      </div>

      {/* Screen Title & Icon (Figma 2:489) */}
      <div className="w-full max-w-[340px] flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#d9d9d9] flex items-center justify-center text-4xl shadow-inner shrink-0">
          💰
        </div>
        <div className="flex flex-col">
          <span className="text-[#fafafa] font-brand font-black text-3xl leading-tight">
            送金
          </span>
          <span className="text-neutral-400 text-xs">
            所持: <span className="text-[#d88b33] font-bold">{user.tp}TP</span>
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSend} className="w-full max-w-[340px] space-y-4">
        {/* Recipient Input (Figma 2:508 & 2:509) */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-1.5 ml-1">
            受取人のユーザー名
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              if (error) setError(null);
            }}
            placeholder="うけとる人のID"
            maxLength={8}
            className="w-full h-[56px] bg-[#d9d9d9] text-[#1e1e1e] placeholder-[#8a8a8a] font-bold text-lg px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d88b33] shadow-inner"
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 mb-1.5 ml-1">
            送金する数量 (TP)
          </label>
          <input
            type="number"
            min={1}
            max={user.tp}
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value);
              if (error) setError(null);
            }}
            placeholder="数量 (例: 10)"
            className="w-full h-[56px] bg-[#d9d9d9] text-[#1e1e1e] placeholder-[#8a8a8a] font-bold text-lg px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d88b33] shadow-inner"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs text-center font-bold animate-shake">
            {error}
          </div>
        )}

        {/* Submit Button (Figma Rectangle 14: 181x73, text おくる ▶) */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={!isButtonEnabled}
            className={`w-[200px] h-[64px] rounded-xl flex items-center justify-center gap-3 font-brand font-black text-2xl transition-all shadow-lg active:scale-95 cursor-pointer ${
              isButtonEnabled
                ? 'bg-[#d88b33] text-[#1e1e1e] hover:brightness-105'
                : 'bg-neutral-700 text-neutral-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <span>{loading ? '送金中...' : 'おくる'}</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
