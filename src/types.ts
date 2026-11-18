export interface User {
  username: string;
  tp: number;
  createdAt: any;
  passwordHash?: string;
  hasPassword?: boolean;
}

export interface KonoyaroWord {
  id?: string;
  word: string;
  createdBy: string;
  createdAt: any;
}

export interface Quote {
  id?: string;
  text: string;
  createdBy: string;
  createdAt: any;
}

export interface UserKonoyaro {
  id?: string;
  username: string;
  word: string;
  createdAt: any;
}

export interface TPHistory {
  id?: string;
  username: string;
  title: string;
  amount: number;
  createdAt: any;
}

export type ScreenType =
  | 'login'
  | 'gain'
  | 'use'
  | 'konoyaro_register'
  | 'meigen_register'
  | 'konoyaro_generate'
  | 'yuchi_maker'
  | 'face_slot'
  | 'thx'
  | 'mypage'
  | 'send';

export interface ThxState {
  title: string; // 'THANK YOU' or 'Amazing'
  message: string; // '10TPを獲得しました' or 'なんだ〇〇のかコノヤローを獲得' or '100TPを獲得'
  subMessage?: string;
  returnScreen: ScreenType;
  gainedTp?: number;
  isJackpot?: boolean;
}
