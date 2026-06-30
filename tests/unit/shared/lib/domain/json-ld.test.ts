import { describe, it, expect } from "vitest";
import {
  generateWebSiteJsonLd,
  generateLocalBusinessJsonLd,
  generateServiceJsonLd,
  generateFaqPageJsonLd,
  generateBreadcrumbListJsonLd,
  generatePriceListJsonLd,
} from "@/shared/lib/domain/json-ld";
import type { SiteConfig } from "@/shared/types/database";

const FULL_CONFIG: SiteConfig = {
  id: "c0",
  business_name: "테스트 청소",
  phone: "010-1111-2222",
  email: "x@y.com",
  blog_url: "https://blog.example.com",
  instagram_url: "https://instagram.com/x",
  site_url: "https://example.com",
  description: "",
  address_region: "서울특별시",
  address_locality: "강남구",
  updated_at: new Date().toISOString(),
  address: "",
  review_description: null,
  service_description: null,
  business_registration_number: "111-22-33333",
  representative: "대표",
  faq_description: null,
  daangn_url: "https://daangn.example.com",
  hero_image_path: null,
  moving_representative: "",
  moving_phone: "",
  moving_business_registration_number: null,
  moving_address: "",
  hero_image_path_2: null,
  hero_image_focal_x: null,
  hero_image_focal_y: null,
  hero_image_focal_x_2: null,
  hero_image_focal_y_2: null,
  customer_review_description: null,
  price_description: null,
};

describe("generateWebSiteJsonLd", () => {
  it("uses siteConfig values when provided", () => {
    const result = generateWebSiteJsonLd(FULL_CONFIG);
    expect(result.name).toBe("테스트 청소");
    expect(result.url).toBe("https://example.com");
  });

  it("falls back to defaults when siteConfig is null", () => {
    const result = generateWebSiteJsonLd(null);
    expect(result.name).toBe("청소클라쓰");
    expect(result.url).toBe("https://www.cleaningclass.co.kr");
  });

  it("falls back to defaults when siteConfig is undefined (no arg)", () => {
    const result = generateWebSiteJsonLd();
    expect(result.name).toBe("청소클라쓰");
  });
});

describe("generateLocalBusinessJsonLd", () => {
  it("includes sameAs when blog/instagram/daangn urls non-empty", () => {
    const result = generateLocalBusinessJsonLd(FULL_CONFIG);
    expect(result.sameAs).toHaveLength(3);
    expect(result.sameAs).toContain("https://blog.example.com");
  });

  it("omits sameAs when all social urls empty", () => {
    const result = generateLocalBusinessJsonLd({
      ...FULL_CONFIG,
      blog_url: "",
      instagram_url: "",
      daangn_url: "",
    });
    expect(result.sameAs).toBeUndefined();
  });

  it("filters whitespace-only urls from sameAs", () => {
    const result = generateLocalBusinessJsonLd({
      ...FULL_CONFIG,
      blog_url: "   ",
      instagram_url: "https://ig.com",
      daangn_url: "",
    });
    expect(result.sameAs).toEqual(["https://ig.com"]);
  });

  it("uses default name/url when siteConfig null", () => {
    const result = generateLocalBusinessJsonLd(null);
    expect(result.name).toBe("청소클라쓰");
    expect(result.url).toBe("https://www.cleaningclass.co.kr");
    expect(result["@id"]).toBe("https://www.cleaningclass.co.kr/#organization");
  });

  it("uses fallback region/locality when siteConfig null", () => {
    const result = generateLocalBusinessJsonLd(null);
    expect(result.address.addressRegion).toBe("전라북도");
    expect(result.address.addressLocality).toBe("전주시");
    expect(result.areaServed.name).toBe("전북 전주");
  });

  it("includes telephone from siteConfig.phone", () => {
    const result = generateLocalBusinessJsonLd(FULL_CONFIG);
    expect(result.telephone).toBe("010-1111-2222");
  });

  it("includes taxID when business_registration_number present", () => {
    const result = generateLocalBusinessJsonLd(FULL_CONFIG);
    expect(result.taxID).toBe("111-22-33333");
  });

  it("omits taxID when business_registration_number is null", () => {
    const result = generateLocalBusinessJsonLd({
      ...FULL_CONFIG,
      business_registration_number: null,
    });
    expect(result.taxID).toBeUndefined();
  });

  it("uses default siteUrl in @id when siteConfig undefined", () => {
    const result = generateLocalBusinessJsonLd();
    expect(result["@id"]).toBe("https://www.cleaningclass.co.kr/#organization");
  });
});

