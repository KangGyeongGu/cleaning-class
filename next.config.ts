/**
 * @file next.config.ts
 * @description Next.js 배포 출력·요청 크기·HTTP 헤더·이미지 최적화 정책 정의
 * @activation 앱 실행: npm run dev, npm run build, npm run start, standalone 배포
 * @activation 검사·배포: E2E·Lighthouse 서버 준비, /cut-release 빌드, Docker 빌드
 * @activation Git Hook: Next.js 빌드 실행 없음
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["172.30.1.81"],
  async headers() {
    return [
      {
        source: "/opengraph-image",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "150mb",
    },
  },
  images: {
    localPatterns: [{ pathname: "/images/**" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gezvfabmalvpnumewwgu.supabase.co",
        pathname: "/storage/v1/object/public/hero-images/**",
      },
      {
        protocol: "https",
        hostname: "gezvfabmalvpnumewwgu.supabase.co",
        pathname: "/storage/v1/object/public/service-images/**",
      },
      {
        protocol: "https",
        hostname: "gezvfabmalvpnumewwgu.supabase.co",
        pathname: "/storage/v1/object/public/review-images/**",
      },
    ],
    deviceSizes: [390, 430, 640, 750, 828, 1080, 1200, 1920],
    qualities: [75, 85, 100],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
