import "@/app/globals.css";
import { page } from "vitest/browser";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroImageCard } from "@/app/admin/(protected)/config/HeroImageCard.client";
import {
  HeroCropDialog,
  type HeroImageSlot,
} from "@/app/admin/(protected)/config/HeroCropDialog.client";
import { exportHeroCrop } from "@/app/admin/lib/hero-crop";
import type {
  HeroAsset,
  HeroConfig,
  HeroImages,
} from "@/shared/lib/domain/hero-images";

const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({ refresh: mocks.refresh }),
}));
vi.mock("@/shared/actions/site-config-hero", () => ({
  updateHeroImage: mocks.update,
}));
vi.mock("@/shared/lib/supabase/storage", () => ({
  getHeroImageUrl: (path: string) => path,
}));
vi.mock("@/app/admin/(protected)/config/HeroPreview.client", () => ({
  HeroPreview: ({ device }: { device: string }) => (
    <iframe
      sandbox=""
      title={`${device} preview`}
      src="about:blank"
      className="aspect-[2/1] w-full"
    />
  ),
}));
let source: string;
function asset(): HeroAsset {
  return {
    displayPath: source,
    focalX: 50,
    focalY: 50,
  };
}
const slot = (): HeroImageSlot => ({
  device: "pc",
  side: "left",
  label: "PC 좌측 배경이미지",
  asset: asset(),
});
function heroConfig(): HeroConfig & {
  hero_images: HeroImages;
  business_name: string;
  description: string;
} {
  return {
    business_name: "청소클라쓰",
    description: "소개",
    hero_images: {
      pc: { left: asset(), right: asset() },
      mobile: { left: asset(), right: asset() },
    },
    hero_image_path: null,
    hero_image_path_2: null,
    hero_image_focal_x: 50,
    hero_image_focal_y: 50,
    hero_image_focal_x_2: 50,
    hero_image_focal_y_2: 50,
  };
}
beforeEach(async () => {
  vi.clearAllMocks();
  mocks.update.mockReset();
  mocks.update.mockResolvedValue({ success: true });
  await page.viewport(1280, 900);
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "red";
  context.fillRect(0, 0, 160, 180);
  context.fillStyle = "blue";
  context.fillRect(160, 0, 160, 180);
  source = canvas.toDataURL("image/png");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function ready() {
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "저장" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
}
async function choose() {
  const file = new File([await (await fetch(source)).blob()], "photo.png", {
    type: "image/png",
  });
  fireEvent.change(screen.getByLabelText("이미지 선택"), {
    target: { files: [file] },
  });
  await ready();
}
async function savedData() {
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
  return mocks.update.mock.calls[0][1] as FormData;
}

describe("기기별 새 사진 업로드·크롭", () => {
  it.each([
    [1280, 900],
    [390, 640],
  ])(
    "%s×%s에서 기기별 제목과 수정 영역 및 편집 도구 배치",
    async (width, height) => {
      await page.viewport(width, height);
      render(<HeroImageCard config={heroConfig()} />);
      expect(
        screen.getByRole("heading", { level: 2, name: "배경이미지" }),
      ).toBeTruthy();
      for (const device of ["PC", "모바일"]) {
        const heading = screen.getByRole("heading", { level: 3, name: device });
        const preview = screen.getByLabelText(`${device} 배너 미리보기`);
        expect(preview.getBoundingClientRect().top).toBeGreaterThan(
          heading.getBoundingClientRect().bottom,
        );
        for (const side of ["좌측", "우측"])
          expect(
            preview.contains(
              screen.getByRole("button", {
                name: `${device} ${side} 배경이미지 수정`,
              }),
            ),
          ).toBe(true);
      }
      fireEvent.click(
        screen.getByRole("button", { name: "PC 좌측 배경이미지 수정" }),
      );
      await choose();
      const dialog = screen.getByRole("dialog");
      expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(width);
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(height);
      expect(
        dialog
          .querySelector("header")!
          .contains(screen.getByRole("button", { name: "저장" })),
      ).toBe(true);
      for (const name of ["취소", "저장"]) {
        const button = screen.getByRole("button", { name });
        expect(button.getBoundingClientRect().height).toBe(32);
        expect(getComputedStyle(button).borderRadius).toBe("0px");
      }
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    },
  );
  it("호버하면 수정 표시를 노출하며 모바일 수정은 모바일 데이터만 전달", async () => {
    render(<HeroImageCard config={heroConfig()} />);
    await page.getByRole("heading", { name: "배경이미지", level: 2 }).hover();
    const button = screen.getByRole("button", {
      name: "모바일 우측 배경이미지 수정",
    });
    await waitFor(() =>
      expect(getComputedStyle(button.querySelector("span")!).opacity).toBe("0"),
    );
    await page
      .getByRole("button", { name: "모바일 우측 배경이미지 수정" })
      .hover({
        position: {
          x: button.getBoundingClientRect().width * 0.7,
          y: button.getBoundingClientRect().height * 0.7,
        },
      });
    await waitFor(() =>
      expect(getComputedStyle(button.querySelector("span")!).opacity).toBe("1"),
    );
    await act(async () => {
      await page
        .getByRole("button", { name: "모바일 우측 배경이미지 수정" })
        .click({
          position: {
            x: button.getBoundingClientRect().width * 0.7,
            y: button.getBoundingClientRect().height * 0.7,
          },
        });
    });
    await choose();
    const data = await savedData();
    expect(data.get("device")).toBe("mobile");
    expect(data.get("side")).toBe("right");
  });
  it("기기별 미리보기에 별도 사진을 표시하며 빈 모바일 영역에 PC 사진을 대신 표시하지 않음", () => {
    const config = heroConfig();
    config.hero_images.mobile = {
      left: null,
      right: null,
    };
    render(<HeroImageCard config={config} />);
    expect(
      screen.getByLabelText("PC 배너 미리보기").querySelectorAll("iframe")
        .length,
    ).toBe(1);
    expect(
      screen.getByLabelText("모바일 배너 미리보기").querySelectorAll("iframe")
        .length,
    ).toBe(0);
    fireEvent.click(
      screen.getByRole("button", { name: "모바일 좌측 배경이미지 수정" }),
    );
    expect(screen.getByLabelText("이미지 선택")).toBeTruthy();
  });
  it("기존 사진을 재편집하지 않으며 새 사진을 선택해야 저장 가능", async () => {
    render(<HeroCropDialog slot={slot()} onClose={vi.fn()} />);
    expect(screen.getByLabelText("이미지 선택")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "초기화" })).toBeNull();
    expect(screen.queryByLabelText("선택 영역 크기")).toBeNull();
    expect(
      (screen.getByRole("button", { name: "저장" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await choose();
    const data = await savedData();
    expect(data.has("original_image")).toBe(false);
    expect(data.has("crop")).toBe(false);
    expect((data.get("hero_image") as File).type).toBe("image/webp");
  });
  it("비율 프리셋에서 다시 자유 크롭으로 전환하고 실제 핸들로 가로·세로를 각각 조절", async () => {
    render(<HeroCropDialog slot={slot()} onClose={vi.fn()} />);
    await choose();
    fireEvent.change(screen.getByRole("combobox", { name: "크롭 비율" }), {
      target: { value: "1:1" },
    });
    await waitFor(() => {
      const size = screen
        .getByLabelText("선택 영역 크기")
        .textContent!.split(" × ")
        .map(Number);
      expect(size[0]).toBe(size[1]);
    });
    fireEvent.change(screen.getByRole("combobox", { name: "크롭 비율" }), {
      target: { value: "free" },
    });
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe(
      "free",
    );
    expect(
      document.querySelectorAll(".advanced-cropper-bounding-box__handler")
        .length,
    ).toBeGreaterThanOrEqual(4);
  });
  it("새 사진은 크롭 결과만 전송하며 잘못된 파일은 기존 편집을 유지", async () => {
    render(
      <HeroCropDialog slot={{ ...slot(), asset: null }} onClose={vi.fn()} />,
    );
    const file = new File([await (await fetch(source)).blob()], "photo.png", {
      type: "image/png",
    });
    fireEvent.change(screen.getByLabelText("이미지 선택"), {
      target: { files: [file] },
    });
    await ready();
    fireEvent.change(screen.getByLabelText("이미지 변경"), {
      target: { files: [new File(["bad"], "bad.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByRole("alert")).toBeTruthy();
    const data = await savedData();
    expect(data.has("original_image")).toBe(false);
    expect((data.get("hero_image") as File).type).toBe("image/webp");
  });
  it("저장 실패 후 선택을 보존하고 취소는 저장 요청을 보내지 않음", async () => {
    mocks.update.mockResolvedValue({ success: false, error: "저장 실패" });
    const close = vi.fn();
    render(<HeroCropDialog slot={slot()} onClose={close} />);
    await choose();
    await savedData();
    await screen.findByText("저장 실패");
    expect(screen.getByLabelText("선택 영역 크기").textContent).toBe(
      "320 × 180",
    );
    expect(close).not.toHaveBeenCalled();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(close).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledTimes(1);
  });
  it("비정형 크롭 결과의 비율과 화소를 보존", async () => {
    const file = await exportHeroCrop(source, {
      left: 160,
      top: 0,
      width: 130,
      height: 170,
    });
    const bitmap = await createImageBitmap(file);
    expect(bitmap.width).toBe(130);
    expect(bitmap.height).toBe(170);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    expect(pixel[2]).toBeGreaterThan(230);
    expect(pixel[0]).toBeLessThan(20);
    bitmap.close();
  });
  it("긴 변만 1920으로 축소하고 잘못된 영역을 거부", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 3200;
    const file = await exportHeroCrop(canvas.toDataURL("image/png"), {
      left: 0,
      top: 0,
      width: 2400,
      height: 3200,
    });
    const bitmap = await createImageBitmap(file);
    expect(bitmap.width).toBe(1440);
    expect(bitmap.height).toBe(1920);
    bitmap.close();
    await expect(
      exportHeroCrop(source, { left: 300, top: 0, width: 160, height: 90 }),
    ).rejects.toThrow("이미지 영역을 다시 선택해주세요.");
  });
});
