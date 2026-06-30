import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockPush = vi.hoisted(() => vi.fn());
const mockUseRouter = vi.hoisted(() => vi.fn(() => ({ push: mockPush })));

vi.mock("next/navigation", () => ({
  useRouter: mockUseRouter,
}));

import { useAdminForm } from "@/shared/lib/hooks/useAdminForm";

beforeEach(() => {
  vi.clearAllMocks();
});

async function runWith<State>(result: State) {
  const action = vi.fn(() => result);
  const hook = renderHook(() => useAdminForm(action, "/admin/x"));
  await act(async () => {
    hook.result.current[1](new FormData());
  });
  await waitFor(() => expect(hook.result.current[0]).toEqual(result));
  return hook;
}

describe("useAdminForm", () => {
  it("does not redirect on initial null state", () => {
    const action = vi.fn(() => ({ success: true }));
    const { result } = renderHook(() => useAdminForm(action, "/admin/x"));
    expect(result.current[0]).toBeNull();
    expect(result.current[2]).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects when action returns success", async () => {
    await runWith({ success: true });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/x"));
  });

  it("does not redirect when success is false", async () => {
    await runWith({ success: false });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not redirect when state lacks a success key", async () => {
    await runWith({ error: "fail" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not redirect when state is not an object", async () => {
    await runWith("oops");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
