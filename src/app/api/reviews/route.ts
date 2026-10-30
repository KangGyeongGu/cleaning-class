import { NextResponse } from "next/server";
import { reviewQuery } from "@/shared/lib/pure/review-pagination";
import { getPublishedReviewPage } from "@/shared/lib/queries/review-page";

export async function GET(request: Request) {
  const { filter, page } = reviewQuery(new URL(request.url).search);
  try {
    return NextResponse.json(await getPublishedReviewPage(filter, page), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[reviews] 목록 조회 실패", error);
    return NextResponse.json(
      { error: "작업 사례를 불러오지 못했습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
