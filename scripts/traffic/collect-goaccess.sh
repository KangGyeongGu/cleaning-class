set -euo pipefail

DATA_DIR="${TRAFFIC_DATA_DIR:-/home/ubuntu/traffic-data}"
DB_DIR="$DATA_DIR/goaccess/db"
OUT="$DATA_DIR/goaccess/report.json"
HTML_OUT="$DATA_DIR/goaccess/report.html"
LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"

mkdir -p "$DB_DIR"
[ -r "$LOG" ] || { echo "[ga] 로그를 읽을 수 없음: $LOG (권한 확인 — root 또는 adm 그룹)" >&2; exit 1; }

TMP="$(mktemp --suffix=.json)"
TMP_HTML="$(mktemp --suffix=.html)"
trap 'rm -f "$TMP" "$TMP_HTML"' EXIT

# 증분 처리:
#   --restore : 이전 DB 불러오기
#   --persist : 이번 파싱 결과를 DB에 누적 저장
#   GoAccess가 inode + 마지막 파싱 라인을 추적해 중복 없이 새 데이터만 반영.
# 참고: 봇/크롤러도 그대로 집계(Cloudflare가 봇 분리 제공 + 오리진 진실값 보존).
#       크롤러 제외하려면 --ignore-crawlers 추가.
goaccess "$LOG" \
  --log-format=COMBINED \
  --persist --restore \
  --db-path "$DB_DIR" \
  -o "$TMP" \
  -o "$TMP_HTML"

mv "$TMP" "$OUT"
mv "$TMP_HTML" "$HTML_OUT"
chmod 644 "$OUT" "$HTML_OUT"
echo "[ga] 갱신 완료: $OUT, $HTML_OUT"
