import { describe, it, expect } from "vitest";
import {
  PRIVACY_VERSIONS,
  TERMS_VERSIONS,
  getCurrentPolicyVersion,
  getArchivedPolicyVersions,
  findPolicyVersion,
  formatPolicyVersionRange,
  type PolicyVersion,
} from "@/shared/lib/domain/policy-versions";

describe("PRIVACY_VERSIONS / TERMS_VERSIONS", () => {
  it("PRIVACY_VERSIONS 가 비어있지 않고 current 가 정확히 1개", () => {
    expect(PRIVACY_VERSIONS.length).toBeGreaterThan(0);
    expect(PRIVACY_VERSIONS.filter((v) => v.current)).toHaveLength(1);
  });

  it("TERMS_VERSIONS 가 비어있지 않고 current 가 정확히 1개", () => {
    expect(TERMS_VERSIONS.length).toBeGreaterThan(0);
    expect(TERMS_VERSIONS.filter((v) => v.current)).toHaveLength(1);
  });
});

describe("getCurrentPolicyVersion", () => {
  it("current=true 인 버전을 반환", () => {
    const v = getCurrentPolicyVersion(PRIVACY_VERSIONS);
    expect(v.current).toBe(true);
  });

  it("current 가 없으면 예외", () => {
    const noCurrent: PolicyVersion[] = [
      { version: "2025-01-01", effectiveFrom: "2025.01.01", current: false },
    ];
    expect(() => getCurrentPolicyVersion(noCurrent)).toThrow();
  });
});

describe("getArchivedPolicyVersions", () => {
  it("current=false 인 버전만 반환", () => {
    const archived = getArchivedPolicyVersions(PRIVACY_VERSIONS);
    expect(archived.every((v) => !v.current)).toBe(true);
  });

  it("아카이브 없는 경우 빈 배열", () => {
    const onlyCurrent: PolicyVersion[] = [
      { version: "2026-06-07", effectiveFrom: "2026.06.07", current: true },
    ];
    expect(getArchivedPolicyVersions(onlyCurrent)).toEqual([]);
  });
});

describe("findPolicyVersion", () => {
  it("매치되는 버전 반환", () => {
    const result = findPolicyVersion(PRIVACY_VERSIONS, "2026-06-07");
    expect(result?.version).toBe("2026-06-07");
  });

  it("매치 없으면 undefined", () => {
    const result = findPolicyVersion(PRIVACY_VERSIONS, "1999-01-01");
    expect(result).toBeUndefined();
  });
});

describe("formatPolicyVersionRange", () => {
  it("current 버전은 '현재 시행' 포함", () => {
    const v: PolicyVersion = {
      version: "2026-06-07",
      effectiveFrom: "2026.06.07",
      current: true,
    };
    expect(formatPolicyVersionRange(v)).toContain("현재 시행");
    expect(formatPolicyVersionRange(v)).toContain("2026.06.07");
  });

  it("아카이브 버전은 시작·종료일 표시", () => {
    const v: PolicyVersion = {
      version: "2026-03-23",
      effectiveFrom: "2026.03.23",
      effectiveUntil: "2026.06.06",
      current: false,
    };
    const formatted = formatPolicyVersionRange(v);
    expect(formatted).toContain("2026.03.23");
    expect(formatted).toContain("2026.06.06");
  });

  it("effectiveUntil 누락 시 빈 문자열로 fallback", () => {
    const v: PolicyVersion = {
      version: "2026-01-01",
      effectiveFrom: "2026.01.01",
      current: false,
    };
    const formatted = formatPolicyVersionRange(v);
    expect(formatted).toContain("2026.01.01");
  });
});
