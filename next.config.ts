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
