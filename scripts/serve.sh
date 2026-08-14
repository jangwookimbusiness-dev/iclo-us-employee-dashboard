#!/usr/bin/env bash
# Serve the dashboard over HTTP.
#
# Opening index.html straight off the disk still works today, because every
# number is a constant inside the file. It stops working once the screen
# fetches its data: fetch() from a file:// page has an opaque origin and the
# browser blocks it, so the screen comes up empty with a CORS error rather
# than an obvious failure. The tests hit the same wall, and gstack browse
# refuses file:// URLs outside /private/tmp anyway.
#
# Usage: bash scripts/serve.sh [port]
set -euo pipefail

PORT="${1:-8000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"
echo "→ http://localhost:${PORT}/  (Ctrl-C to stop)"
echo "  serving ${ROOT}"
# Cache-bust when iterating: http://localhost:PORT/?v=$(date +%s)
exec python3 -m http.server "$PORT" --bind 127.0.0.1
