import "@/app/globals.css";
import type { ReactNode } from "react";
import { page } from "vitest/browser";
import {
  cleanup,
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminEditor } from "@/app/admin/components/AdminEditor.client";
import { ManagementPage } from "@/app/admin/components/ManagementPage";
import { FaqForm } from "@/app/admin/(protected)/faq/FaqForm.client";
import { PriceForm } from "@/app/admin/(protected)/price/PriceForm.client";
import { ReviewForm } from "@/app/admin/(protected)/reviews/ReviewForm.client";
import { ServiceForm } from "@/app/admin/(protected)/services/ServiceForm.client";
import { HomeDescription } from "@/app/admin/(protected)/config/HomeDescription.client";
import { InlineDescriptionEditor } from "@/app/admin/components/InlineDescriptionEditor.client";
import { OutlinedField } from "@/components/ui/OutlinedField";
import { SERVICE_TYPES } from "@/shared/lib/pure/constants";
import type {
  FaqRow,
  PriceItemRow,
  Review,
  Service,
} from "@/shared/types/database";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  home: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: vi
    .fn()
    .mockReturnValue({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/shared/actions/service", () => ({
  createService: mocks.create,
  updateService: mocks.update,
}));
vi.mock("@/shared/actions/faq", () => ({
  createFaq: mocks.create,
  updateFaq: mocks.update,
}));
vi.mock("@/shared/actions/price", () => ({
  createPriceItem: mocks.create,
  updatePriceItem: mocks.update,
}));
vi.mock("@/shared/actions/review", () => ({
  createReview: mocks.create,
  updateReview: mocks.update,
}));
vi.mock("@/app/admin/(protected)/config/actions", () => ({
  updateHomeDescription: mocks.home,
}));

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.create.mockReset();
  mocks.update.mockReset();
  mocks.home.mockReset();
  mocks.create.mockResolvedValue({ success: true });
  mocks.update.mockResolvedValue({ success: true });
  mocks.home.mockResolvedValue({ success: true });
  await page.viewport(1280, 900);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function render(element: ReactNode) {
  return renderComponent(
    <div className="mx-auto max-w-5xl px-4 pb-8 md:px-8">{element}</div>,
  );
}
function change(label: string, value: string) {
  fireEvent.change(
    screen.getByLabelText(label, {
      exact: false,
      selector: "input, textarea, select",
    }),
    {
      target: { value },
    },
  );
}
function submit() {
  fireEvent.submit(
    screen.getByRole("button", { name: "저장" }).closest("form")!,
  );
}
const faq: FaqRow = {
  id: "faq-1",
  question: "질문",
  answer: "답변",
  display_order: 3,
  is_active: false,
  created_at: "",
  updated_at: "",
};
const price: PriceItemRow = {
  id: "price-1",
  name: "청소",
  price_won: null,
  sort_order: 2,
  is_published: false,
  created_at: "",
  updated_at: "",
};
const review: Review = {
  id: "review-1",
  title: "작업",
  summary: "소개",
  link_url: "",
  tags: [SERVICE_TYPES[0], "전주"],
  image_path: "",
  is_published: false,
  created_at: "",
  updated_at: "",
};
const service: Service = {
  id: "service-1",
  title: "서비스",
  category: "moving",
  description: "설명",
  tags: ["전주"],
  sort_order: 2,
  image_path: "",
  image_after_path: "",
  detail_image_path: "",
  detail_image_after_path: "",
  image_focal_x: 25,
  image_focal_y: 75,
  image_after_focal_x: 30,
  image_after_focal_y: 60,
  is_published: false,
  created_at: "",
  updated_at: "",
};

