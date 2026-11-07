import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 後援チラシの PDF を画像にする処理（ネイティブ部品を含むので束ねずに読み込む）
  serverExternalPackages: ["@napi-rs/canvas", "unpdf"],
  experimental: {
    // 開発時の Webpack メモリ使用を抑え、コンパイルが止まりにくくする
    webpackMemoryOptimizations: true,
    // ヤング申込の顔写真（data URL）を含む JSON 用
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
