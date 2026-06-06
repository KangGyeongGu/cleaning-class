import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider.client";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  generateBreadcrumbListJsonLd,
  generateLocalBusinessJsonLd,
  generateWebSiteJsonLd,
} from "@/shared/lib/domain/json-ld";
import { getSiteConfig } from "@/shared/lib/domain/site-config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cleaningclass.co.kr"),
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "p_YMbf0LS_UF1H8XHrmiIYuU-qCfd4oCj6ue9YuY_Us",
    other: {
      "naver-site-verification": "45ce00e5f1089bd5d453dbd58132b37ed916ad3f",
    },
  },
  title: {
    default: "청소클라쓰",
    template: "%s | 청소클라쓰",
  },
  description:
    "전주 청소·이사업체 청소클라쓰 — 전북 전주 거주청소, 입주청소, 정기청소, 이사청소, 특수청소, 상가청소 전문",
  keywords: [
    "전주 청소업체",
    "전주 입주청소",
    "전북 거주청소",
    "전북 정기청소",
    "전북 특수청소",
    "전북 쓰레기집청소",
    "전주 상가청소",
    "전북 청소",
    "전주 청소",
    "전주 이사",
    "전북 이사업체",
    "이사청소",
    "원룸이사",
    "포장이사",
    "반포장이사",
    "전주 원룸이사",
    "전주 포장이사",
    "청소클라쓰",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://www.cleaningclass.co.kr",
    siteName: "청소클라쓰",
    title: "청소클라쓰",
    description:
      "전주 청소·이사업체 청소클라쓰 — 거주청소, 입주청소, 정기청소, 이사청소, 특수청소, 상가청소",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "청소클라쓰 — 전북 전주 전문 청소·이사 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "청소클라쓰",
    description:
      "전주 청소·이사업체 청소클라쓰 — 거주청소, 입주청소, 정기청소, 이사청소, 특수청소, 상가청소",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "청소클라쓰",
  },
  alternates: {
    canonical: "https://www.cleaningclass.co.kr",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();
  const jsonLd = generateLocalBusinessJsonLd(siteConfig);
  const webSiteJsonLd = generateWebSiteJsonLd(siteConfig);
  const breadcrumbListJsonLd = generateBreadcrumbListJsonLd([
    { name: "홈", url: "https://www.cleaningclass.co.kr" },
  ]);

  return (
    <html lang="ko" className="relative">
      <head>
        <link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
      </head>
      <body className="relative font-sans antialiased">
        <JsonLdScript data={jsonLd} />
        <JsonLdScript data={webSiteJsonLd} />
        <JsonLdScript data={breadcrumbListJsonLd} />

        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
