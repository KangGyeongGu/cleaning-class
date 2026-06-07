import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

interface MailImage {
  filename: string;
  content: Buffer;
}

export interface ContactEmailData {
  inquiryType: "cleaning" | "moving";
  name: string;
  phone: string;
  serviceType: string;
  address?: string;
  departureAddress?: string;
  destinationAddress?: string;
  message: string;
  images?: MailImage[];
  receivedAt?: Date;
}

function sanitizeHeader(str: string): string {
  return str.replace(/[\r\n]/g, " ");
}

function sanitizeFilename(name: string): string {
  const sanitized = name
    .replace(/[/\\:*?"<>|\r\n]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized || "attachment";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatKstDateTime(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mi = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} KST`;
}

let cachedTransporter: Mail | null = null;

function getTransporter(): Mail {
  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT);
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      isNaN(port)
    ) {
      throw new Error("SMTP 환경변수가 설정되지 않았습니다");
    }
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return cachedTransporter;
}

export interface AttachmentForBody {
  filename: string;
  cid: string;
}

function rowHtml(label: string, value: string): string {
  return `
    <tr>
      <td width="80" style="padding:6px 12px 6px 0;font-size:12px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;font-size:14px;color:#0f172a;vertical-align:top;">${value}</td>
    </tr>`;
}

function mapLinkOrPlain(addr: string | undefined): string {
  const trimmed = addr?.trim() ?? "";
  if (!trimmed) return escapeHtml("미입력");
  const safe = escapeHtml(trimmed);
  const url = `https://map.kakao.com/?q=${encodeURIComponent(trimmed)}`;
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-left:4px;"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`;
  return `<a href="${url}" target="_blank" rel="noopener" style="color:#0f172a;text-decoration:underline;">${safe}${icon}</a>`;
}

function buildImageGrid(attachments: AttachmentForBody[]): string {
  if (attachments.length === 0) return "";
  const items = attachments
    .map(
      (a, i) => `
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:6px;">${i + 1} / ${attachments.length} · ${escapeHtml(a.filename)}</div>
        <img src="cid:${a.cid}" alt="${escapeHtml(a.filename)}" style="display:block;width:100%;max-width:552px;height:auto;border:1px solid #e2e8f0;" />
      </div>`,
    )
    .join("");
  return `
    <tr><td style="padding:20px 24px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;margin-bottom:12px;">첨부 사진 (${attachments.length}장)</div>
      ${items}
    </td></tr>`;
}

export function buildContactHtml(
  data: ContactEmailData,
  attachments: AttachmentForBody[],
): string {
  const isMoving = data.inquiryType === "moving";
  const badgeText = isMoving ? "이사 의뢰" : "청소 의뢰";
  const receivedAt = formatKstDateTime(data.receivedAt ?? new Date());
  const phoneDigits = data.phone.replace(/[^0-9]/g, "");

  const detailRows: string[] = [
    rowHtml("서비스", escapeHtml(data.serviceType)),
  ];
  if (isMoving) {
    detailRows.push(rowHtml("출발지", mapLinkOrPlain(data.departureAddress)));
    detailRows.push(rowHtml("도착지", mapLinkOrPlain(data.destinationAddress)));
  } else {
    detailRows.push(rowHtml("주소", mapLinkOrPlain(data.address)));
  }

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>견적 문의</title>
  </head>
  <body style="margin:0;padding:24px 0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;line-height:1.6;">
    <table cellpadding="0" cellspacing="0" border="0" align="center" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#0f172a;color:#ffffff;padding:20px 24px;">
          <div style="font-size:18px;font-weight:700;">청소클라쓰 새 견적 문의</div>
          <div style="margin-top:6px;font-size:12px;color:#cbd5e1;">
            <span style="display:inline-block;padding:2px 8px;background:#334155;border-radius:2px;color:#ffffff;font-weight:600;margin-right:8px;">${badgeText}</span>
            ${receivedAt}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;padding-bottom:4px;">이름</td>
              <td style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;padding-bottom:4px;text-align:right;">연락처</td>
            </tr>
            <tr>
              <td style="font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(data.name)}</td>
              <td style="text-align:right;">
                <a href="tel:${escapeHtml(phoneDigits)}" style="font-size:16px;font-weight:700;color:#0f172a;text-decoration:none;">📞 ${escapeHtml(data.phone)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRows.join("")}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 20px 24px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;margin-bottom:8px;">문의 내용</div>
          <div style="padding:12px 14px;background:#f8fafc;border-left:3px solid #0f172a;font-size:14px;color:#0f172a;white-space:pre-wrap;">${escapeHtml(data.message).replace(/\n/g, "<br>")}</div>
        </td>
      </tr>
      ${buildImageGrid(attachments)}
      <tr>
        <td style="padding:16px 24px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
          청소클라쓰 견적문의 시스템
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPlainText(data: ContactEmailData): string {
  const isMoving = data.inquiryType === "moving";
  const lines = [
    `[${isMoving ? "이사 의뢰" : "청소 의뢰"}]`,
    `이름: ${data.name}`,
    `연락처: ${data.phone}`,
    `서비스: ${data.serviceType}`,
  ];
  if (isMoving) {
    lines.push(`출발지: ${data.departureAddress?.trim() || "미입력"}`);
    lines.push(`도착지: ${data.destinationAddress?.trim() || "미입력"}`);
  } else {
    lines.push(`주소: ${data.address?.trim() || "미입력"}`);
  }
  lines.push("", "문의 내용:", data.message);
  return lines.join("\n").trim();
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  if (!process.env.ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL 환경변수가 설정되지 않았습니다");
  }
  const transporter = getTransporter();

  const isMoving = data.inquiryType === "moving";
  const subject = isMoving
    ? `[청소클라쓰] 새 이사 견적문의 - ${sanitizeHeader(data.name)}`
    : `[청소클라쓰] 새 견적문의 - ${sanitizeHeader(data.name)}`;

  const attachments = (data.images ?? []).map((img, i) => ({
    filename: sanitizeFilename(img.filename),
    content: img.content,
    cid: `image${i + 1}`,
  }));

  const htmlContent = buildContactHtml(
    data,
    attachments.map((a) => ({ filename: a.filename, cid: a.cid })),
  );

  await transporter.sendMail({
    from: `"청소클라쓰 견적문의" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject,
    html: htmlContent,
    text: buildPlainText(data),
    ...(attachments.length > 0 ? { attachments } : {}),
  });
}
