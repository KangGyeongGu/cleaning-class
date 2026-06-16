set -euo pipefail

DATA_DIR="${TRAFFIC_DATA_DIR:-/home/ubuntu/traffic-data}"
TOKEN_FILE="$DATA_DIR/.cf-token"
CONFIG_FILE="$DATA_DIR/.cf-config"
OUT_DIR="$DATA_DIR/cloudflare"

# --- 설정 로드 ---
[ -r "$TOKEN_FILE" ]  || { echo "[cf] 토큰 파일 없음: $TOKEN_FILE" >&2; exit 1; }
[ -r "$CONFIG_FILE" ] || { echo "[cf] 설정 파일 없음: $CONFIG_FILE" >&2; exit 1; }
TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
# shellcheck disable=SC1090
source "$CONFIG_FILE"   # ZONE_ID, ACCOUNT_ID
: "${ZONE_ID:?ZONE_ID 미설정 (.cf-config 확인)}"

# --- 수집 대상 날짜 (기본: 어제 UTC) ---
DATE="${1:-$(date -u -d 'yesterday' +%Y-%m-%d)}"
OUT="$OUT_DIR/${DATE}.json"
mkdir -p "$OUT_DIR"

# --- GraphQL 쿼리 ---
read -r -d '' QUERY <<'GRAPHQL' || true
query Traffic($zoneTag: String!, $date: String!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(limit: 1, filter: { date: $date }) {
        dimensions { date }
        uniq { uniques }
        sum {
          requests
          bytes
          cachedRequests
          cachedBytes
          encryptedRequests
          pageViews
          threats
          countryMap { clientCountryName requests bytes threats }
          responseStatusMap { edgeResponseStatus requests }
          browserMap { uaBrowserFamily pageViews }
          clientHTTPVersionMap { clientHTTPProtocol requests }
          ipClassMap { ipType requests }
          contentTypeMap { edgeResponseContentTypeName requests bytes }
          threatPathingMap { threatPathingName requests }
        }
      }
    }
  }
}
GRAPHQL

BODY="$(jq -n --arg q "$QUERY" --arg zt "$ZONE_ID" --arg d "$DATE" \
  '{query: $q, variables: {zoneTag: $zt, date: $d}}')"

# --- API 호출 ---
RESP="$(mktemp)"
trap 'rm -f "$RESP"' EXIT
HTTP="$(curl -s -4 -o "$RESP" -w '%{http_code}' \
  -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data "$BODY")"

# --- 에러 검사 ---
if [ "$HTTP" != "200" ]; then
  echo "[cf] HTTP $HTTP 오류:" >&2; cat "$RESP" >&2; exit 1
fi
if jq -e '.errors and (.errors | length > 0)' "$RESP" >/dev/null 2>&1; then
  echo "[cf] GraphQL 오류:" >&2; jq '.errors' "$RESP" >&2; exit 1
fi

# --- 해당 일자 그룹만 추출해 저장 ---
GROUP="$(jq -c '.data.viewer.zones[0].httpRequests1dGroups[0] // empty' "$RESP")"
if [ -z "$GROUP" ]; then
  echo "[cf] $DATE 데이터 없음 (아직 집계 전이거나 트래픽 없음) — 건너뜀" >&2
  exit 0
fi
TMP="$(mktemp)"
printf '%s\n' "$GROUP" > "$TMP"
mv "$TMP" "$OUT"
chmod 644 "$OUT"
echo "[cf] 저장 완료: $OUT"
