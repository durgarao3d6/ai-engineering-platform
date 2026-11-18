#!/bin/sh
set -eu

web_url=${1:?Usage: sh scripts/smoke-deployment.sh WEB_URL API_URL}
api_url=${2:?Usage: sh scripts/smoke-deployment.sh WEB_URL API_URL}
web_url=${web_url%/}
api_url=${api_url%/}
repo_root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
sh "$repo_root/scripts/smoke-web.sh" "$web_url"

body=$(mktemp)
headers=$(mktemp)
trap 'rm -f "$body" "$headers"' EXIT

check_status() {
  expected=$1
  shift
  status=$(curl --silent --show-error --max-time 30 -D "$headers" -o "$body" -w '%{http_code}' "$@")
  if [ "$status" != "$expected" ]; then
    printf 'Expected HTTP %s, received %s for %s\n' "$expected" "$status" "$*" >&2
    exit 1
  fi
}

check_status 200 "$api_url/health"
grep -Fq '"status":"ok"' "$body"
check_status 200 "$api_url/ready"
grep -Fq '"status":"ready"' "$body"
check_status 404 "$api_url/v1/demo/runs"
check_status 401 "$api_url/v1/runs/00000000-0000-0000-0000-000000000000"
check_status 200 -X OPTIONS -H "Origin: $web_url" -H 'Access-Control-Request-Method: GET' "$api_url/health"
tr -d '\r' < "$headers" | grep -Fixq "access-control-allow-origin: $web_url"
check_status 400 -X OPTIONS -H 'Origin: https://denied.invalid' -H 'Access-Control-Request-Method: GET' "$api_url/health"
if grep -iq '^access-control-allow-origin:' "$headers"; then
  printf 'Unexpected CORS access from an unlisted origin\n' >&2
  exit 1
fi
printf 'Production API smoke checks passed for %s\n' "$api_url"
