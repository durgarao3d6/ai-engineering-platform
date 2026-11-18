#!/bin/sh
set -eu

base_url=${1:?Usage: sh scripts/smoke-web.sh WEB_URL}
base_url=${base_url%/}
body=$(mktemp)
trap 'rm -f "$body"' EXIT

check() {
  curl --fail --silent --show-error --location --max-time 30 "$base_url$1" -o "$body"
  if ! grep -Fq "$2" "$body"; then
    printf 'Expected "%s" at %s\n' "$2" "$1" >&2
    exit 1
  fi
}

check / 'Open sample dashboard'
check /dashboard 'Sample data'
check /dashboard/runs/checkout-baseline 'Reject expired coupon'
check '/dashboard/compare?baseline=checkout-baseline&candidate=checkout-candidate' 'Fixed'
printf 'Web smoke checks passed for %s\n' "$base_url"
