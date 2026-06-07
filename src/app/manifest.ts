import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "청소클라쓰 - 전주 청소 전문업체",
    short_name: "청소클라쓰",
    description:
      "전주 청소업체 청소클라쓰 — 전북 전주 거주청소, 입주청소, 정기청소, 특수청소, 쓰레기집청소, 상가청소 전문 서비스",
    start_url: "/",
    lang: "ko",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
