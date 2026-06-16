import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());
const mockReaddir = vi.hoisted(() => vi.fn());
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock("@/shared/lib/supabase/auth", () => ({ getUser: mockGetUser }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("node:fs/promises", () => ({
  default: { readdir: mockReaddir, unlink: mockUnlink },
  readdir: mockReaddir,
  unlink: mockUnlink,
}));

import { deleteTrafficBefore } from "@/shared/actions/traffic";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ id: "admin" });
});

describe("deleteTrafficBefore", () => {
  it("rejects an invalid date format", async () => {
    const result = await deleteTrafficBefore("not-a-date");
    expect(result.success).toBe(false);
    expect(result.error).toContain("날짜");
    expect(mockReaddir).not.toHaveBeenCalled();
  });

  it("returns an error when the directory cannot be read", async () => {
    mockReaddir.mockRejectedValue(new Error("io"));
    const result = await deleteTrafficBefore("2026-06-10");
    expect(result.success).toBe(false);
    expect(result.error).toContain("디렉터리");
  });

  it("deletes only matching files before the cutoff and counts successes", async () => {
    mockReaddir.mockResolvedValue([
      "2026-06-05.json",
      "2026-06-09.json",
      "2026-06-10.json",
      "2026-06-20.json",
      "report.json",
      "2026-06-08.json",
    ]);
    mockUnlink.mockImplementation(async (p: string) => {
      if (p.includes("2026-06-08")) throw new Error("locked");
    });

    const result = await deleteTrafficBefore("2026-06-10");
    expect(result.success).toBe(true);
    expect(result.message).toContain("2개");
    expect(mockUnlink).toHaveBeenCalledTimes(3);
    expect(mockUnlink).not.toHaveBeenCalledWith(
      expect.stringContaining("2026-06-10.json"),
    );
    expect(mockUnlink).not.toHaveBeenCalledWith(
      expect.stringContaining("2026-06-20.json"),
    );
    expect(mockUnlink).not.toHaveBeenCalledWith(
      expect.stringContaining("report.json"),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/traffic");
  });

  it("returns an error when authentication fails", async () => {
    mockGetUser.mockRejectedValue(new Error("unauthorized"));
    const result = await deleteTrafficBefore("2026-06-10");
    expect(result.success).toBe(false);
    expect(result.error).toContain("삭제 중");
  });
});
