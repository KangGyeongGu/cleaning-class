import type { Metadata } from "next";
import { Dashboard } from "@/app/admin/(protected)/dashboard/Dashboard.client";
import { getDashboardSnapshot } from "@/shared/lib/queries/dashboard";
import { dashboardRange } from "@/shared/lib/pure/dashboard";
import type { DashboardSnapshot } from "@/shared/lib/pure/dashboard";

export const metadata: Metadata = { title: "대시보드" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  let range;
  let rangeError: string | null = null;
  try {
    range = dashboardRange(params);
  } catch {
    range = dashboardRange({});
    rangeError = "올바르지 않은 조회 기간입니다. 최근 7일 통계를 표시합니다.";
  }
  let initial: DashboardSnapshot | null = null;
  let error: string | null = rangeError;
  try {
    initial = await getDashboardSnapshot(range.start, range.end);
  } catch (cause) {
    console.error("[dashboard] 초기 조회 실패", cause);
    error =
      "통계를 불러오지 못했습니다. DB 마이그레이션 적용 여부와 서버 로그를 확인해주세요.";
  }
  return (
    <Dashboard
      key={`${range.start}:${range.end}`}
      ga4ConsoleUrl={process.env.ADMIN_GA4_CONSOLE_URL}
      clarityConsoleUrl={process.env.ADMIN_CLARITY_CONSOLE_URL}
      initial={initial}
      initialError={error}
      range={range}
    />
  );
}
