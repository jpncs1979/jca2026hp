import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 開発時の Webpack メモリ使用を抑え、コンパイルが止まりにくくする
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
