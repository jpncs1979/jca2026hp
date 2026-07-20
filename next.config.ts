import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
