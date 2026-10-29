import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { kstDate } from "@/shared/lib/pure/dashboard";

export function dailyVisitor(headers: Headers, now = new Date()) {
  const secret = process.env.ANALYTICS_HASH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("ANALYTICS_HASH_SECRET는 32자 이상이어야 합니다.");
  if (process.env.ANALYTICS_TRUST_CLOUDFLARE !== "true")
    throw new Error(
      "실제 접속 IP 전달 확인 후 ANALYTICS_TRUST_CLOUDFLARE를 설정해주세요.",
    );
  const ip = headers.get("cf-connecting-ip")?.trim();
  const agent = headers.get("user-agent")?.trim();
  if (!ip || !isIP(ip) || !agent)
    throw new Error("방문자 요청 정보를 확인할 수 없습니다.");
  const date = kstDate(now);
  const key = createHmac("sha256", secret)
    .update(JSON.stringify([date, ip, agent]))
    .digest("hex");
  return { date, key };
}