describe("관리 메뉴와 공통 작성 폼", () => {
  it("서비스·가격·질문은 기존 주소를 탭으로 연결", () => {
    render(
      <ManagementPage
        section="services"
        active="/admin/price"
        createHref="/admin/price/new"
        description={<p>안내 문구</p>}
      >
        <p>목록</p>
      </ManagementPage>,
    );
    expect(screen.getByRole("heading", { name: "서비스 관리" })).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "서비스 관리 메뉴" });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
    expect(
      within(nav)
        .getByRole("link", { name: "가격표" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(nav)
        .getByRole("link", { name: "자주 묻는 질문" })
        .getAttribute("href"),
    ).toBe("/admin/faq");
  });
  it("후기 메뉴는 두 종류를 분리하고 고객리뷰에는 등록 버튼이 없음", () => {
    render(
      <ManagementPage
        section="reviews"
        active="/admin/customer-reviews"
        description={<p>안내</p>}
      >
        <p>목록</p>
      </ManagementPage>,
    );
    expect(screen.getByRole("navigation").querySelectorAll("a")).toHaveLength(
      2,
    );
    expect(screen.queryByRole("link", { name: "신규 등록" })).toBeNull();
  });
  it("질문 등록 값과 표시 순서를 기존 action에 전달", async () => {
    render(<FaqForm defaultDisplayOrder={7} />);
    change("질문", "청소 시간은?");
    change("답변", "세 시간입니다.");
    submit();
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const data = mocks.create.mock.calls[0][1] as FormData;
    expect(data.get("question")).toBe("청소 시간은?");
    expect(data.get("display_order")).toBe("7");
    expect(data.get("is_active")).toBe("true");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/admin/faq"));
  });
  it("수정 오류 후 텍스트·파일 입력을 유지하고 오류 입력란에 포커스", async () => {
    const action = vi
      .fn()
      .mockResolvedValue({ success: false, errors: { title: ["제목 확인"] } });
    render(
      <AdminEditor title="수정" returnHref="/admin/reviews" action={action}>
        {(errors) => (
          <>
            <OutlinedField
              id="title"
              name="title"
              label="제목"
              defaultValue="기존"
              error={errors?.title?.[0]}
            />
            <input type="file" aria-label="파일" name="image" />
          </>
        )}
      </AdminEditor>,
    );
    change("제목", "수정값");
    const file = new File(["test"], "test.png", { type: "image/png" });
    const files = new DataTransfer();
    files.items.add(file);
    const input = screen.getByLabelText("파일") as HTMLInputElement;
    input.files = files.files;
    fireEvent.change(input);
    submit();
    await screen.findByText("제목 확인");
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText("제목")),
    );
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe(
      "수정값",
    );
    expect(input.files?.[0].name).toBe("test.png");
    expect((action.mock.calls[0][1] as FormData).get("image")).toBeInstanceOf(
      File,
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("질문 수정에 기존 식별자와 비공개 상태 전달", async () => {
    render(<FaqForm faq={faq} />);
    change("답변", "수정 답변");
    submit();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update.mock.calls[0][0]).toBe("faq-1");
    expect(
      (mocks.update.mock.calls[0][2] as FormData).get("is_active"),
    ).toBeNull();
  });
  it("현장 견적은 금액 입력을 제외하고 저장하며 고정 가격으로 전환 가능", async () => {
    render(<PriceForm priceItem={price} />);
    const input = screen.getByLabelText("최소 가격 (원)", {
      exact: false,
    }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("현장 견적"));
    expect(input.disabled).toBe(false);
    change("최소 가격 (원)", "200000");
    submit();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    const data = mocks.update.mock.calls[0][2] as FormData;
    expect(data.get("price_won")).toBe("200000");
    expect(data.get("is_variable")).toBeNull();
    expect(data.get("is_published")).toBeNull();
  });
  it("후기의 서비스 종류와 추가 태그를 합쳐 기존 형식으로 저장", async () => {
    render(<ReviewForm review={review} />);
    change("서비스 종류", SERVICE_TYPES[1]);
    change("추가 태그", "완산구");
    fireEvent.click(screen.getByRole("button", { name: "태그 추가" }));
    submit();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    const data = mocks.update.mock.calls[0][2] as FormData;
    expect(JSON.parse(String(data.get("tags")))).toEqual([
      "전주",
      SERVICE_TYPES[1],
      "완산구",
    ]);
    expect(data.get("is_published")).toBeNull();
  });
  it("서비스 수정에서 네 이미지 필드·초점·종류를 유지", async () => {
    render(<ServiceForm service={service} />);
    change("서비스명", "변경 서비스");
    submit();
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    const data = mocks.update.mock.calls[0][2] as FormData;
    expect(data.get("category")).toBe("moving");
    expect(data.get("image_focal_x")).toBe("25");
    expect(data.get("image_after_focal_y")).toBe("60");
    expect(data.getAll("image")).toHaveLength(1);
    expect(data.getAll("detail_image_after")).toHaveLength(1);
    expect(data.has("tags")).toBe(false);
  });
  it("변경 후 취소는 확인하고 취소 선택 시 폼 유지", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<FaqForm />);
    change("질문", "작성 중");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/faq");
  });
  it("저장 중 입력과 중복 제출 차단, 전송 실패 시 재시도 가능", async () => {
    let reject: (error: Error) => void = () => {};
    mocks.create.mockImplementation(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    );
    render(<FaqForm />);
    change("질문", "질문");
    change("답변", "답변");
    submit();
    submit();
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(
      screen.getByLabelText("질문", { exact: false }).matches(":disabled"),
    ).toBe(true);
    reject(new Error("network"));
    await screen.findByText("저장하지 못했습니다. 다시 시도해주세요.");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "저장" }).matches(":disabled"),
      ).toBe(false),
    );
    expect(
      (screen.getByLabelText("질문", { exact: false }) as HTMLTextAreaElement)
        .value,
    ).toBe("질문");
  });
  it("홈 소개글은 다른 안내 문구와 같은 한줄 편집 방식으로 저장", async () => {
    render(<HomeDescription initialValue="기존 소개" />);
    expect(screen.queryByRole("textbox", { name: "소개 문구" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "안내 문구 수정" }));
    change("소개 문구", "새 소개");
    submit();
    await screen.findByText("새 소개");
    expect(mocks.home).toHaveBeenCalledWith("새 소개");
    fireEvent.click(screen.getByRole("button", { name: "안내 문구 수정" }));
    change("소개 문구", "다시 편집");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("새 소개")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "소개 문구" })).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([
    [1280, 900],
    [390, 640],
  ])(
    "%s×%s에서 소개글 입력란과 취소·저장 버튼 높이·위치 통일",
    async (width, height) => {
      await page.viewport(width, height);
      render(<HomeDescription initialValue="소개글" />);
      fireEvent.click(screen.getByRole("button", { name: "안내 문구 수정" }));
      const input = screen.getByRole("textbox", { name: "소개 문구" });
      const bounds = input.getBoundingClientRect();
      expect(bounds.height).toBe(44);
      for (const name of ["취소", "저장"]) {
        const button = screen.getByRole("button", { name });
        expect(button.getBoundingClientRect().height).toBe(bounds.height);
        expect(button.getBoundingClientRect().top).toBe(bounds.top);
        expect(getComputedStyle(button).borderRadius).toBe("0px");
      }
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    },
  );
  it("한줄 문구는 기존 위치에서 수정하고 실패 시 편집 유지", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ success: false, error: "저장 실패" })
      .mockResolvedValueOnce({ success: true });
    render(
      <InlineDescriptionEditor
        initialValue="기존"
        label="안내 문구"
        placeholder="문구"
        emptyText="없음"
        onSave={save}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "안내 문구 수정" }));
    change("안내 문구", "수정");
    submit();
    await screen.findByText("저장 실패");
    expect((screen.getByLabelText("안내 문구") as HTMLInputElement).value).toBe(
      "수정",
    );
    submit();
    await screen.findByText("수정");
    expect(screen.queryByLabelText("안내 문구")).toBeNull();
  });
  it.each([
    [1280, 900],
    [390, 640],
  ])("%s×%s에서 긴 폼의 저장 버튼을 상단에 유지", async (width, height) => {
    await page.viewport(width, height);
    render(<FaqForm />);
    const header = screen
      .getByRole("heading", { name: "질문 등록" })
      .closest("header")!;
    expect(header.contains(screen.getByRole("button", { name: "취소" }))).toBe(
      true,
    );
    expect(header.contains(screen.getByRole("button", { name: "저장" }))).toBe(
      true,
    );
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  });
  it("server refresh updates the displayed description without overwriting an active draft", async () => {
    const { rerender } = render(<HomeDescription initialValue="기존 소개" />);
    rerender(<HomeDescription initialValue="서버의 새 소개" />);
    expect(screen.getByText("서버의 새 소개")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "안내 문구 수정" }));
    change("소개 문구", "작성 중 초안");
    rerender(<HomeDescription initialValue="다른 관리자의 수정" />);
    expect(
      (screen.getByRole("textbox", { name: "소개 문구" }) as HTMLInputElement)
        .value,
    ).toBe("작성 중 초안");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("다른 관리자의 수정")).toBeTruthy();
  });
});
