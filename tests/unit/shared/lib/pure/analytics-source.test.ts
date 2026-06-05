import { describe, it, expect } from "vitest";
import {
  classifySource,
  extractReferrerHost,
} from "@/shared/lib/pure/analytics-source";

const HOST = "www.cleaningclass.co.kr";

describe("classifySource", () => {
  it("should classify empty referrer as direct", () => {
    expect(classifySource("", HOST)).toBe("direct");
  });

  it("should classify malformed referrer as referral", () => {
    expect(classifySource("not-a-url", HOST)).toBe("referral");
  });

  it("should classify same host as direct", () => {
    expect(classifySource(`https://${HOST}/services`, HOST)).toBe("direct");
  });

  it("should classify subdomain of own host as direct", () => {
    expect(classifySource("https://m.cleaningclass.co.kr/", HOST)).toBe(
      "direct",
    );
  });

  it("should classify google.com referrer as google", () => {
    expect(classifySource("https://www.google.com/search?q=청소", HOST)).toBe(
      "google",
    );
  });

  it("should classify google.co.kr as google", () => {
    expect(classifySource("https://www.google.co.kr/", HOST)).toBe("google");
  });

  it("should classify naver search as naver", () => {
    expect(classifySource("https://search.naver.com/search?q=", HOST)).toBe(
      "naver",
    );
  });

  it("should classify mobile naver as naver", () => {
    expect(classifySource("https://m.search.naver.com/", HOST)).toBe("naver");
  });

  it("should classify daum search as daum", () => {
    expect(classifySource("https://search.daum.net/", HOST)).toBe("daum");
  });

  it("should classify kakao as daum", () => {
    expect(classifySource("https://www.kakao.com/", HOST)).toBe("daum");
  });

  it("should classify bing as bing", () => {
    expect(classifySource("https://www.bing.com/", HOST)).toBe("bing");
  });

  it("should classify chatgpt.com as chatgpt", () => {
    expect(classifySource("https://chatgpt.com/", HOST)).toBe("chatgpt");
  });

  it("should classify openai subdomain as chatgpt", () => {
    expect(classifySource("https://chat.openai.com/", HOST)).toBe("chatgpt");
  });

  it("should classify perplexity.ai as perplexity", () => {
    expect(classifySource("https://www.perplexity.ai/", HOST)).toBe(
      "perplexity",
    );
  });

  it("should classify claude.ai as claude", () => {
    expect(classifySource("https://claude.ai/", HOST)).toBe("claude");
  });

  it("should classify anthropic.com as claude", () => {
    expect(classifySource("https://www.anthropic.com/", HOST)).toBe("claude");
  });

  it("should classify gemini.google.com as gemini (not google)", () => {
    expect(classifySource("https://gemini.google.com/", HOST)).toBe("gemini");
  });

  it("should classify instagram as instagram", () => {
    expect(classifySource("https://www.instagram.com/", HOST)).toBe(
      "instagram",
    );
  });

  it("should classify l.instagram.com as instagram", () => {
    expect(classifySource("https://l.instagram.com/", HOST)).toBe("instagram");
  });

  it("should classify facebook as facebook", () => {
    expect(classifySource("https://www.facebook.com/", HOST)).toBe("facebook");
  });

  it("should classify fb.me as facebook", () => {
    expect(classifySource("https://fb.me/abc", HOST)).toBe("facebook");
  });

  it("should classify youtube as youtube", () => {
    expect(classifySource("https://www.youtube.com/", HOST)).toBe("youtube");
  });

  it("should classify m.youtube.com as youtube", () => {
    expect(classifySource("https://m.youtube.com/", HOST)).toBe("youtube");
  });

  it("should classify daangn as daangn", () => {
    expect(classifySource("https://www.daangn.com/", HOST)).toBe("daangn");
  });

  it("should classify unknown host as referral", () => {
    expect(classifySource("https://www.unknown.com/", HOST)).toBe("referral");
  });
});

describe("extractReferrerHost", () => {
  it("should return empty string for empty referrer", () => {
    expect(extractReferrerHost("")).toBe("");
  });

  it("should return empty string for malformed URL", () => {
    expect(extractReferrerHost("not-url")).toBe("");
  });

  it("should return lowercased hostname for valid URL", () => {
    expect(extractReferrerHost("https://Search.Naver.COM/x")).toBe(
      "search.naver.com",
    );
  });
});
