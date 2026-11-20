#!/bin/sh
set -eu

base_url=${1:?Usage: sh scripts/smoke-web.sh WEB_URL}
base_url=${base_url%/}
body=$(mktemp)
trap 'rm -f "$body"' EXIT

check() {
  curl --fail --silent --show-error --location --max-time 30 "$base_url$1" -o "$body"
  path=$1
  shift
  for expected in "$@"; do
    if grep -Fq "$expected" "$body"; then
      return
    fi
  done
  printf 'Expected one of "%s" at %s\n' "$*" "$path" >&2
  exit 1
}

check / 'Open sample dashboard' 'Workspace access token'
check /dashboard 'Sample data'
check /dashboard/runs/checkout-baseline 'Reject expired coupon'
check '/dashboard/compare?baseline=checkout-baseline&candidate=checkout-candidate' 'Fixed'
printf 'Web smoke checks passed for %s\n' "$base_url"
