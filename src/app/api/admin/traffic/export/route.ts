import { NextResponse } from "next/server";

import { getUser } from "@/shared/lib/supabase/auth";
import { getCloudflareDays } from "@/shared/lib/queries/traffic";

export async function GET(): Promise<NextResponse> {
  try {
    await getUser();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const days = await getCloudflareDays();

  const header = [
    "date",
    "requests",
    "pageViews",
    "uniqueVisitors",
    "bytes",
    "threats",
    "cachedRequests",
  ];
  const lines = [header.join(",")];

  for (const d of days) {
    lines.push(
      [
        d.dimensions.date,
        d.sum.requests,
        d.sum.pageViews,
        d.uniq?.uniques ?? 0,
        d.sum.bytes,
        d.sum.threats,
        d.sum.cachedRequests,
      ].join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="traffic-cloudflare.csv"',
    },
  });
}
