import { describe, it, expect } from "vitest";
import { isSearchBot } from "@/shared/lib/analytics-server";

describe("isSearchBot", () => {
  it("should return false for null UA", () => {
    expect(isSearchBot(null)).toBe(false);
  });

  it("should return false for empty UA", () => {
    expect(isSearchBot("")).toBe(false);
  });

  it("should detect Googlebot", () => {
    expect(
      isSearchBot(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      ),
    ).toBe(true);
  });

  it("should detect bingbot", () => {
    expect(isSearchBot("Mozilla/5.0 (compatible; bingbot/2.0; ...)")).toBe(
      true,
    );
  });

  it("should detect Yeti (Naver)", () => {
    expect(isSearchBot("Mozilla/5.0 (compatible; Yeti/1.1; ...)")).toBe(true);
  });

  it("should detect DuckDuckBot", () => {
    expect(
      isSearchBot("DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)"),
    ).toBe(true);
  });

  it("should detect YandexBot", () => {
    expect(isSearchBot("Mozilla/5.0 (compatible; YandexBot/3.0)")).toBe(true);
  });

  it("should detect Baiduspider", () => {
    expect(isSearchBot("Mozilla/5.0 (compatible; Baiduspider/2.0)")).toBe(true);
  });

  it("should detect Applebot", () => {
    expect(isSearchBot("Mozilla/5.0 (compatible; Applebot/0.1)")).toBe(true);
  });

  it("should detect facebookexternalhit", () => {
    expect(isSearchBot("facebookexternalhit/1.1")).toBe(true);
  });

  it("should not detect normal Chrome", () => {
    expect(
      isSearchBot(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
      ),
    ).toBe(false);
  });
});
