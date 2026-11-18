# KONOYARO SLOT 🎰

モバイルファーストなWebアプリケーション「**KONOYARO SLOT**」です。
**Vite + React + TypeScript** をベースに、Figmaデザイン（カラー、タイポグラフィ、レイアウト）を忠実に再現し、データ永続化・アセット管理に **Firebase (Cloud Firestore / Firebase Storage)** を採用しています。
GitHub Pages などの静的ホスティング上で動作し、Firebase 未設定時やオフライン環境でも自動でローカルモックストアによる動作確認が可能です。

---

## 🌟 主な機能・画面構成

1. **ログイン画面 (`login`)**
   - **ステップ1**: `Access code` 認証（初期有効コード: `konoyaro`, `monin`, `urusai`）
   - **ステップ2**: ユーザー名（`@Name`：半角英数字8文字以内）でログイン / 新規登録
2. **ホーム画面 (`gain` / `use`)**
   - **ためるモード (`gain`)**
     - `なんだ〇〇のかコノヤロー 単語登録` (+10TP / 重複登録防止)
     - `語録・名言 フリーワード登録` (+10TP / 重複登録防止)
   - **つかうモード (`use`)**
     - `なんだ〇〇のかコノヤロー 自動生成` (消費 1TP / 登録単語からランダム獲得 & 保存)
     - `スロット式 ゆちゆちメーカー` (消費 10TP / `head00` で大当たり +100TP！)
     - `みんなの顔面スロット` (消費 10TP / 3つ揃い +100TP、2つ揃い +10TP)
3. **マイページ (`mypage`)**
   - 所持TP・総獲得コノヤロー数の表示
   - **送金機能 (`send`)**: Firestore トランザクションによる安全な送金（残高チェック、双方の履歴記録）
   - **コノヤロー一覧モーダル**: これまでに獲得した全コノヤローの閲覧
   - **TP履歴一覧**: 新しい順の増減履歴表示
4. **サンキュー / リザルト画面 (`thx`)**
   - TP獲得時・大当たり（Amazing）時の紙吹雪アニメーション演出

---

## 🛠 技術スタック

- **フロントエンド**: React 19, Vite 6, TypeScript 5.7, Tailwind CSS 4
- **アニメーション・演出**: Canvas Confetti, Lucide React
- **バックエンド / DB**: Firebase Web SDK v12 (Cloud Firestore, Firebase Storage)
- **ホスティング**: GitHub Pages（`base: './'` 相対パス & ハッシュルーティング）

---

## 🚀 ローカル起動方法

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで表示されるローカルURL（例: `http://localhost:5173/`）にアクセスしてください。

### 3. プロダクションビルド
```bash
npm run build
```
ビルド成果物は `dist/` ディレクトリに出力されます。

---

## 🔥 Firebase のセットアップ手順

### 1. Firebase プロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセスし、新しいプロジェクトを作成します。
2. **Cloud Firestore** を有効化します（テストモードまたは適切なセキュリティルールで開始）。
3. **Firebase Storage** を有効化します。

### 2. 環境変数の設定
`.env.example` をコピーして `.env` または `.env.local` を作成し、プロジェクトの設定値を入力します：
```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. 初期データの投入（Firestore Seed）
以下のコマンドを実行するか、ログイン画面最下部の「Firestore 初期データ投入」リンクをクリックすることで、有効なアクセスコード（`konoyaro`, `monin`, `urusai`）およびサンプル単語・語録が Firestore に自動登録されます：
```bash
npm run seed
```

### 4. Storage への画像アップロード（任意）
本リポジトリの画像アセットを Firebase Storage にアップロードする場合：
- `public/assets/yuchi/*` → Firebase Storage の `yuchi/` フォルダへ
- `public/assets/faces/*` → Firebase Storage の `faces/` フォルダへ
※ Storage が未設定または未アップロード時でも、自動的にローカルのフォールバック画像が表示されるため問題なく動作します。

---

## 📦 GitHub Pages への公開方法

本リポジトリには `.github/workflows/deploy.yml`（GitHub Actions ワークフロー）が含まれています。
1. GitHub リポジトリを作成し、コードをプッシュします。
2. GitHub リポジトリの **Settings > Secrets and variables > Actions** に Firebase の環境変数を設定します。
3. **Settings > Pages > Build and deployment > Source** を **GitHub Actions** に設定します。
4. `main` または `master` ブランチへプッシュすると、自動的にビルドおよびデプロイが行われます。
