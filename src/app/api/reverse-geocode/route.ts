import { NextResponse } from "next/server";
import { isSearchBot } from "@/shared/lib/infra/analytics-server";
import { reverseGeocodeKakao } from "@/shared/lib/infra/reverse-geocode";
import { reverseGeocodeQuerySchema } from "@/shared/lib/schema/reverse-geocode";

export async function GET(request: Request): Promise<NextResponse> {
  if (isSearchBot(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 204 });
  }

  const url = new URL(request.url);
  const parsed = reverseGeocodeQuerySchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const address = await reverseGeocodeKakao(parsed.data.lat, parsed.data.lng);
  if (!address) {
    return NextResponse.json({ error: "address not found" }, { status: 502 });
  }

  return NextResponse.json({ address }, { status: 200 });
}
