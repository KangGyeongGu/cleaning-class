import { describe, it, expect } from "vitest";
import {
  formatPhoneNumber,
  formatPriceWon,
  isSafeUrl,
  formatPercent,
  formatMonthDay,
} from "@/shared/lib/pure/format";

describe("formatPhoneNumber", () => {
  it("returns digits as-is when length <= 3", () => {
    expect(formatPhoneNumber("01")).toBe("01");
    expect(formatPhoneNumber("010")).toBe("010");
  });

  it("inserts one hyphen for lengths 4-7", () => {
    expect(formatPhoneNumber("0101")).toBe("010-1");
    expect(formatPhoneNumber("0101234")).toBe("010-1234");
  });

  it("inserts two hyphens for 11-digit mobile numbers", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatPhoneNumber("010-abc-1234-5678")).toBe("010-1234-5678");
    expect(formatPhoneNumber("(010) 1234.5678")).toBe("010-1234-5678");
  });

  it("truncates digits beyond 11 (4+4+3 pattern enforced)", () => {
    expect(formatPhoneNumber("010123456789")).toBe("010-1234-5678");
  });

  it("splits Seoul 02 numbers as 2-4-4 (10 digits)", () => {
    expect(formatPhoneNumber("0212345678")).toBe("02-1234-5678");
  });

  it("splits Seoul 02 numbers as 2-3-4 (9 digits)", () => {
    expect(formatPhoneNumber("021234567")).toBe("02-123-4567");
  });

  it("formats partial 02 input progressively", () => {
    expect(formatPhoneNumber("02")).toBe("02");
    expect(formatPhoneNumber("021")).toBe("02-1");
    expect(formatPhoneNumber("02123")).toBe("02-123");
  });

  it("truncates 02 digits beyond 10", () => {
    expect(formatPhoneNumber("021234567890")).toBe("02-1234-5678");
  });

  it("splits non-02 landline numbers as 3-4-4 cap (10 digits)", () => {
    expect(formatPhoneNumber("0631234567")).toBe("063-1234-567");
  });
});

describe("formatPriceWon", () => {
  it("formats positive integers with KR locale commas and trailing 원~", () => {
    expect(formatPriceWon(200000)).toBe("200,000원~");
    expect(formatPriceWon(90000)).toBe("90,000원~");
    expect(formatPriceWon(1500000)).toBe("1,500,000원~");
  });

  it("formats zero as 0원~", () => {
    expect(formatPriceWon(0)).toBe("0원~");
  });

  it("returns 현장 견적 for null input (variable pricing)", () => {
    expect(formatPriceWon(null)).toBe("현장 견적");
  });

  it("returns 현장 견적 for undefined input (defensive)", () => {
    expect(formatPriceWon(undefined as unknown as null)).toBe("현장 견적");
  });
});

describe("isSafeUrl", () => {
  it("accepts http and https URLs (case-insensitive)", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("HTTPS://example.com")).toBe(true);
  });

  it("rejects non-http(s) schemes and relative URLs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("ftp://example.com")).toBe(false);
    expect(isSafeUrl("/relative/path")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});

describe("formatPercent", () => {
  it("returns an em dash when total is zero (avoids divide-by-zero)", () => {
    expect(formatPercent(0, 0)).toBe("—");
    expect(formatPercent(5, 0)).toBe("—");
  });

  it("formats the ratio as a one-decimal percentage", () => {
    expect(formatPercent(1, 4)).toBe("25.0%");
    expect(formatPercent(1, 3)).toBe("33.3%");
    expect(formatPercent(50, 50)).toBe("100.0%");
    expect(formatPercent(0, 10)).toBe("0.0%");
  });
});

describe("formatMonthDay", () => {
  it("formats an ISO date as M/D without leading zeros", () => {
    expect(formatMonthDay("2026-06-09")).toBe("6/9");
    expect(formatMonthDay("2026-12-25")).toBe("12/25");
  });

  it("returns the input unchanged when it is not a full ISO date", () => {
    expect(formatMonthDay("2026-06")).toBe("2026-06");
    expect(formatMonthDay("bad")).toBe("bad");
  });
});
