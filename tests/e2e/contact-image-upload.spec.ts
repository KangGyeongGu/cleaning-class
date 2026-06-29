import { test, expect } from "@playwright/test";

function makeJpegBuffer(sizeBytes: number): Buffer {
  const buf = Buffer.alloc(sizeBytes);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  return buf;
}

test.describe("견적문의 이미지 업로드", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("5장 이상 첨부 시 알림으로 거부된다", async ({ page }) => {
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    const files = Array.from({ length: 5 }, (_, i) => ({
      name: `photo${i + 1}.jpg`,
      mimeType: "image/jpeg",
      buffer: makeJpegBuffer(100),
    }));

    await page.locator('input[name="images"]').setInputFiles(files);

    await expect(page.getByText("0/4")).toBeVisible();
    expect(dialogMessage).toContain("4");
  });

  test("개별 25MB 초과 파일은 알림으로 거부된다", async ({ page }) => {
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('input[name="images"]').setInputFiles([
      {
        name: "big.jpg",
        mimeType: "image/jpeg",
        buffer: makeJpegBuffer(26 * 1024 * 1024),
      },
    ]);

    await expect(page.getByText("0/4")).toBeVisible();
    expect(dialogMessage).toContain("25MB");
  });

  test("PDF 등 미허용 MIME 은 알림으로 거부된다", async ({ page }) => {
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('input[name="images"]').setInputFiles([
      {
        name: "doc.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n"),
      },
    ]);

    await expect(page.getByText("0/4")).toBeVisible();
    expect(dialogMessage).toContain("형식");
  });

  test("미허용 확장자(.txt) 는 알림으로 거부된다", async ({ page }) => {
    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.locator('input[name="images"]').setInputFiles([
      {
        name: "note.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello"),
      },
    ]);

    await expect(page.getByText("0/4")).toBeVisible();
    expect(dialogMessage).toMatch(/형식|확장자/);
  });

  test("유효한 JPEG 1~2장 첨부 시 카운터가 갱신된다", async ({ page }) => {
    await page.locator('input[name="images"]').setInputFiles([
      {
        name: "photo1.jpg",
        mimeType: "image/jpeg",
        buffer: makeJpegBuffer(200),
      },
      {
        name: "photo2.jpg",
        mimeType: "image/jpeg",
        buffer: makeJpegBuffer(200),
      },
    ]);

    await expect(page.getByText("2/4")).toBeVisible();
  });
});