describe("generateServiceJsonLd", () => {
  it("maps each service to a Service JSON-LD entry", () => {
    const result = generateServiceJsonLd([
      { title: "거주청소", tags: ["원룸", "투룸"] },
      { title: "이사청소", tags: ["입주전", "퇴실"] },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].serviceType).toBe("거주청소");
    expect(result[0].description).toBe("원룸, 투룸");
  });

  it("uses provider id with default siteUrl", () => {
    const result = generateServiceJsonLd([{ title: "x", tags: [] }]);
    expect(result[0].provider["@id"]).toBe(
      "https://www.cleaningclass.co.kr/#organization",
    );
  });

  it("uses provider id with custom siteUrl", () => {
    const result = generateServiceJsonLd(
      [{ title: "x", tags: [] }],
      "https://custom.example.com",
    );
    expect(result[0].provider["@id"]).toBe(
      "https://custom.example.com/#organization",
    );
  });

  it("returns empty array for empty input", () => {
    expect(generateServiceJsonLd([])).toEqual([]);
  });

  it("handles services with empty tags (empty description)", () => {
    const result = generateServiceJsonLd([{ title: "x", tags: [] }]);
    expect(result[0].description).toBe("");
  });
});

describe("generateFaqPageJsonLd", () => {
  it("uses provided items when array non-empty", () => {
    const result = generateFaqPageJsonLd([{ question: "Q1", answer: "A1" }]);
    expect(result.mainEntity).toHaveLength(1);
    expect(result.mainEntity[0].name).toBe("Q1");
    expect(result.mainEntity[0].acceptedAnswer.text).toBe("A1");
  });

  it("falls back to default FAQ items when items undefined", () => {
    const result = generateFaqPageJsonLd();
    expect(result.mainEntity.length).toBeGreaterThanOrEqual(6);
  });

  it("falls back to default when items is empty array", () => {
    const result = generateFaqPageJsonLd([]);
    expect(result.mainEntity.length).toBeGreaterThanOrEqual(6);
  });

  it("sets schema.org context and FAQPage type", () => {
    const result = generateFaqPageJsonLd([{ question: "q", answer: "a" }]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("FAQPage");
  });
});

describe("generateBreadcrumbListJsonLd", () => {
  it("maps items with 1-based position", () => {
    const result = generateBreadcrumbListJsonLd([
      { name: "홈", url: "https://x.com/" },
      { name: "가격표", url: "https://x.com/price" },
    ]);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
    expect(result.itemListElement[1].name).toBe("가격표");
  });

  it("returns empty itemListElement for empty input", () => {
    const result = generateBreadcrumbListJsonLd([]);
    expect(result.itemListElement).toEqual([]);
  });
});

describe("generatePriceListJsonLd", () => {
  it("formats integer price_won with 원~ suffix", () => {
    const result = generatePriceListJsonLd([
      { name: "거주청소", price_won: 200000 },
    ]);
    expect(result.itemListElement[0].description).toBe("200,000원~");
    expect(result.itemListElement[0].position).toBe(1);
  });

  it("replaces null price_won with '현장 견적'", () => {
    const result = generatePriceListJsonLd([{ name: "특수", price_won: null }]);
    expect(result.itemListElement[0].description).toBe("현장 견적");
  });

  it("handles mixed array (numeric + null)", () => {
    const result = generatePriceListJsonLd([
      { name: "a", price_won: 50000 },
      { name: "b", price_won: null },
      { name: "c", price_won: 100000 },
    ]);
    expect(result.itemListElement.map((e) => e.description)).toEqual([
      "50,000원~",
      "현장 견적",
      "100,000원~",
    ]);
  });

  it("returns empty itemListElement for empty input", () => {
    const result = generatePriceListJsonLd([]);
    expect(result.itemListElement).toEqual([]);
  });
});
