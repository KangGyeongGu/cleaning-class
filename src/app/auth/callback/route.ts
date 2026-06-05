import { createClient } from "@/shared/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_NEXT_PREFIXES = ["/admin", "/"];
const DEFAULT_NEXT = "/admin";

function pickSafeNext(nextRaw: string): string {
  if (!nextRaw.startsWith("/") || nextRaw.startsWith("//")) return DEFAULT_NEXT;
  if (
    ALLOWED_NEXT_PREFIXES.some(
      (p) => nextRaw === p || nextRaw.startsWith(`${p}/`),
    )
  ) {
    return nextRaw;
  }
  return DEFAULT_NEXT;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextRaw = requestUrl.searchParams.get("next") ?? DEFAULT_NEXT;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safeNext = pickSafeNext(nextRaw);
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
