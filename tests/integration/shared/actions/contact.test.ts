import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendContactEmail = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);

vi.mock("@/shared/lib/infra/mail", () => ({
  sendContactEmail: mockSendContactEmail,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

const SAMPLE_MESSAGE_50 =
  "8평 원룸 주거 청소 견적 문의드립니다. 주방 기름때와 유리창, 화장실 환풍구까지 전체 청소가 필요합니다. 일정은 다음 주 가능합니다.";

function buildCleaningForm(
  overrides: Partial<Record<string, FormDataEntryValue>> = {},
): FormData {
  const fd = new FormData();
  fd.set("inquiryType", "cleaning");
  fd.set("name", "홍길동");
  fd.set("phone", "010-1234-5678");
  fd.set("serviceType", "거주청소");
  fd.set("address", "전북 전주시 효자로 1");
  fd.set("addressDetail", "101동 101호");
  fd.set("message", SAMPLE_MESSAGE_50);
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, String(v));
  }
  return fd;
}

function buildMovingForm(): FormData {
  const fd = new FormData();
  fd.set("inquiryType", "moving");
  fd.set("name", "이사남");
  fd.set("phone", "010-1234-5678");
  fd.set("serviceType", "원룸이사");
  fd.set("departureAddress", "서울 강남구 테헤란로");
  fd.set("departureDetail", "1층");
  fd.set("destinationAddress", "전북 전주시 효자로");
  fd.set("destinationDetail", "");
  fd.set("message", SAMPLE_MESSAGE_50);
  return fd;
}

function makeFile(name: string, size: number, type = "image/jpeg"): File {
  const bytes = new Uint8Array(size);
  const file = new File([bytes], name, { type });
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => bytes.buffer,
    });
  }
  return file;
}

describe("submitContactForm — validation", () => {
  it("returns errors when Zod fails (phone format)", async () => {
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(
      null,
      buildCleaningForm({ phone: "not-a-phone" }),
    );
    expect(result.success).toBe(false);
    expect(mockSendContactEmail).not.toHaveBeenCalled();
  });

  it("defaults inquiryType to 'cleaning' when missing", async () => {
    const fd = buildCleaningForm();
    fd.delete("inquiryType");
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(true);
  });
});

describe("submitContactForm — cleaning path", () => {
  it("sends email with merged address for cleaning inquiry", async () => {
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, buildCleaningForm());
    expect(result.success).toBe(true);
    expect(mockSendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        inquiryType: "cleaning",
        address: "전북 전주시 효자로 1 101동 101호",
        departureAddress: undefined,
        destinationAddress: undefined,
      }),
    );
  });

  it("omits detail when blank", async () => {
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(
      null,
      buildCleaningForm({ addressDetail: "" }),
    );
    expect(result.success).toBe(true);
    expect(mockSendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({ address: "전북 전주시 효자로 1" }),
    );
  });
});

describe("submitContactForm — moving path", () => {
  it("sends email with merged departure/destination for moving inquiry", async () => {
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, buildMovingForm());
    expect(result.success).toBe(true);
    expect(mockSendContactEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        inquiryType: "moving",
        departureAddress: "서울 강남구 테헤란로 1층",
        destinationAddress: "전북 전주시 효자로",
        address: undefined,
      }),
    );
  });
});

describe("submitContactForm — image validation", () => {
  it("rejects more than 4 images", async () => {
    const fd = buildCleaningForm();
    for (let i = 0; i < 5; i++) {
      fd.append("images", makeFile(`a${i}.jpg`, 1000));
    }
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("4");
  });

  it("rejects single image over 25MB", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("big.jpg", 26 * 1024 * 1024));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("25MB");
  });

  it("rejects disallowed MIME type", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("doc.pdf", 1000, "application/pdf"));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("형식");
  });

  it("rejects mismatched extension", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("noext", 1000));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(false);
    expect(result.error).toContain("확장자");
  });

  it("accepts valid images and forwards to email", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("photo.jpg", 1000));
    fd.append("images", makeFile("evil/../etc.png", 1000, "image/png"));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(true);
    const call = mockSendContactEmail.mock.calls[0][0];
    expect(call.images).toHaveLength(2);
    expect(call.images[1].filename).not.toContain("/");
  });

  it("strips illegal filename characters from attachments", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile(":<>|.jpg", 1000));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(true);
    const call = mockSendContactEmail.mock.calls[0][0];
    expect(call.images[0].filename).toBe(".jpg");
  });

  it("replaces non-ascii filename characters with underscore", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("사진.jpg", 1000));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(true);
    const call = mockSendContactEmail.mock.calls[0][0];
    expect(call.images[0].filename).toBe("__.jpg");
  });

  it("filters out empty/zero-size files from images list", async () => {
    const fd = buildCleaningForm();
    fd.append("images", makeFile("a.jpg", 0));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, fd);
    expect(result.success).toBe(true);
    const call = mockSendContactEmail.mock.calls[0][0];
    expect(call.images).toBeUndefined();
  });
});

describe("submitContactForm — email failure", () => {
  it("returns failure when sendContactEmail throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSendContactEmail.mockRejectedValueOnce(new Error("SMTP down"));
    const { submitContactForm } = await import("@/shared/actions/contact");
    const result = await submitContactForm(null, buildCleaningForm());
    expect(result.success).toBe(false);
    expect(result.error).toContain("전화");
    consoleSpy.mockRestore();
  });
});
