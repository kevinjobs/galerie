import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL("https://gallery-1252473272.cos.ap-nanjing.myqcloud.com/**"),
    ], // 在这里添加你的图片域名
  },
};

export default nextConfig;
