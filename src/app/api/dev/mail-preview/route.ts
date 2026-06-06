import { NextResponse } from "next/server";
import {
  buildContactHtml,
  type ContactEmailData,
} from "@/shared/lib/infra/mail";

const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e2e8f0"/><text x="50%" y="55%" font-family="-apple-system,sans-serif" font-size="12" fill="#64748b" text-anchor="middle">사진</text></svg>',
)}`;

function buildSampleData(inquiryType: "cleaning" | "moving"): ContactEmailData {
  if (inquiryType === "moving") {
    return {
      inquiryType: "moving",
      name: "이사남",
      phone: "010-1234-5678",
      serviceType: "원룸이사",
      departureAddress: "서울 강남구 테헤란로 1 1층",
      destinationAddress: "전북 전주시 완산구 효자로 1",
      message:
        "원룸 이사 견적 부탁드립니다.\n· 짐 박스 약 30개, 냉장고/세탁기 포함\n· 11/20 또는 21일 가능",
      receivedAt: new Date(),
    };
  }
  return {
    inquiryType: "cleaning",
    name: "홍길동",
    phone: "010-1234-5678",
    serviceType: "거주청소",
    address: "전북 전주시 완산구 효자로 1 101동 101호",
    message:
      "예) 25평 아파트 거주청소\n· 화장실 곰팡이 제거 필요\n· 11/15 또는 16일 오전 가능",
    receivedAt: new Date(),
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const inquiryType: "cleaning" | "moving" =
    url.searchParams.get("type") === "moving" ? "moving" : "cleaning";
  const withImages = url.searchParams.get("images") !== "0";

  const sample = buildSampleData(inquiryType);
  const sampleAttachments = withImages
    ? [
        { filename: "current_living_room.jpg", cid: "image1" },
        { filename: "bathroom.jpg", cid: "image2" },
        { filename: "kitchen.jpg", cid: "image3" },
      ]
    : [];

  let html = buildContactHtml(sample, sampleAttachments);
  html = html.replace(/src="cid:[^"]+"/g, `src="${PLACEHOLDER_SVG}"`);

  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
