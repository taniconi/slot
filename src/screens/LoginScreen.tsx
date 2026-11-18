import React, { useState } from 'react';
import { validateAccessCode, checkUsernameExists, registerUser, loginUser } from '../firebase/services';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

type PasswordMode = 'register' | 'login' | 'setPassword';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isAccessCodeValid, setIsAccessCodeValid] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameDecided, setIsUsernameDecided] = useState(false);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('register');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError('無効な Access code です');
      }
    } catch (err: any) {
      setError(err.message || '認証エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Decide username, then branch to password step
  // - New username: set a password (registration). Duplicate usernames are prohibited.
  // - Existing username with a password: enter the password to log in.
  // - Existing username without a password (older accounts): set a password now.
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
      const { exists, hasPassword } = await checkUsernameExists(cleanName);
      setPasswordMode(!exists ? 'register' : hasPassword ? 'login' : 'setPassword');
      setPassword('');
      setPasswordConfirm('');
      setIsUsernameDecided(true);
    } catch (err: any) {
      setError(err.message || 'ユーザー確認エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Password (register / login / set for older accounts)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = username.trim();

    if (passwordMode !== 'login') {
      if (password.length < 4) {
        setError('パスワードは4文字以上で設定してください');
        return;
      }
      if (password !== passwordConfirm) {
        setError('パスワード（確認）が一致しません');
        return;
      }
    } else if (!password) {
      setError('パスワードを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user =
        passwordMode === 'register'
          ? await registerUser(cleanName, password)
          : await loginUser(cleanName, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'ログインエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUsername = () => {
    setIsUsernameDecided(false);
    setPassword('');
    setPasswordConfirm('');
    setError(null);
  };

  const inputBoxClass =
    'flex items-center h-[58px] bg-[#d88b33] rounded-md overflow-hidden shadow-lg border border-[#d88b33]/60 focus-within:ring-2 focus-within:ring-white';
  const inputClass =
    'flex-1 h-full px-4 bg-transparent text-[#1e1e1e] placeholder-[#a36820] font-brand font-bold text-lg focus:outline-none disabled:opacity-80';
  const submitButtonClass =
    'w-12 h-full flex items-center justify-center bg-[#d88b33] hover:bg-[#c47c2b] active:scale-95 transition-all text-[#1e1e1e] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shrink-0';

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
          {/* Step 1: Access Code Input Box */}
          <form onSubmit={handleAccessCodeSubmit} className="relative">
            <div className={inputBoxClass}>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isAccessCodeValid || loading}
                placeholder="Access code"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={isAccessCodeValid || loading}
                className={submitButtonClass}
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
          </form>

          {/* Step 2: Username Input Box */}
          {isAccessCodeValid && !isUsernameDecided && (
            <form onSubmit={handleUsernameSubmit} className="animate-fadeIn transition-all">
              <div className={inputBoxClass}>
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
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={submitButtonClass}
                  title="次へ"
                >
                  <svg className="w-5 h-5 fill-[#1e1e1e]" viewBox="0 0 24 24">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] text-[#a3a3a3] text-center mt-1.5">
                半角英数字8文字以内（同じユーザー名は登録できません）
              </p>
            </form>
          )}

          {/* Step 3: Password */}
          {isAccessCodeValid && isUsernameDecided && (
            <form onSubmit={handlePasswordSubmit} className="animate-fadeIn transition-all space-y-3">
              <p className="text-sm text-center text-[#fafafa]">
                <span className="text-[#d88b33] font-brand font-bold">@{username.trim()}</span>
                {passwordMode === 'register' && ' を新規登録します'}
                {passwordMode === 'login' && ' でログインします'}
                {passwordMode === 'setPassword' && ' のパスワードを設定します'}
              </p>
              <div className={inputBoxClass}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  disabled={loading}
                  maxLength={32}
                  placeholder={passwordMode === 'login' ? 'Password' : 'Password を設定'}
                  className={inputClass}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={submitButtonClass}
                  title={passwordMode === 'register' ? '登録' : 'ログイン'}
                >
                  <svg className="w-5 h-5 fill-[#1e1e1e]" viewBox="0 0 24 24">
                    <polygon points="6,3 20,12 6,21" />
                  </svg>
                </button>
              </div>
              {passwordMode !== 'login' && (
                <>
                  <div className={inputBoxClass}>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => {
                        setPasswordConfirm(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={loading}
                      maxLength={32}
                      placeholder="Password（確認）"
                      className={inputClass}
                    />
                  </div>
                  <p className="text-[11px] text-[#a3a3a3] text-center">
                    パスワードは4文字以上で設定してください
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={handleBackToUsername}
                disabled={loading}
                className="w-full text-[11px] text-neutral-400 underline hover:text-[#d88b33] transition-colors cursor-pointer"
              >
                ユーザー名を変更する
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-sm text-center text-xs text-neutral-500 mt-8 pt-4 border-t border-neutral-900">
        <p>KONOYARO SLOT v1.0</p>
      </div>
    </div>
  );
};
