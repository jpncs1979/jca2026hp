# 日本クラリネット協会 公式サイト

Next.js（App Router）＋ Supabase ＋ Stripe で構築した公式サイトの開発用リポジトリです。

---

## このPCで初めて開発する場合

1. **Node.js** をインストール（v20 以上推奨。`package.json` の `engines` を参照）
   - [nodejs.org](https://nodejs.org/) から LTS をインストール、または nvm 利用時は `.nvmrc` があるので `nvm use` で合わせる。
2. プロジェクトのフォルダでターミナルを開き、依存関係をインストール：
   ```bash
   npm install
   ```
3. 環境変数を用意する：
   - `.env.example` をコピーして `.env.local` を作成し、Supabase・Stripe・メール用の値を入力する。
   - `.env.local` は git に含まれないため、**別のPCでは同じ手順で .env.local を用意する必要があります**（後述）。
4. 開発サーバーを起動：
   ```bash
   npm run dev
   ```
5. ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

---

## 別のPCで開発する場合（OneDrive のフォルダを開く）

このプロジェクトを **OneDrive で同期しているフォルダ** を、別のPCで開いて開発する手順です。

1. **OneDrive の同期を完了させる**  
   別のPCで同じ OneDrive アカウントにサインインし、このプロジェクトのフォルダがローカルに同期されていることを確認する。必要なファイルがすべて「オンラインのみ」でないことを確認する。

2. **Node.js をインストール**  
   そのPCに Node.js v20 以上が入っていなければ、[nodejs.org](https://nodejs.org/) から LTS をインストールする。nvm を使う場合はフォルダで `nvm use` を実行すると `.nvmrc` のバージョンに合わせられる。

3. **依存関係をインストール**  
   プロジェクトのフォルダでターミナルを開き、次を実行する：
   ```bash
   npm install
   ```
   （OneDrive で `node_modules` が同期されていても、OS や Node の違いで不整合が出ることがあるため、**そのPCでは必ず `npm install` を実行する**ことを推奨。）

4. **環境変数（.env.local）を用意する**  
   - `.env.local` は **git に含まれない**ため、OneDrive で「このPCでだけ作ったファイル」として存在していなければ、別のPCには自動ではコピーされない。
   - **別のPCで .env.local がない場合**：  
     `.env.example` をコピーして `.env.local` を作成し、Supabase・Stripe・メール用の値（本番/テスト用のキーなど）を入力する。  
     元のPCで使っている `.env.local` の内容を、安全な方法（メモやパスワード管理ツールなど）で共有して写してもよい。
   - **OneDrive で .env.local まで同期している場合**：  
     そのまま使える。ただし、API キーなどが OneDrive 上に含まれるため、共有リンクや他PCへの共有には注意する。

5. **開発サーバーを起動**  
   ```bash
   npm run dev
   ```
   ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

**注意**  
- ビルド成果物の `.next` フォルダは、PCごとに `npm run dev` や `npm run build` で再生成される。OneDrive で同期しなくてよい（`.gitignore` に入っている）。  
- `node_modules` は容量が大きいため、OneDrive の「オンラインのみ」にしている場合は、そのPCで必ず `npm install` を実行すること。

---

## 主なコマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動（0.0.0.0 でリッスンし、同一ネットワークの他端末からもアクセス可） |
| `npm run build` | 本番用ビルド |
| `npm run start` | 本番用サーバー起動（ビルド後） |
| `npm run clean` | `.next` を削除 |
| `npm run lint` | ESLint 実行 |

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
