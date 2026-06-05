import "server-only";

interface KakaoCoord2AddressDocument {
  address?: { address_name?: string };
  road_address?: { address_name?: string };
}

interface KakaoCoord2AddressResponse {
  documents?: KakaoCoord2AddressDocument[];
}

export async function reverseGeocodeKakao(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    console.error("[reverseGeocodeKakao] KAKAO_REST_API_KEY 미설정");
    return null;
  }

  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}&input_coord=WGS84`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[reverseGeocodeKakao] HTTP", res.status);
      return null;
    }
    const data = (await res.json()) as KakaoCoord2AddressResponse;
    const doc = data.documents?.[0];
    const road = doc?.road_address?.address_name;
    const jibun = doc?.address?.address_name;
    return road || jibun || null;
  } catch (err) {
    console.error("[reverseGeocodeKakao] fetch failed", err);
    return null;
  }
}
