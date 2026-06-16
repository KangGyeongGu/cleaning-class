import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { getUser } from "@/shared/lib/supabase/auth";

const REPORT_PATH = join(
  process.env.TRAFFIC_DATA_DIR ?? "/data",
  "goaccess",
  "report.html",
);

export async function GET(): Promise<NextResponse> {
  try {
    await getUser();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let html: string;
  try {
    html = await readFile(REPORT_PATH, "utf-8");
  } catch {
    return new NextResponse("GoAccess 보고서가 아직 생성되지 않았습니다.", {
      status: 404,
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
