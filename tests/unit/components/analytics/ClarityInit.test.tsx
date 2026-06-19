import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import ClarityInit from "@/components/analytics/ClarityInit.client";

vi.mock("@microsoft/clarity", () => ({
  default: { init: vi.fn() },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("ClarityInit", () => {
  it("NEXT_PUBLIC_CLARITY_ID 가 설정된 경우 Clarity.init 을 해당 id 로 1회 호출한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLARITY_ID", "test-project-id");
    const { default: Clarity } = await import("@microsoft/clarity");

    await act(async () => {
      render(<ClarityInit />);
    });

    expect(Clarity.init).toHaveBeenCalledTimes(1);
    expect(Clarity.init).toHaveBeenCalledWith("test-project-id");
  });

  it("NEXT_PUBLIC_CLARITY_ID 가 없으면 Clarity.init 을 호출하지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLARITY_ID", "");
    const { default: Clarity } = await import("@microsoft/clarity");

    await act(async () => {
      render(<ClarityInit />);
    });

    expect(Clarity.init).not.toHaveBeenCalled();
  });

  it("React.StrictMode wrapper 로 렌더링해도 Clarity.init 은 1회만 호출된다", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLARITY_ID", "strict-mode-id");
    const { default: Clarity } = await import("@microsoft/clarity");

    await act(async () => {
      render(
        <React.StrictMode>
          <ClarityInit />
        </React.StrictMode>,
      );
    });

    expect(Clarity.init).toHaveBeenCalledTimes(1);
  });
});
