import { createAnalyticsClient } from "@/shared/lib/server/analytics-client";
import { shouldRecordAnalytics } from "@/shared/lib/server/analytics-request";
import { dailyVisitor } from "@/shared/lib/server/analytics-visitor";
import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { isSearchBot } from "@/shared/lib/infra/analytics-server";
import { trackRequestSchema } from "@/shared/lib/schema/analytics";
import { checkRateLimit } from "@/shared/lib/server/rate-limit";

const TRACK_RATE_LIMIT = 60;
const TRACK_RATE_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<NextResponse> {
  if (!shouldRecordAnalytics(request.headers))
    return new NextResponse(null, { status: 204 });
  if (isSearchBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`track:${ip}`, TRACK_RATE_LIMIT, TRACK_RATE_WINDOW_MS)) {
    return new NextResponse(null, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn("[POST /api/track] invalid JSON body");
    return new NextResponse(null, { status: 400 });
  }

  const parsed = trackRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[POST /api/track] schema validation failed", parsed.error);
    return new NextResponse(null, { status: 400 });
  }

  if (parsed.data.path.startsWith("/admin"))
    return new NextResponse(null, { status: 204 });
  if (parsed.data.event_type === "quote_form_success")
    return new NextResponse(null, { status: 204 });
  if (parsed.data.event_type === "page_landing") {
    try {
      const visitor = dailyVisitor(request.headers);
      const { error } = await createAnalyticsClient().rpc(
        "record_daily_visitor",
        {
          p_key: visitor.key,
          p_date: visitor.date,
        },
      );
      if (error) throw new Error(error.code);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("[analytics] 방문 기록 실패", error);
      return new NextResponse(null, { status: 503 });
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_type: parsed.data.event_type,
    event_payload: parsed.data.event_payload,
    path: parsed.data.path,
  });
  if (error) {
    console.error("[POST /api/track] insert failed", error);
  }

  return new NextResponse(null, { status: error ? 503 : 204 });
}
