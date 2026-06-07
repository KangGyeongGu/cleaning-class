export interface PolicyVersion {
  version: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  current: boolean;
}

export const PRIVACY_VERSIONS: readonly PolicyVersion[] = [
  {
    version: "2026-06-07",
    effectiveFrom: "2026.06.07",
    current: true,
  },
  {
    version: "2026-03-23",
    effectiveFrom: "2026.03.23",
    effectiveUntil: "2026.06.06",
    current: false,
  },
] as const;

export const TERMS_VERSIONS: readonly PolicyVersion[] = [
  {
    version: "2026-06-07",
    effectiveFrom: "2026.06.07",
    current: true,
  },
  {
    version: "2026-03-23",
    effectiveFrom: "2026.03.23",
    effectiveUntil: "2026.06.06",
    current: false,
  },
] as const;

export function getCurrentPolicyVersion(
  versions: readonly PolicyVersion[],
): PolicyVersion {
  const found = versions.find((v) => v.current);
  if (!found) {
    throw new Error("정책 버전 목록에 현재 시행 버전이 없습니다");
  }
  return found;
}

export function getArchivedPolicyVersions(
  versions: readonly PolicyVersion[],
): readonly PolicyVersion[] {
  return versions.filter((v) => !v.current);
}

export function findPolicyVersion(
  versions: readonly PolicyVersion[],
  version: string,
): PolicyVersion | undefined {
  return versions.find((v) => v.version === version);
}

export function formatPolicyVersionRange(version: PolicyVersion): string {
  if (version.current) {
    return `현재 시행 (${version.effectiveFrom} ~)`;
  }
  return `${version.effectiveFrom} ~ ${version.effectiveUntil ?? ""}`;
}
