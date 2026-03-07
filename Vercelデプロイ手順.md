# Vercel デプロイ手順

本プロジェクト（日本クラリネット協会公式サイト）を Vercel にデプロイするための手順書です。

---

## 目次

1. [前提条件](#1-前提条件)
2. [GitHub へのプッシュ手順](#2-github-へのプッシュ手順)
3. [必要な環境変数](#3-必要な環境変数)
4. [デプロイ手順](#4-デプロイ手順)
5. [環境変数の設定（Vercel）](#5-環境変数の設定vercel)
6. [デプロイ後の確認](#6-デプロイ後の確認)
7. [よくあるトラブル](#7-よくあるトラブル)

---

## 1. 前提条件

以下の準備ができていることを確認してください。

- [ ] **Supabase プロジェクト**が作成済みである
- [ ] **Supabase のテーブル**（`competitions`、`applications`、`news`）が作成済みである  
  → 未作成の場合は [Supabase初期セットアップ手順.md](./Supabase初期セットアップ手順.md) を参照
- [ ] **GitHub アカウント**を持っている、または作成する

---

## 2. GitHub へのプッシュ手順

Vercel は GitHub と連携してデプロイできます。まず、本プロジェクトを GitHub にプッシュします。

### ステップ1：GitHub アカウントの準備

1. ブラウザで [https://github.com](https://github.com) を開く
2. アカウントがない場合は **「Sign up」** から新規登録
3. ログインする

### ステップ2：リポジトリを新規作成する

1. GitHub の画面右上 **「+」** → **「New repository」** をクリック
2. 以下を設定する
   - **Repository name**：任意の名前（例：`2026clHP`、`japan-clarinet-association`）
   - **Description**：任意（例：日本クラリネット協会公式サイト）
   - **Public** を選択
   - **「Add a README file」** はチェックしない（ローカルに既にファイルがあるため）
   - **「Create repository」** をクリック

3. 作成後、表示されるリポジトリの URL をメモする  
   例：`https://github.com/あなたのユーザー名/2026clHP.git`

### ステップ3：ローカルで Git を初期化してプッシュする

プロジェクトのフォルダ（`2026clHP`）を開き、ターミナル（PowerShell またはコマンドプロンプト）で以下を実行します。

**既に Git が初期化されていない場合**

```bash
# プロジェクトフォルダに移動
cd d:\OneDrive\01クラリネット協会\14HP\2026clHP

# Git を初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: 日本クラリネット協会公式サイト"

# メインブランチ名を設定（GitHub の既定に合わせる）
git branch -M main

# GitHub のリポジトリをリモートとして登録（URL は自分のリポジトリに置き換える）
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git

# プッシュ
git push -u origin main
```

**既に Git が初期化されている場合**

```bash
# 変更をステージング
git add .

# コミット
git commit -m "Vercel デプロイ用に更新"

# リモートが未設定の場合のみ追加（既に origin がある場合はスキップ）
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git

# プッシュ
git push -u origin main
```

> ⚠️ **注意**：`.env.local` は `.gitignore` で除外されており、GitHub にアップロードされません。環境変数は Vercel 側で別途設定します。

### ステップ4：プッシュの確認

1. GitHub のリポジトリページをブラウザで開く
2. ファイル一覧に `package.json`、`src` フォルダなどが表示されていれば成功です

---

## 3. 必要な環境変数

Vercel にデプロイする際、以下の環境変数を設定する必要があります。

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトの URL | Supabase ダッシュボード > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名公開鍵（anon public） | Supabase ダッシュボード > Project Settings > API |

> ローカル開発用の `.env.local` に設定している値と同じものを使用します。  
> サンプルは [.env.example](./.env.example) を参照してください。

---

## 4. デプロイ手順

### 方法A：GitHub から連携してデプロイ（推奨）

1. **Vercel にログイン**
   - ブラウザで [https://vercel.com](https://vercel.com) を開く
   - 「Sign Up」または「Log in」から GitHub でログイン

2. **新規プロジェクトをインポート**
   - ダッシュボードで **「Add New…」** → **「Project」** をクリック
   - 「Import Git Repository」で本プロジェクトのリポジトリを選択
   - **「Import」** をクリック

3. **プロジェクト設定**
   - **Framework Preset**：`Next.js`（自動検出される場合が多い）
   - **Root Directory**：そのまま（通常は変更不要）
   - **Build Command**：`npm run build`（既定値のままで可）
   - **Output Directory**：そのまま（Next.js の既定値）

4. **環境変数を設定**（ここで設定しなくても、後から追加可能）
   - 「Environment Variables」を展開
   - 下記［5. 環境変数の設定（Vercel）］のとおり設定

5. **デプロイ実行**
   - **「Deploy」** をクリック
   - ビルド完了まで数分待つ

### 方法B：Vercel CLI でデプロイ

1. **Vercel CLI をインストール**
   ```bash
   npm i -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **デプロイ**
   ```bash
   vercel
   ```
   - 初回はプロジェクト名や設定の質問に答える
   - 本番デプロイの場合は `vercel --prod` を実行

---

## 5. 環境変数の設定（Vercel）

GitHub 連携時に設定しなかった場合、後からでも追加できます。

1. Vercel ダッシュボードで対象プロジェクトを開く
2. 上部メニューの **「Settings」** をクリック
3. 左メニューの **「Environment Variables」** をクリック
4. 以下の環境変数を追加する

| Key | Value | Environment |
|-----|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL | Production, Preview, Development 全てにチェック |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon public キー | Production, Preview, Development 全てにチェック |
| `EMAIL_USER` | Gmail アドレス（送信元。例：`jpncs1979@gmail.com`） | Production, Preview, Development 全てにチェック |
| `EMAIL_APP_PASSWORD` | Gmail のアプリパスワード（16文字） | Production, Preview, Development 全てにチェック |

> **メール送信について（Gmail）**  
> `EMAIL_USER` と `EMAIL_APP_PASSWORD` を設定すると、申込時に参加者へ確認メール、事務局（jpncs1979@gmail.com）へ通知メールが送信されます。未設定の場合は DB への保存のみ行われ、メールは送信されません。  
> アプリパスワードは、Google アカウントで二段階認証を有効にしたうえで、[Google アカウント > セキュリティ > アプリパスワード](https://myaccount.google.com/apppasswords) から生成してください。

5. **「Save」** をクリック
6. 環境変数変更後は、**「Deployments」** から最新のデプロイを **「Redeploy」** して反映させる

---

## 6. デプロイ後の確認

1. **トップページ**
   - デプロイ完了後、表示される URL（例：`https://xxxxx.vercel.app`）にアクセス
   - ヒーローやナビゲーションが正しく表示されるか確認

2. **ヤングコンクール申込フォーム**
   - `/events/young-2026/apply` にアクセス
   - フォーム入力・送信ができるか確認
   - Supabase の `applications` テーブルにレコードが追加されているか確認

3. **エラー表示がないこと**
   - 「Supabaseの環境変数が設定されていません」のようなメッセージが出る場合は、環境変数の設定と再デプロイを確認

---

## 7. よくあるトラブル

### 「環境変数が設定されていません」と表示される

- Vercel の Environment Variables に上記2つが設定されているか確認
- 設定後、必ず **Redeploy** を実行してください（環境変数はビルド時に読み込まれます）

### 申込フォームから送信できない

- Supabase のテーブル（`competitions`、`applications`）が作成されているか確認
- `competitions` テーブルに、slug が `young-2026` のレコードが存在するか確認  
  → [新規コンクール作成手順書.md](./新規コンクール作成手順書.md) を参照

### ビルドが失敗する

- ローカルで `npm run build` が成功するか確認
- Vercel の Deployments でビルドログを確認し、エラー内容を確認

### 「Failed to fetch one or more git submodules」と表示される

プロジェクト内に `.git` を持つフォルダ（別の Git リポジトリ）があり、サブモジュールとして未登録の場合に発生します。

**対処方法：**

- 当該フォルダが本サイトのビルドに不要な場合  
  - 当該フォルダをプロジェクト外（別フォルダ）に移動するか、`.gitignore` に追加して `git rm -r --cached フォルダ名` で追跡から外し、変更をプッシュしてください。
- 当該フォルダを本サイトで使う場合  
  - 正式にサブモジュールとして登録するか、内容をこのリポジトリに統合する必要があります。

### Git プッシュができない

- **認証エラー**：GitHub にログインし直す。パスワードの代わりに Personal Access Token（PAT）が必要な場合がある  
  → GitHub > Settings > Developer settings > Personal access tokens でトークンを作成
- **「remote origin already exists」**：`git remote add origin` はスキップし、`git push -u origin main` のみ実行
- **「Permission denied」**：SSH 鍵を設定している場合は `git@github.com:ユーザー名/リポジトリ名.git` 形式の URL を使用

---

## 関連ドキュメント

- [Supabase初期セットアップ手順.md](./Supabase初期セットアップ手順.md) … データベースのセットアップ
- [.env.example](./.env.example) … 環境変数のサンプル一覧
