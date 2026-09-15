#!/usr/bin/env bash
# Build and serve the demo screens and their JSON over local HTTP.
#
# Usage: bash scripts/serve.sh [port]
set -euo pipefail

PORT="${1:-8000}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"
test -x .venv/bin/python || { echo "Run 'make setup' first"; exit 1; }
.venv/bin/python scripts/build_screens.py
echo "→ http://localhost:${PORT}/employer.html  (Ctrl-C to stop)"
echo "→ http://localhost:${PORT}/member.html"
exec .venv/bin/python -m http.server "$PORT" --bind 127.0.0.1 --directory build
