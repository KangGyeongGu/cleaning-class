import { NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { isSearchBot } from "@/shared/lib/analytics-server";
import { trackRequestSchema } from "@/shared/lib/analytics-schema";

export async function POST(request: Request): Promise<NextResponse> {
  if (isSearchBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = trackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const supabase = await createClient();
  await supabase.from("analytics_events").insert({
    event_type: parsed.data.event_type,
    event_payload: parsed.data.event_payload,
    path: parsed.data.path,
  });

  return new NextResponse(null, { status: 204 });
}
