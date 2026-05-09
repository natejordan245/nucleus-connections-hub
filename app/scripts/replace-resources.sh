#!/usr/bin/env bash
# Replaces the placeholder seed resources in the live Supabase project with
# the curated Utah list in `src/lib/data/utah-resources.ts`. Idempotent —
# re-running deletes any remaining example.com placeholders and upserts the
# Utah set (refreshing embeddings).
#
# Requires:
#   - Dev server running at $PORT (defaults to 3000)
#   - `.env.local` populated with SUPABASE_SERVICE_ROLE_KEY
#
# Usage: ./scripts/replace-resources.sh [port]

set -euo pipefail

PORT="${1:-3000}"
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ Cannot find $ENV_FILE" >&2
  exit 1
fi

SVC=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' || true)
if [[ -z "$SVC" ]]; then
  echo "✗ SUPABASE_SERVICE_ROLE_KEY missing from $ENV_FILE" >&2
  exit 1
fi

URL="http://localhost:${PORT}/api/admin/replace-resources"
echo "→ POST $URL"

OUT=$(mktemp)
HTTP=$(curl -sS -o "$OUT" -w '%{http_code}' -X POST -H "Authorization: Bearer $SVC" "$URL")

if [[ "$HTTP" != "200" ]]; then
  echo "✗ HTTP $HTTP" >&2
  cat "$OUT" >&2
  rm -f "$OUT"
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  python3 -c "import json,sys; d=json.load(open('$OUT')); print(json.dumps(d.get('counts', d), indent=2)); errs=d.get('errors',[]); [print('ERR', e['id'], '→', e.get('error')) for e in errs[:10]]"
else
  cat "$OUT"
fi

rm -f "$OUT"
