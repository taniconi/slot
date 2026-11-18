import React, { useState } from 'react';
import { validateAccessCode, loginOrRegisterUser, seedFirestoreDatabase } from '../firebase/services';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isAccessCodeValid, setIsAccessCodeValid] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // Step 1: Validate Access Code
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Access code を入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const isValid = await validateAccessCode(accessCode);
      if (isValid) {
        setIsAccessCodeValid(true);
        setError(null);
      } else {
        setError('無効な Access code です (例: konoyaro, monin, urusai)');
      }
    } catch (err: any) {
      setError(err.message || '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Login or Register User
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();

    if (!cleanName) {
      setError('ユーザー名を入力してください');
      return;
    }

    if (!/^[a-zA-Z0-9]{1,8}$/.test(cleanName)) {
      setError('ユーザー名は半角英数字8文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await loginOrRegisterUser(cleanName);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'ログインエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSeed = async () => {
    setLoading(true);
    const res = await seedFirestoreDatabase();
    setSeedStatus(res.message);
    setLoading(false);
    setTimeout(() => setSeedStatus(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#fafafa] flex flex-col justify-between items-center px-6 py-12 select-none">
      <div className="w-full max-w-sm flex flex-col items-center flex-1 justify-center">
        {/* Figma Logo: KONOYARO SLOT */}
        <div className="text-center mb-16 animate-fadeIn">
          <h1 className="font-brand text-4xl sm:text-5xl font-black text-[#d88b33] tracking-wider leading-none mb-2">
            KONOYARO
          </h1>
          <h1 className="font-brand text-4xl sm:text-5xl font-black text-[#d88b33] tracking-widest leading-none">
            SLOT
          </h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-[280px] mb-4 py-2 px-3 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 text-xs text-center font-bold animate-shake">
            {error}
          </div>
        )}

        <div className="w-full max-w-[280px] space-y-5">
          {/* Step 1: Access Code Input Box (Figma group ac: 1:31) */}
          <form onSubmit={handleAccessCodeSubmit} className="relative">
            <div className="flex items-center h-[58px] bg-[#d88b33] rounded-md overflow-hidden shadow-lg border border-[#d88b33]/60 focus-within:ring-2 focus-within:ring-white">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isAccessCodeValid || loading}
                placeholder="Access code"
                className="flex-1 h-full px-4 bg-transparent text-[#1e1e1e] placeholder-[#a36820] font-brand font-bold text-lg focus:outline-none disabled:opacity-80"
              />
              <button
                type="submit"
                disabled={isAccessCodeValid || loading}
                className="w-12 h-full flex items-center justify-center bg-[#d88b33] hover:bg-[#c47c2b] active:scale-95 transition-all text-[#1e1e1e] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                title="認証"
              >
                {isAccessCodeValid ? (
                  <span className="text-[#1e1e1e] font-black text-xl">✓</span>
                ) : (
                  <svg className="w-5 h-5 fill-[#1e1e1e]" viewBox="0 0 24 24">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                )}
              </button>
            </div>
            {!isAccessCodeValid && (
              <p className="text-[11px] text-[#a3a3a3] text-center mt-1.5">
                初期コード: <span className="text-[#d88b33] font-mono">konoyaro</span> / <span className="text-[#d88b33] font-mono">monin</span> / <span className="text-[#d88b33] font-mono">urusai</span>
              </p>
            )}
          </form>

          {/* Step 2: Username Input Box (Figma group name: 1:30) */}
          {isAccessCodeValid && (
            <form onSubmit={handleUsernameSubmit} className="animate-fadeIn transition-all">
              <div className="flex items-center h-[58px] bg-[#d88b33] rounded-md overflow-hidden shadow-lg border border-[#d88b33]/60 focus-within:ring-2 focus-within:ring-white">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  disabled={loading}
                  maxLength={8}
                  placeholder="@Name"
                  className="flex-1 h-full px-4 bg-transparent text-[#1e1e1e] placeholder-[#a36820] font-brand font-bold text-lg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-12 h-full flex items-center justify-center bg-[#d88b33] hover:bg-[#c47c2b] active:scale-95 transition-all text-[#1e1e1e] cursor-pointer disabled:opacity-50"
                  title="ログイン"
                >
                  <svg className="w-5 h-5 fill-[#1e1e1e]" viewBox="0 0 24 24">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] text-[#a3a3a3] text-center mt-1.5">
                半角英数字8文字以内
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info & Seed Trigger */}
      <div className="w-full max-w-sm text-center text-xs text-neutral-500 mt-8 pt-4 border-t border-neutral-900">
        <p className="mb-2">KONOYARO SLOT v1.0</p>
        <button
          onClick={handleQuickSeed}
          disabled={loading}
          className="text-[10px] text-neutral-400 underline hover:text-[#d88b33] transition-colors cursor-pointer"
        >
          Firestore 初期データ投入 (Seed Database)
        </button>
        {seedStatus && (
          <p className="text-[11px] text-emerald-400 mt-1 font-bold">{seedStatus}</p>
        )}
      </div>
    </div>
  );
};
