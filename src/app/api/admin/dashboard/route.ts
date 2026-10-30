import { NextResponse } from "next/server";
import { getUser } from "@/shared/lib/supabase/auth";
import { getDashboardSnapshot } from "@/shared/lib/queries/dashboard";
import { dashboardRange } from "@/shared/lib/pure/dashboard";

export async function GET(request: Request) {
  try {
    await getUser();
  } catch {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }
  const params = new URL(request.url).searchParams;
  let range;
  try {
    range = dashboardRange({
      start: params.get("start") ?? undefined,
      end: params.get("end") ?? undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "최근 6개월 이내의 올바른 조회 기간을 선택해주세요." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await getDashboardSnapshot(range.start, range.end),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[dashboard] 조회 실패", error);
    return NextResponse.json(
      {
        error:
          "통계를 불러오지 못했습니다. DB 마이그레이션 적용 여부와 서버 로그를 확인해주세요.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
