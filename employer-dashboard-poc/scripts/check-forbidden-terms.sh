#!/usr/bin/env bash
# Red-line enforcement — PRD §5.6. Any hit = exit 1 = CI failure = auto-reject.
# Scope: src/ and dist/ fully; docs/ except the spec's own red-line table (docs/PRD.md).
set -u
cd "$(dirname "$0")/.."   # always run from the project folder

PAT='diagnos|cavit|caries|decay|gingivit|periodont|abscess|lesion'
fail=0

# The shipped code is at the REPO root, not under this folder. Until 2026-08-14
# this script only looked at src/, dist/ and docs/ inside employer-dashboard-poc,
# so index.html — the actual screen — was never checked, and neither would
# app.html have been. The red line has to cover what ships.
for f in ../index.html ../app.html; do
  [ -f "$f" ] || continue
  hits=$(grep -niE "$PAT" "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in $(basename "$f"):"; echo "$hits"; fail=1; fi
  hits=$(grep -n '"Review"' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - banned signal label \"Review\" in $(basename "$f") (use \"Priority\"):"; echo "$hits"; fail=1; fi
done

if [ -d src ]; then
  hits=$(grep -rniE "$PAT" src 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in src:"; echo "$hits"; fail=1; fi
fi

if [ -d dist ]; then
  hits=$(grep -rniE "$PAT" dist 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in dist:"; echo "$hits"; fail=1; fi
fi

if [ -d docs ]; then
  hits=$(grep -rniE "$PAT" docs 2>/dev/null | grep -v '^docs/PRD\.md:' || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in docs (PRD.md excluded):"; echo "$hits"; fail=1; fi
fi

# Banned signal label "Review" (use "Priority") - UI strings, case-sensitive quoted literal
if [ -d src ]; then
  hits=$(grep -rn '"Review"' src 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - banned signal label \"Review\" in src (use \"Priority\"):"; echo "$hits"; fail=1; fi
fi

if [ "$fail" -eq 0 ]; then echo "red-line check passed"; fi
exit $fail
