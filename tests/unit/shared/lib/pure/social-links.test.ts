import { describe, expect, it } from "vitest";
import { getSocialLinks } from "@/shared/lib/pure/social-links";

describe("공통 SNS 링크 정보", () => {
  it("설정이 없거나 주소가 비어 있으면 링크를 만들지 않음", () => {
    expect(getSocialLinks()).toEqual([]);
    expect(getSocialLinks(null)).toEqual([]);
    expect(getSocialLinks({ blog_url: "  ", cafe_url: "" })).toEqual([]);
  });

  it("DB 주소를 공백 제거 후 블로그·카페·인스타그램·당근 순서로 반환", () => {
    const links = getSocialLinks({
      daangn_url: "https://www.daangn.com/example",
      instagram_url: "https://www.instagram.com/example",
      cafe_url: " https://cafe.naver.com/example ",
      blog_url: "https://blog.naver.com/example",
    });
    expect(links.map(({ platform }) => platform)).toEqual([
      "naver_blog",
      "naver_cafe",
      "instagram",
      "daangn",
    ]);
    expect(links[1].href).toBe("https://cafe.naver.com/example");
    expect(links.map(({ accessibleLabel }) => accessibleLabel)).toEqual([
      "네이버 블로그",
      "네이버 카페",
      "인스타그램",
      "당근",
    ]);
  });
});
