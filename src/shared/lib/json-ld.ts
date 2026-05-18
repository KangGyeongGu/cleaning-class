import type { SiteConfig } from "@/shared/types/database";

const BUSINESS_STREET_ADDRESS = "전북 전주시 덕진구 우아8길 11";
const BUSINESS_POSTAL_CODE = "54908";
const BUSINESS_LATITUDE = 35.850913;
const BUSINESS_LONGITUDE = 127.157065;

interface WebSiteJsonLd {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
}

interface GeoCoordinates {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
}

interface OpeningHoursSpecification {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

interface LocalBusinessJsonLd {
  "@context": "https://schema.org";
  "@type": ["CleaningService", "MovingCompany", "LocalBusiness"];
  "@id": string;
  name: string;
  description: string;
  url: string;
  telephone?: string;
  taxID?: string;
  image?: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    postalCode: string;
    addressRegion: string;
    addressLocality: string;
    addressCountry: string;
  };
  geo: GeoCoordinates;
  openingHoursSpecification: OpeningHoursSpecification[];
  areaServed: {
    "@type": "Place";
    name: string;
  };
  serviceType: string[];
  priceRange: string;
  sameAs?: string[];
}

interface ServiceInput {
  title: string;
  tags: string[];
}

interface ServiceJsonLd {
  "@context": "https://schema.org";
  "@type": "Service";
  serviceType: string;
  name: string;
  description: string;
  provider: {
    "@id": string;
  };
}

interface QuestionItem {
  question: string;
  answer: string;
}

interface FaqPageJsonLd {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbListJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

export function generateWebSiteJsonLd(
  siteConfig?: SiteConfig | null,
): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig?.business_name ?? "청소클라쓰",
    url: siteConfig?.site_url ?? "https://www.cleaningclass.co.kr",
  };
}

export function generateLocalBusinessJsonLd(
  siteConfig?: SiteConfig | null,
): LocalBusinessJsonLd {
  const siteUrl = siteConfig?.site_url ?? "https://www.cleaningclass.co.kr";

  const sameAs = [
    siteConfig?.blog_url,
    siteConfig?.instagram_url,
    siteConfig?.daangn_url,
  ].filter(
    (url): url is string => typeof url === "string" && url.trim() !== "",
  );

  return {
    "@context": "https://schema.org",
    "@type": ["CleaningService", "MovingCompany", "LocalBusiness"],
    "@id": `${siteUrl}/#organization`,
    name: siteConfig?.business_name ?? "청소클라쓰",
    description:
      "전주 청소·이사업체 청소클라쓰 — 전북 전주 거주청소, 입주청소, 정기청소, 이사청소, 특수청소, 상가청소 전문",
    url: siteUrl,
    telephone: siteConfig?.phone,
    taxID: siteConfig?.business_registration_number ?? undefined,
    image: "https://www.cleaningclass.co.kr/opengraph-image",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_STREET_ADDRESS,
      postalCode: BUSINESS_POSTAL_CODE,
      addressRegion: siteConfig?.address_region ?? "전라북도",
      addressLocality: siteConfig?.address_locality ?? "전주시",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_LATITUDE,
      longitude: BUSINESS_LONGITUDE,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    areaServed: {
      "@type": "Place",
      name: `${siteConfig?.address_region ?? "전북"} ${siteConfig?.address_locality ?? "전주"}`,
    },
    serviceType: [
      "거주청소",
      "입주청소",
      "정기청소",
      "특수청소",
      "쓰레기집청소",
      "상가청소",
      "이사청소",
      "이사",
      "원룸이사",
      "일반이사",
      "반포장이사",
      "포장이사",
      "부분이사",
    ],
    priceRange: "$$",
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function generateServiceJsonLd(
  services: ServiceInput[],
  siteUrl = "https://www.cleaningclass.co.kr",
): ServiceJsonLd[] {
  return services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    name: service.title,
    description: service.tags.join(", "),
    provider: {
      "@id": `${siteUrl}/#organization`,
    },
  }));
}

const DEFAULT_FAQ_ITEMS: QuestionItem[] = [
  {
    question: "청소 예약은 어떻게 하나요?",
    answer:
      "전화 또는 홈페이지 상담 신청 폼을 통해 문의해 주시면 됩니다. 희망 날짜, 주소, 평형, 서비스 종류를 알려주시면 빠르게 일정을 잡아 드립니다.",
  },
  {
    question: "서비스 가능 지역은 어디인가요?",
    answer:
      "전북 전주시를 중심으로 완주군, 익산시, 군산시 등 전라북도 전역에서 출장비 없이 방문 견적 및 서비스를 제공합니다.",
  },
  {
    question: "결제 방법은 어떻게 되나요?",
    answer:
      "현금 및 계좌이체로 결제 가능합니다. 작업 완료 후 결제를 진행하며, 세금계산서 및 현금영수증 발급 가능합니다.",
  },
  {
    question: "일반청소와 정기청소의 차이는 무엇인가요?",
    answer:
      "일반(거주)청소는 1회성 방문 청소이고, 정기청소는 주 1회·격주·월 1회 등 정해진 주기로 방문하는 서비스입니다.",
  },
  {
    question: "쓰레기집(특수청소)도 가능한가요?",
    answer:
      "네, 쓰레기집 정리, 폐기물 처리, 방역·소독 등 특수청소도 전문적으로 처리합니다. 현장 상태에 따라 맞춤 견적을 제공하오니 사진과 함께 문의해 주시면 더 정확한 안내가 가능합니다.",
  },
  {
    question: "이사 서비스도 제공하나요?",
    answer:
      "네, 원룸이사, 일반이사, 반포장이사, 포장이사, 부분이사 등 다양한 이사 서비스를 제공합니다. 이사와 청소를 함께 의뢰하시면 한 번에 처리해 드립니다.",
  },
];

export function generateFaqPageJsonLd(items?: QuestionItem[]): FaqPageJsonLd {
  const allItems = items && items.length > 0 ? items : DEFAULT_FAQ_ITEMS;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function generateBreadcrumbListJsonLd(
  items: BreadcrumbItem[],
): BreadcrumbListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface PriceItemInput {
  name: string;
  price_won: number | null;
}

interface ItemListJsonLd {
  "@context": "https://schema.org";
  "@type": "ItemList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    description: string;
  }[];
}

export function generatePriceListJsonLd(
  items: PriceItemInput[],
): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      description:
        item.price_won == null
          ? "현장 견적"
          : `${item.price_won.toLocaleString("ko-KR")}원~`,
    })),
  };
}
