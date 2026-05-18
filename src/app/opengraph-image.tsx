import { ImageResponse } from "next/og";
import { createStaticClient } from "@/shared/lib/supabase/static";
import { formatPhoneNumber } from "@/shared/lib/format";

export const runtime = "nodejs";
export const alt = "청소클라쓰 — 전북 전주 전문 청소·이사 서비스";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("site_config")
    .select("phone, moving_phone")
    .single();

  const cleaningPhone = data?.phone
    ? formatPhoneNumber(data.phone)
    : "063-123-4567";
  const movingPhone = data?.moving_phone
    ? formatPhoneNumber(data.moving_phone)
    : null;

  return new ImageResponse(
    <div
      style={{
        background: "#ffffff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "#0f172a",
          display: "flex",
        }}
      />

      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-1px",
          marginBottom: 16,
          display: "flex",
        }}
      >
        청소클라쓰
      </div>

      <div
        style={{
          fontSize: 28,
          color: "#64748b",
          marginBottom: 48,
          display: "flex",
        }}
      >
        전북 전주 전문 청소·이사 서비스
      </div>

      <div
        style={{
          width: 64,
          height: 1,
          background: "#cbd5e1",
          marginBottom: 48,
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: "#94a3b8",
              letterSpacing: "2px",
              display: "flex",
            }}
          >
            청소 상담
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0f172a",
              display: "flex",
            }}
          >
            {cleaningPhone}
          </div>
        </div>

        {movingPhone ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                letterSpacing: "2px",
                display: "flex",
              }}
            >
              이사 상담
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
              }}
            >
              {movingPhone}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    { ...size },
  );
}
