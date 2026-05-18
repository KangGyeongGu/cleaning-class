import { createClient } from "@/shared/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let safeNext = "/admin";
      try {
        const parsedUrl = new URL(next, request.url);
        if (parsedUrl.origin === request.nextUrl.origin) {
          safeNext = next;
        }
      } catch {
        void 0;
      }
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
