import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressInput } from "@/components/form/AddressInput.client";
import { AdminSidebar } from "@/app/admin/AdminSidebar.client";
import { BusinessSettingsDialog } from "@/app/admin/components/BusinessSettingsDialog.client";
import type { SiteConfig } from "@/shared/types/database";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  retry: vi.fn(),
  cleaning: vi.fn(),
  moving: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/admin/dashboard"),
  useRouter: vi.fn().mockReturnValue({ refresh: mocks.refresh }),
}));
vi.mock("@/shared/actions/site-config", () => ({
  getBusinessSettings: mocks.load,
  updateSiteConfig: mocks.cleaning,
  updateMovingSiteConfig: mocks.moving,
}));
vi.mock("@/shared/actions/auth", () => ({ logout: mocks.logout }));
vi.mock("@/components/form/PostcodeSearch.client", () => ({
  PostcodeSearch: ({
    onComplete,
  }: {
    onComplete: (data: { address: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onComplete({ address: "서울특별시 중구 세종대로 110" })}
    >
      검색 결과 선택
    </button>
  ),
}));
const config: SiteConfig = {
  id: "test",
  business_name: "청소클라쓰",
  representative: "김대표",
  business_registration_number: "123-45-67890",
  phone: "010-1234-5678",
  email: "test@example.com",
  address: "전주시",
  description: "소개",
  blog_url: "https://blog.naver.com/test",
  instagram_url: "",
  daangn_url: "",
  moving_representative: "이대표",
  moving_phone: "010-9876-5432",
  moving_business_registration_number: "",
  moving_address: "전주시",
  site_url: "https://www.cleaningclass.co.kr",
  address_region: "전북",
  address_locality: "전주",
  updated_at: "2026-10-29",
  customer_review_description: null,
  faq_description: null,
  price_description: null,
  review_description: null,
  service_description: null,
  hero_images: null,
  hero_image_path: null,
  hero_image_path_2: null,
  hero_image_focal_x: null,
  hero_image_focal_y: null,
  hero_image_focal_x_2: null,
  hero_image_focal_y_2: null,
};
beforeEach(async () => {
  vi.clearAllMocks();
  mocks.load.mockReset();
  mocks.load.mockResolvedValue(config);
  mocks.cleaning.mockReset();
  mocks.moving.mockReset();
  mocks.cleaning.mockResolvedValue({ success: true });
  mocks.moving.mockResolvedValue({ success: true });
  await page.viewport(1280, 900);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const panel = () => screen.getByRole("tabpanel");
const change = (label: string, value: string) =>
  fireEvent.change(within(panel()).getByLabelText(label, { exact: false }), {
    target: { value },
  });

describe("업체 정보 설정 팝업", () => {
  it("메뉴를 로그아웃 위에 표시하고 경로 이동 없이 팝업을 연다", async () => {
    render(<AdminSidebar />);
    const settings = screen.getByRole("button", { name: "업체 정보" });
    const logout = screen.getByRole("button", { name: "로그아웃" });
    expect(
      settings.compareDocumentPosition(logout) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "업체 정보" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "홈화면 관리" }).getAttribute("href"),
    ).toBe("/admin/config");
    fireEvent.click(settings);
    await screen.findByRole("dialog");
    expect(screen.getByRole("dialog", { name: "업체 정보" })).toBeTruthy();
    expect(
      (
        within(panel()).getByLabelText("업체명", {
          exact: false,
        }) as HTMLInputElement
      ).value,
    ).toBe("청소클라쓰");
  });
  it("팝업을 다시 열 때 최신 업체정보를 조회", async () => {
    render(<AdminSidebar />);
    fireEvent.click(screen.getByRole("button", { name: "업체 정보" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    mocks.load.mockResolvedValue({ ...config, business_name: "최신 업체" });
    fireEvent.click(screen.getByRole("button", { name: "업체 정보" }));
    await screen.findByRole("dialog");
    expect(
      (
        within(panel()).getByLabelText("업체명", {
          exact: false,
        }) as HTMLInputElement
      ).value,
    ).toBe("최신 업체");
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });
  it("탭 전환 시 입력값을 보존하고 취소하면 저장 없이 닫기", () => {
    const close = vi.fn();
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={close}
      />,
    );
    change("업체명", "수정 업체");
    fireEvent.click(screen.getByRole("tab", { name: "이사" }));
    expect(
      (within(panel()).getByLabelText("대표자명") as HTMLInputElement).value,
    ).toBe("이대표");
    fireEvent.click(screen.getByRole("tab", { name: "청소" }));
    expect(
      (
        within(panel()).getByLabelText("업체명", {
          exact: false,
        }) as HTMLInputElement
      ).value,
    ).toBe("수정 업체");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(mocks.cleaning).not.toHaveBeenCalled();
    expect(mocks.moving).not.toHaveBeenCalled();
  });
  it("업체별 기존 저장 action을 호출하고 성공 후 서버 화면을 갱신", async () => {
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={vi.fn()}
      />,
    );
    change("업체명", "새 업체");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mocks.cleaning).toHaveBeenCalledTimes(1));
    const data = mocks.cleaning.mock.calls[0][1] as FormData;
    expect(data.get("business_name")).toBe("새 업체");
    expect(data.get("moving_phone")).toBeNull();
    await waitFor(() =>
      expect(within(panel()).getByRole("status").textContent).toBe(
        "저장되었습니다.",
      ),
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("tab", { name: "이사" }));
    change("대표자명", "새 이사대표");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mocks.moving).toHaveBeenCalledTimes(1));
    expect(
      (mocks.moving.mock.calls[0][1] as FormData).get("moving_representative"),
    ).toBe("새 이사대표");
  });
  it("저장 실패 시 입력값을 보존하고 항목 오류 표시", async () => {
    mocks.cleaning.mockResolvedValue({
      success: false,
      errors: { business_name: ["업체명을 확인해주세요"] },
    });
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={vi.fn()}
      />,
    );
    change("업체명", "수정 업체");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(within(panel()).getByText("업체명을 확인해주세요")).toBeTruthy(),
    );
    expect(
      (
        within(panel()).getByLabelText("업체명", {
          exact: false,
        }) as HTMLInputElement
      ).value,
    ).toBe("수정 업체");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(panel()).getByLabelText("업체명", { exact: false }),
      ),
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it("저장 중 닫기와 Escape·탭 전환을 막는다", async () => {
    let resolve: (result: { success: boolean }) => void = () => {};
    mocks.cleaning.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const close = vi.fn();
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={close}
      />,
    );
    change("업체명", "수정 업체");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(mocks.cleaning).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "취소" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "저장",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      within(panel())
        .getByLabelText("업체명", { exact: false })
        .matches(":disabled"),
    ).toBe(true);
    const event = new Event("cancel", { cancelable: true });
    screen.getByRole("dialog").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(
      (screen.getByRole("tab", { name: "이사" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(close).not.toHaveBeenCalled();
    await act(async () => {
      resolve({ success: true });
    });
  });
  it("모바일 메뉴에서도 열리고 상단 한 행에 취소·저장 버튼 표시", async () => {
    await page.viewport(390, 844);
    render(<AdminSidebar />);
    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    fireEvent.click(screen.getByRole("button", { name: "업체 정보" }));
    const dialog = await screen.findByRole("dialog");
    const save = screen.getByRole("button", { name: "저장" });
    const header = dialog.querySelector("header")!;
    expect(header.contains(save)).toBe(true);
    expect(header.contains(screen.getByRole("button", { name: "취소" }))).toBe(
      true,
    );
    expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();
    expect(dialog.querySelector("footer")).toBeNull();
    const heading = within(header).getByRole("heading", { name: "업체 정보" });
    expect(
      Math.abs(
        heading.getBoundingClientRect().top +
          heading.getBoundingClientRect().height / 2 -
          save.getBoundingClientRect().top -
          save.getBoundingClientRect().height / 2,
      ),
    ).toBeLessThan(2);

    await waitFor(() =>
      expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        dialog.getBoundingClientRect().bottom,
      ),
    );
    expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      window.innerWidth,
    );
  });
  it.each([
    [1280, 900],
    [390, 640],
  ])(
    "%s×%s에서 탭 높이가 같고 마지막 청소 항목까지 스크롤 가능",
    async (width, height) => {
      await page.viewport(width, height);
      render(
        <BusinessSettingsDialog
          onRetry={mocks.retry}
          config={config}
          onClose={vi.fn()}
        />,
      );
      const dialog = screen.getByRole("dialog");
      const initialHeight = dialog.getBoundingClientRect().height;
      const scroll = panel().querySelector("fieldset")!.parentElement!;
      expect(scroll.clientHeight).toBeGreaterThan(0);
      expect(getComputedStyle(scroll).overflowY).toBe("auto");
      const last = within(panel()).getByLabelText("당근");
      await act(async () => {
        last.scrollIntoView({ block: "nearest" });
      });
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        scroll.getBoundingClientRect().bottom,
      );
      expect(last.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        scroll.getBoundingClientRect().top,
      );
      expect(
        screen.getByRole("button", { name: "저장" }).getBoundingClientRect()
          .bottom,
      ).toBeLessThanOrEqual(dialog.getBoundingClientRect().bottom);
      fireEvent.click(screen.getByRole("tab", { name: "이사" }));
      expect(
        Math.abs(dialog.getBoundingClientRect().height - initialHeight),
      ).toBeLessThan(1);
      const header = dialog.querySelector("header")!;
      expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
    },
  );
  it("직각 테두리의 좌상단 레이블을 일반 입력·빈 값에서 유지", () => {
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={vi.fn()}
      />,
    );
    expect(within(panel()).queryByLabelText("소개글")).toBeNull();
    for (const name of ["업체명", "대표자명"]) {
      const control = within(panel()).getByLabelText(name, { exact: false }) as
        | HTMLInputElement
        | HTMLTextAreaElement;
      const label = control.labels![0];
      expect(getComputedStyle(control).borderTopLeftRadius).toBe("0px");
      expect(label.getBoundingClientRect().top).toBeLessThan(
        control.getBoundingClientRect().top,
      );
      expect(label.getBoundingClientRect().bottom).toBeGreaterThan(
        control.getBoundingClientRect().top,
      );
      fireEvent.change(control, { target: { value: "" } });
      fireEvent.focus(control);
      expect(control.value).toBe("");
      expect(label.getBoundingClientRect().top).toBeLessThan(
        control.getBoundingClientRect().top,
      );
    }
  });
  it.each([
    ["청소", "address"],
    ["이사", "moving_address"],
  ])("%s 주소 검색 결과와 상세주소를 기존 필드에 저장", async (tab, name) => {
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: tab }));
    change("대표자명", "수정 대표");
    const height = screen.getByRole("dialog").getBoundingClientRect().height;
    fireEvent.click(within(panel()).getByRole("button", { name: "주소찾기" }));
    expect(screen.getByRole("dialog", { name: "주소찾기" })).toBeTruthy();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("dialog").getBoundingClientRect().height).toBe(
      height,
    );
    fireEvent.click(screen.getByRole("button", { name: "검색 결과 선택" }));
    expect(screen.getByRole("dialog", { name: "업체 정보" })).toBeTruthy();
    expect(
      (within(panel()).getByLabelText("주소") as HTMLInputElement).value,
    ).toBe("서울특별시 중구 세종대로 110");
    expect(
      (within(panel()).getByLabelText("대표자명") as HTMLInputElement).value,
    ).toBe("수정 대표");
    change("주소", "서울특별시 중구 세종대로 110 101호");
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    const action = name === "address" ? mocks.cleaning : mocks.moving;
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect((action.mock.calls[0][1] as FormData).get(name)).toBe(
      "서울특별시 중구 세종대로 110 101호",
    );
  });
  it("검색 취소와 Escape는 업체 정보 팝업을 닫지 않고 편집 내용을 유지", async () => {
    const close = vi.fn();
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={config}
        onClose={close}
      />,
    );
    change("업체명", "수정 업체");
    const trigger = within(panel()).getByRole("button", { name: "주소찾기" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(
      (within(panel()).getByLabelText("주소") as HTMLInputElement).value,
    ).toBe(config.address);
    expect(
      (
        within(panel()).getByLabelText("업체명", {
          exact: false,
        }) as HTMLInputElement
      ).value,
    ).toBe("수정 업체");
    trigger.focus();
    fireEvent.click(trigger);
    const event = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), event);
    expect(event.defaultPrevented).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(screen.getByRole("dialog", { name: "업체 정보" })).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
    expect(mocks.cleaning).not.toHaveBeenCalled();
  });
  it("공용 검색 컴포넌트가 기존 견적문의 주소·상세주소 동작도 유지", () => {
    const changeAddress = vi.fn();
    render(
      <AddressInput
        label="주소"
        addressName="address"
        detailName="detail"
        onChange={changeAddress}
      />,
    );
    fireEvent.change(
      screen.getByPlaceholderText("선택사항: 상세 주소 (동·호수)"),
      { target: { value: "101호" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "주소 검색" }));
    fireEvent.click(screen.getByRole("button", { name: "검색 결과 선택" }));
    expect(changeAddress).toHaveBeenLastCalledWith(
      "서울특별시 중구 세종대로 110",
      "101호",
    );
    expect(
      (screen.getByPlaceholderText("주소 검색") as HTMLInputElement).value,
    ).toBe("서울특별시 중구 세종대로 110");
  });
  it("설정 조회 실패 시 재조회 제공", () => {
    render(
      <BusinessSettingsDialog
        onRetry={mocks.retry}
        config={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });
});
