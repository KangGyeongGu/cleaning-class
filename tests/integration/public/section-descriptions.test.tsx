import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ServicesPage from "@/app/(public)/services/page";
import ReviewsPage from "@/app/(public)/reviews/page";
import { Services } from "@/components/service/Services";
import { BlogReviewsSection } from "@/components/review/BlogReviewsSection";
import {
  DEFAULT_SERVICE_DESCRIPTION,
  DEFAULT_REVIEW_DESCRIPTION,
} from "@/shared/lib/pure/constants";

const mocks = vi.hoisted(() => ({ config: vi.fn() }));
vi.mock("@/shared/lib/queries/site-config", () => ({
  getSiteConfig: mocks.config,
}));
vi.mock("@/shared/lib/queries/service", () => ({
  getPublishedServicesWithImageUrls: async (category?: string) =>
    category ? [] : [{ category: "cleaning" }],
}));
vi.mock("@/shared/lib/queries/review", () => ({
  getAllPublishedReviews: async () => [],
  getHomeReviewData: async () => ({
    counts: { all: 1 },
    reviews: [
      {
        id: "review-1",
        title: "작업 기록",
        summary: "작업 소개",
        tags: ["거주청소"],
        image_path: "review.png",
        link_url: "",
        created_at: "2026-10-01T00:00:00Z",
      },
    ],
  }),
}));
vi.mock("@/shared/lib/supabase/storage", () => ({
  getReviewImageUrl: () => "data:image/png;base64,iVBORw0KGgo=",
}));
vi.mock("@/shared/lib/domain/json-ld", () => ({
  generateBreadcrumbListJsonLd: () => ({}),
  generateServiceJsonLd: () => ({}),
}));
vi.mock("@/components/service/ServiceGrid.client", () => ({
  ServiceGrid: () => null,
}));
vi.mock("@/app/(public)/reviews/ReviewsPageClient.client", () => ({
  ReviewsPageClient: () => null,
}));

beforeEach(() => vi.resetAllMocks());
function text(element: React.ReactNode) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container.textContent;
}

describe("관리자 소개 문구의 공개 화면 반영", () => {
  it("서비스 안내는 메인 섹션과 서비스 페이지에 같은 저장값을 표시", async () => {
    mocks.config.mockResolvedValue({
      service_description: "  서비스 안내 첫줄\n둘째줄  ",
    });
    expect(text(await Services())).toContain("서비스 안내 첫줄\n둘째줄");
    expect(text(await ServicesPage())).toContain("서비스 안내 첫줄\n둘째줄");
    expect(text(await ServicesPage())).not.toContain(
      "청소클라쓰가 깔끔하게 처리합니다.",
    );
  });
  it("작업 사례 안내는 메인 섹션과 작업 사례 페이지에 같은 저장값을 표시", async () => {
    mocks.config.mockResolvedValue({
      review_description: "  관리자가 저장한 작업 사례 안내  ",
    });
    expect(text(await BlogReviewsSection())).toContain(
      "관리자가 저장한 작업 사례 안내",
    );
    expect(text(await ReviewsPage())).toContain(
      "관리자가 저장한 작업 사례 안내",
    );
    expect(text(await ReviewsPage())).not.toContain(
      "청소 전후의 변화를 사진과 함께 기록합니다.",
    );
  });
  it.each([
    null,
    { service_description: null, review_description: null },
    { service_description: " \n ", review_description: " \n " },
  ])(
    "빈 문구와 설정 조회 실패 시 두 화면의 기본 문구도 동일",
    async (config) => {
      mocks.config.mockResolvedValue(config);
      expect(text(await Services())).toContain(DEFAULT_SERVICE_DESCRIPTION);
      expect(text(await ServicesPage())).toContain(DEFAULT_SERVICE_DESCRIPTION);
      expect(text(await BlogReviewsSection())).toContain(
        DEFAULT_REVIEW_DESCRIPTION,
      );
      expect(text(await ReviewsPage())).toContain(DEFAULT_REVIEW_DESCRIPTION);
    },
  );
});
