import "@/app/globals.css";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SocialLinks } from "@/components/social/SocialLinks.client";

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/shared/lib/infra/track", () => ({
  track: mocks.track,
  currentPath: () => "/reviews",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const urls = {
  blog_url: "https://blog.naver.com/example",
  cafe_url: "https://cafe.naver.com/example",
  instagram_url: "https://instagram.com/example",
  daangn_url: "https://www.daangn.com/example",
};

describe("공통 SNS 표시와 클릭 기록", () => {
  it.each(["navbar", "footer", "reviews_section", "contact_aside"] as const)(
    "%s에서도 같은 순서·주소·아이콘을 사용하고 클릭은 한 번 기록",
    (location) => {
      const onClick = vi.fn();
      const content = (
        <SocialLinks urls={urls} location={location} onClick={onClick} />
      );
      render(location === "footer" ? <ul>{content}</ul> : <div>{content}</div>);
      const links = screen.getAllByRole("link");
      expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
        "네이버 블로그",
        "네이버 카페",
        "인스타그램",
        "당근",
      ]);
      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        Object.values(urls),
      );
      for (const link of links) {
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        expect(link.querySelectorAll("svg")).toHaveLength(1);
      }
      links[1].addEventListener("click", (event) => event.preventDefault());
      fireEvent.click(links[1]);
      expect(mocks.track).toHaveBeenCalledExactlyOnceWith({
        event_type: "sns_click",
        event_payload: { sns_platform: "naver_cafe", click_location: location },
        path: "/reviews",
      });
      expect(onClick).toHaveBeenCalledOnce();
    },
  );

  it("숨겨진 모바일 메뉴에서는 탭 이동을 제외하며 빈 URL은 표시하지 않음", () => {
    render(
      <SocialLinks
        urls={{ blog_url: " ", cafe_url: urls.cafe_url }}
        location="navbar"
        tabIndex={-1}
        size={24}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0].tabIndex).toBe(-1);
    expect(links[0].querySelector("svg")?.getAttribute("width")).toBe("24");
    expect(screen.getByText("네이버 카페").getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
