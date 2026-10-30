import { describe, expect, it } from "vitest";
import {
  endOfMonth,
  offsetDate,
  isLocalHostname,
} from "@/shared/lib/pure/analytics";

describe("통계 날짜 경계", () => {
  it("연도·윤년 경계를 처리", () => {
    expect(offsetDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(endOfMonth("2024-02")).toBe("2024-02-29");
    expect(endOfMonth("2026-02")).toBe("2026-02-28");
  });
  it("로컬 주소와 운영 주소를 구분", () => {
    for (const host of [
      "localhost",
      "a.localhost",
      "::1",
      "[::1]",
      "0.0.0.0",
      "127.1.2.3",
    ])
      expect(isLocalHostname(host)).toBe(true);
    expect(isLocalHostname("www.cleaningclass.co.kr")).toBe(false);
  });
});
