"use server";

import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getUser } from "@/shared/lib/supabase/auth";

const DATA_DIR = process.env.TRAFFIC_DATA_DIR ?? "/data";
const CF_DIR = join(DATA_DIR, "cloudflare");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식이 아닙니다.");
const FILE_RE = /^(\d{4}-\d{2}-\d{2})\.json$/;

const REVALIDATE_PATHS = ["/admin/traffic"] as const;

function revalidateTrafficPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function deleteTrafficBefore(
  beforeDate: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    await getUser();

    const parsed = dateSchema.safeParse(beforeDate);
    if (!parsed.success) {
      return { success: false, error: "올바른 날짜 형식이 아닙니다." };
    }

    let files: string[];
    try {
      files = await readdir(CF_DIR);
    } catch {
      return { success: false, error: "데이터 디렉터리를 읽을 수 없습니다." };
    }

    let deleted = 0;
    for (const file of files) {
      const match = file.match(FILE_RE);
      if (!match) continue;
      if (match[1] < parsed.data) {
        try {
          await unlink(join(CF_DIR, file));
          deleted++;
        } catch {
          continue;
        }
      }
    }

    revalidateTrafficPaths();
    return { success: true, message: `${deleted}개 파일을 삭제했습니다.` };
  } catch (error) {
    console.error("deleteTrafficBefore error:", error);
    return { success: false, error: "삭제 중 오류가 발생했습니다." };
  }
}
