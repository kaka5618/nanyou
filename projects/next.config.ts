import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 输出文件追踪根目录
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.tos.coze.site',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coze-coding-project.tos.coze.site',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  
  // 禁用严格模式以避免双重渲染
  reactStrictMode: true,
  
  // 超时配置
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
