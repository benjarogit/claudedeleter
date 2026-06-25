#!/usr/bin/env bash
# Sign and submit acc-firefox.xpi to AMO (optional — needs API keys).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${WEB_EXT_API_KEY:-}" || -z "${WEB_EXT_API_SECRET:-}" ]]; then
  echo "Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET (AMO developer credentials)." >&2
  echo "Manual upload: dist/acc-firefox.xpi — see docs/STORE_SUBMIT.md" >&2
  exit 1
fi

npm run build
npx --yes web-ext sign \
  --source-dir="$ROOT/dist/firefox" \
  --api-key="$WEB_EXT_API_KEY" \
  --api-secret="$WEB_EXT_API_SECRET" \
  --channel=listed

echo "Signed XPI written to web-ext-artifacts/ (or AMO queue). Check developer hub for status."
