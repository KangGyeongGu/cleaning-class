import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("@/shared/lib/infra/track", () => ({
  track: vi.fn(),
  currentPath: () => "/",
}));

import { MobilePhoneButton } from "@/components/layout/MobilePhoneButton.client";
import { track } from "@/shared/lib/infra/track";

function clickNoNav(el: Element): void {
  el.addEventListener("click", (e) => e.preventDefault());
  fireEvent.click(el);
}

describe("MobilePhoneButton (browser)", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    vi.mocked(track).mockClear();
  });

  it("should not render on /contact route", () => {
    usePathnameMock.mockReturnValue("/contact");
    const { container } = render(<MobilePhoneButton phone="010-1111-2222" />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render on nested /contact/* routes", () => {
    usePathnameMock.mockReturnValue("/contact/thanks");
    const { container } = render(<MobilePhoneButton phone="010-1111-2222" />);
    expect(container.firstChild).toBeNull();
  });

  it("should render single 전화 상담 button when only phone is provided", () => {
    usePathnameMock.mockReturnValue("/");
    render(<MobilePhoneButton phone="010-1111-2222" />);
    const link = screen.getByRole("link", { name: /전화 상담/ });
    expect(link.getAttribute("href")).toBe("tel:010-1111-2222");
  });

  it("should render two buttons when both phones are provided", () => {
    usePathnameMock.mockReturnValue("/");
    render(
      <MobilePhoneButton phone="010-1111-2222" movingPhone="010-3333-4444" />,
    );
    const cleaningLink = screen.getByRole("link", { name: /청소 상담/ });
    const movingLink = screen.getByRole("link", { name: /이사 상담/ });
    expect(cleaningLink.getAttribute("href")).toBe("tel:010-1111-2222");
    expect(movingLink.getAttribute("href")).toBe("tel:010-3333-4444");
  });

  it("should render on routes other than /contact", () => {
    usePathnameMock.mockReturnValue("/services");
    render(<MobilePhoneButton phone="010-1111-2222" />);
    expect(screen.getByRole("link", { name: /전화 상담/ })).toBeTruthy();
  });

  it("should track a cleaning phone_click from the single button", () => {
    usePathnameMock.mockReturnValue("/");
    render(<MobilePhoneButton phone="010-1111-2222" />);
    clickNoNav(screen.getByRole("link", { name: /전화 상담/ }));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({
      event_type: "phone_click",
      event_payload: {
        phone_type: "cleaning",
        click_location: "mobile_bottom",
      },
      path: "/",
    });
  });

  it("should track the matching phone_type for each button when both phones exist", () => {
    usePathnameMock.mockReturnValue("/");
    render(
      <MobilePhoneButton phone="010-1111-2222" movingPhone="010-3333-4444" />,
    );
    clickNoNav(screen.getByRole("link", { name: /청소 상담/ }));
    clickNoNav(screen.getByRole("link", { name: /이사 상담/ }));
    expect(track).toHaveBeenNthCalledWith(1, {
      event_type: "phone_click",
      event_payload: {
        phone_type: "cleaning",
        click_location: "mobile_bottom",
      },
      path: "/",
    });
    expect(track).toHaveBeenNthCalledWith(2, {
      event_type: "phone_click",
      event_payload: { phone_type: "moving", click_location: "mobile_bottom" },
      path: "/",
    });
  });
});
