import { describe, it, expect } from "vitest";
import {
  contactFormSchema,
  loginFormSchema,
  reviewFormSchema,
  reviewListSortSchema,
  priceItemFormSchema,
  publicReviewFormSchema,
  faqFormSchema,
  siteConfigFormSchema,
  movingSiteConfigSchema,
  serviceFormSchema,
} from "@/shared/lib/schema/index";

describe("contactFormSchema", () => {
  it("accepts valid cleaning inquiry", () => {
    const result = contactFormSchema.safeParse({
      inquiryType: "cleaning",
      name: "홍길동",
      phone: "010-1234-5678",
      serviceType: "거주청소",
      region: "전주시",
      message: "거주 청소 견적 문의드립니다.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-digit/hyphen characters in phone", () => {
    const result = contactFormSchema.safeParse({
      inquiryType: "cleaning",
      name: "홍길동",
      phone: "010-abcd-5678",
      serviceType: "거주청소",
      region: "전주시",
      message: "테스트",
    });
    expect(result.success).toBe(false);
  });

  it("requires departure/destination to be optional for moving", () => {
    const result = contactFormSchema.safeParse({
      inquiryType: "moving",
      name: "홍길동",
      phone: "010-1234-5678",
      serviceType: "원룸이사",
      message: "이사 문의",
    });
    expect(result.success).toBe(true);
  });

  it("rejects message longer than 1000 chars", () => {
    const result = contactFormSchema.safeParse({
      inquiryType: "cleaning",
      name: "홍길동",
      phone: "010-1234-5678",
      serviceType: "거주청소",
      region: "전주시",
      message: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("loginFormSchema", () => {
  it("accepts valid email + password (>=6 chars)", () => {
    const result = loginFormSchema.safeParse({
      email: "admin@example.com",
      password: "abcdef",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = loginFormSchema.safeParse({
      email: "not-an-email",
      password: "abcdef",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 chars", () => {
    const result = loginFormSchema.safeParse({
      email: "admin@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewFormSchema", () => {
  it("accepts valid review form", () => {
    const result = reviewFormSchema.safeParse({
      title: "거주 청소 후기",
      summary: "깔끔하게 처리해주셨습니다.",
      tags: ["거주청소"],
      link_url: "https://blog.example.com/post/1",
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one tag", () => {
    const result = reviewFormSchema.safeParse({
      title: "후기",
      summary: "후기 내용",
      tags: [],
      is_published: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects link_url that is not http/https", () => {
    const result = reviewFormSchema.safeParse({
      title: "후기",
      summary: "후기 내용",
      tags: ["거주청소"],
      link_url: "ftp://example.com/post",
      is_published: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewListSortSchema", () => {
  it("accepts 'latest' and 'oldest'", () => {
    expect(reviewListSortSchema.parse("latest")).toBe("latest");
    expect(reviewListSortSchema.parse("oldest")).toBe("oldest");
  });

  it("falls back to 'latest' on invalid input via .catch", () => {
    expect(reviewListSortSchema.parse("invalid")).toBe("latest");
    expect(reviewListSortSchema.parse(undefined)).toBe("latest");
    expect(reviewListSortSchema.parse(123)).toBe("latest");
  });
});

describe("priceItemFormSchema", () => {
  it("accepts valid integer price + sort_order", () => {
    const result = priceItemFormSchema.safeParse({
      name: "거주청소",
      price_won: 200000,
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null price_won (variable pricing)", () => {
    const result = priceItemFormSchema.safeParse({
      name: "현장 견적 항목",
      price_won: null,
      sort_order: 5,
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer price", () => {
    const result = priceItemFormSchema.safeParse({
      name: "거주청소",
      price_won: 200000.5,
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects price exceeding 99,999,999", () => {
    const result = priceItemFormSchema.safeParse({
      name: "거주청소",
      price_won: 100000000,
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = priceItemFormSchema.safeParse({
      name: "",
      price_won: 200000,
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("publicReviewFormSchema", () => {
  it("accepts valid rating + comment", () => {
    const result = publicReviewFormSchema.safeParse({
      rating: 4.5,
      comment: "만족합니다.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating outside [1, 5]", () => {
    expect(
      publicReviewFormSchema.safeParse({ rating: 0.5, comment: "x" }).success,
    ).toBe(false);
    expect(
      publicReviewFormSchema.safeParse({ rating: 5.5, comment: "x" }).success,
    ).toBe(false);
  });

  it("rejects non-0.5-step rating", () => {
    const result = publicReviewFormSchema.safeParse({
      rating: 4.3,
      comment: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects comment over 500 chars", () => {
    const result = publicReviewFormSchema.safeParse({
      rating: 5,
      comment: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("faqFormSchema", () => {
  it("accepts valid FAQ entry", () => {
    const result = faqFormSchema.safeParse({
      question: "결제는 어떻게 하나요?",
      answer: "계좌이체 또는 현금으로 가능합니다.",
      display_order: 0,
      is_active: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects question over 300 chars", () => {
    const result = faqFormSchema.safeParse({
      question: "x".repeat(301),
      answer: "답변",
      display_order: 0,
      is_active: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative display_order", () => {
    const result = faqFormSchema.safeParse({
      question: "질문",
      answer: "답변",
      display_order: -1,
      is_active: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("siteConfigFormSchema", () => {
  function base() {
    return {
      business_name: "청소클라쓰",
      representative: "홍길동",
      business_registration_number: "000-00-00000",
      phone: "010-1234-5678",
      email: "a@b.com",
      blog_url: "",
      instagram_url: "",
      daangn_url: "",
      site_url: "https://example.com",
      description: "",
      address_region: "",
      address_locality: "",
      address: "",
    };
  }

  it("accepts valid config", () => {
    expect(siteConfigFormSchema.safeParse(base()).success).toBe(true);
  });

  it("rejects URL not starting with http(s) via refine", () => {
    expect(
      siteConfigFormSchema.safeParse({
        ...base(),
        blog_url: "ftp://example.com/",
      }).success,
    ).toBe(false);
  });

  it("rejects malformed business_registration_number", () => {
    expect(
      siteConfigFormSchema.safeParse({
        ...base(),
        business_registration_number: "12-3",
      }).success,
    ).toBe(false);
  });

  it("rejects bad phone format", () => {
    expect(
      siteConfigFormSchema.safeParse({ ...base(), phone: "00-1-2" }).success,
    ).toBe(false);
  });
});

describe("movingSiteConfigSchema", () => {
  it("accepts empty defaults", () => {
    expect(movingSiteConfigSchema.safeParse({}).success).toBe(true);
  });

  it("rejects bad phone format", () => {
    expect(
      movingSiteConfigSchema.safeParse({ moving_phone: "bad" }).success,
    ).toBe(false);
  });

  it("rejects bad business_registration_number", () => {
    expect(
      movingSiteConfigSchema.safeParse({
        moving_business_registration_number: "bad",
      }).success,
    ).toBe(false);
  });
});

describe("serviceFormSchema", () => {
  it("accepts minimal valid input", () => {
    const result = serviceFormSchema.safeParse({
      title: "거주청소",
      category: "cleaning",
      tags: ["깔끔"],
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty tags", () => {
    const result = serviceFormSchema.safeParse({
      title: "거주청소",
      category: "cleaning",
      tags: [],
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = serviceFormSchema.safeParse({
      title: "거주청소",
      category: "wrong",
      tags: ["t"],
      sort_order: 0,
      is_published: true,
    });
    expect(result.success).toBe(false);
  });
});
