import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { isSearchBot } from "@/shared/lib/infra/analytics-server";
import { trackRequestSchema } from "@/shared/lib/schema/analytics";

export async function POST(request: Request): Promise<NextResponse> {
  if (isSearchBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
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

  const supabase = await createClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_type: parsed.data.event_type,
    event_payload: parsed.data.event_payload,
    path: parsed.data.path,
  });
  if (error) {
    console.error("[POST /api/track] insert failed", error);
  }

  return new NextResponse(null, { status: 204 });
}
