/**
 * 新しいPCでプロジェクトを開いたとき用のセットアップ
 * （OneDriveで移したフォルダや clone 直後）
 * 実行: npm run setup
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const envLocal = path.join(root, ".env.local");
const envExample = path.join(root, ".env.example");
const nextDir = path.join(root, ".next");

process.chdir(root);

// 1. .env.local がなければ .env.example からコピー
if (!fs.existsSync(envLocal)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envLocal);
    console.log("[setup] .env.local を作成しました（.env.example をコピー）。");
    console.log("        Supabase などの値を .env.local に記入してください。");
  } else {
    console.log("[setup] .env.example が見つかりません。.env.local を手動で作成してください。");
  }
} else {
  console.log("[setup] .env.local は既にあります。そのまま利用します。");
}

// 2. .next があれば削除（別PCのビルドキャッシュを捨てる）
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true });
    console.log("[setup] .next を削除しました（新しいPC用にクリーンな状態にしました）。");
  } catch (e) {
    if (e.code === "EPERM" || e.message.includes("EBUSY")) {
      console.log("[setup] .next は使用中のためスキップしました。npm run dev を止めてから再度 npm run setup を実行するか、手動で .next を削除してください。");
    } else {
      throw e;
    }
  }
}

// 3. 依存関係をインストール（このPC用の node_modules）
console.log("[setup] npm install を実行しています...");
execSync("npm install", { stdio: "inherit", cwd: root });
console.log("[setup] 完了しました。開発を始めるには: npm run dev");
console.log("        .env.local を初めて作成した場合は、中身を編集してから npm run dev を実行してください。");
