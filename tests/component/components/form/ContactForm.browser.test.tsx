import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/form/ContactForm.client";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  track: vi.fn(),
  api: vi.fn(),
  ga: vi.fn(),
}));
vi.mock("@/shared/actions/contact", () => ({
  submitContactForm: mocks.submit,
}));
vi.mock("@/shared/lib/infra/track", () => ({
  track: mocks.track,
  trackApiEvent: mocks.api,
  trackGaEvent: mocks.ga,
  currentPath: () => "/contact",
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("견적 요청의 서버 처리 실패와 별개로 제출 시도를 먼저 전송", async () => {
  const calls: string[] = [];
  mocks.api.mockImplementation(() => {
    calls.push("attempt");
    return Promise.resolve(true);
  });
  mocks.submit.mockImplementation(() => {
    calls.push("action");
    return { success: false, error: "서버 처리 실패" };
  });
  const { container } = render(
    <ContactForm
      inquiryType="cleaning"
      serviceOptions={["거주청소"]}
      initialServiceType="거주청소"
    />,
  );
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() => expect(mocks.submit).toHaveBeenCalledOnce());
  expect(calls).toEqual(["attempt", "action"]);
  expect(mocks.api).toHaveBeenCalledExactlyOnceWith({
    event_type: "quote_form_click",
    event_payload: {
      inquiry_type: "cleaning",
      service_type: "거주청소",
      has_images: false,
    },
    path: "/contact",
  });
  expect(mocks.ga).not.toHaveBeenCalled();
});
