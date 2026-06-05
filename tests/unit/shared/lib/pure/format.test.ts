import { describe, it, expect } from "vitest";
import { formatPhoneNumber, formatPriceWon } from "@/shared/lib/pure/format";

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
