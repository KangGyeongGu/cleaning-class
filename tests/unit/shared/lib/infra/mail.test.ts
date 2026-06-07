import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendMail = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockCreateTransport = vi.hoisted(() =>
  vi.fn(() => ({ sendMail: mockSendMail })),
);

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "465",
    SMTP_USER: "user@example.com",
    SMTP_PASS: "secret",
    ADMIN_EMAIL: "admin@example.com",
  };
});

describe("sendContactEmail — cleaning inquiry", () => {
  it("sends mail with cleaning subject + HTML containing all fields", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "홍길동",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전북 전주시 효자로 1",
      message: "문의합니다",
      receivedAt: new Date("2026-06-05T05:00:00Z"),
    });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.subject).toContain("새 견적문의");
    expect(arg.subject).toContain("홍길동");
    expect(arg.html).toContain("홍길동");
    expect(arg.html).toContain("전북 전주시 효자로 1");
    expect(arg.html).toContain("거주청소");
    expect(arg.html).toContain('href="tel:01011112222"');
    expect(arg.html).toContain("청소 의뢰");
    expect(arg.text).toContain("거주청소");
  });

  it("escapes HTML special characters in name/message", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "<script>",
      phone: "010-1234-5678",
      serviceType: "거주청소",
      address: "전주",
      message: "&<>\"'",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.html).not.toContain("<script>");
    expect(arg.html).toContain("&lt;script&gt;");
    expect(arg.html).toContain("&amp;");
  });

  it("sanitizes CR/LF in subject (header injection prevention)", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "홍\r\n악의적 헤더",
      phone: "010-1234-5678",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.subject).not.toMatch(/[\r\n]/);
  });

  it("includes attachments with cid when images provided", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
      images: [
        { filename: "photo.jpg", content: Buffer.from([0xff, 0xd8]) },
        {
          filename: "/etc/passwd\r\n",
          content: Buffer.from([0xff]),
        },
      ],
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.attachments).toHaveLength(2);
    expect(arg.attachments[0].cid).toBe("image1");
    expect(arg.attachments[1].cid).toBe("image2");
    expect(arg.html).toContain('src="cid:image1"');
    expect(arg.attachments[1].filename).not.toContain("/");
    expect(arg.attachments[1].filename).not.toMatch(/[\r\n]/);
  });

  it("omits attachments when images array is empty", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
      images: [],
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.attachments).toBeUndefined();
  });

  it("uses '미입력' fallback when address is missing", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      message: "x",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.html).toContain("미입력");
    expect(arg.text).toContain("미입력");
  });

  it("uses current date when receivedAt is not provided", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.html).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("sendContactEmail — moving inquiry", () => {
  it("uses moving subject + departure/destination fields", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "moving",
      name: "이사남",
      phone: "010-1111-2222",
      serviceType: "원룸이사",
      departureAddress: "서울 강남",
      destinationAddress: "전주 덕진",
      message: "이사 문의",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.subject).toContain("새 이사 견적문의");
    expect(arg.html).toContain("서울 강남");
    expect(arg.html).toContain("전주 덕진");
    expect(arg.html).toContain("이사 의뢰");
    expect(arg.text).toContain("출발지");
  });

  it("uses '미입력' fallback for missing departure/destination", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "moving",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "원룸이사",
      message: "이사",
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.html).toContain("미입력");
    expect(arg.text).toContain("미입력");
  });
});

describe("sendContactEmail — config validation", () => {
  it("throws when SMTP_HOST missing", async () => {
    delete process.env.SMTP_HOST;
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await expect(
      sendContactEmail({
        inquiryType: "cleaning",
        name: "x",
        phone: "010-1111-2222",
        serviceType: "거주청소",
        address: "전주",
        message: "x",
      }),
    ).rejects.toThrow(/SMTP/);
  });

  it("throws when SMTP_PORT is non-numeric", async () => {
    process.env.SMTP_PORT = "not-a-number";
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await expect(
      sendContactEmail({
        inquiryType: "cleaning",
        name: "x",
        phone: "010-1111-2222",
        serviceType: "거주청소",
        address: "전주",
        message: "x",
      }),
    ).rejects.toThrow();
  });

  it("throws when SMTP_USER missing", async () => {
    delete process.env.SMTP_USER;
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await expect(
      sendContactEmail({
        inquiryType: "cleaning",
        name: "x",
        phone: "010-1111-2222",
        serviceType: "거주청소",
        address: "전주",
        message: "x",
      }),
    ).rejects.toThrow();
  });

  it("throws when SMTP_PASS missing", async () => {
    delete process.env.SMTP_PASS;
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await expect(
      sendContactEmail({
        inquiryType: "cleaning",
        name: "x",
        phone: "010-1111-2222",
        serviceType: "거주청소",
        address: "전주",
        message: "x",
      }),
    ).rejects.toThrow();
  });

  it("throws when ADMIN_EMAIL missing", async () => {
    delete process.env.ADMIN_EMAIL;
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await expect(
      sendContactEmail({
        inquiryType: "cleaning",
        name: "x",
        phone: "010-1111-2222",
        serviceType: "거주청소",
        address: "전주",
        message: "x",
      }),
    ).rejects.toThrow(/ADMIN_EMAIL/);
  });

  it("caches transporter across calls (createTransport called once)", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "a",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
    });
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "b",
      phone: "010-3333-4444",
      serviceType: "정기청소",
      address: "전주",
      message: "y",
    });
    expect(mockCreateTransport).toHaveBeenCalledOnce();
  });

  it("uses empty filename fallback when sanitized name becomes empty", async () => {
    const { sendContactEmail } = await import("@/shared/lib/infra/mail");
    await sendContactEmail({
      inquiryType: "cleaning",
      name: "x",
      phone: "010-1111-2222",
      serviceType: "거주청소",
      address: "전주",
      message: "x",
      images: [{ filename: "/\\:*?<>|", content: Buffer.from([0xff]) }],
    });
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.attachments[0].filename).toBe("attachment");
  });
});
