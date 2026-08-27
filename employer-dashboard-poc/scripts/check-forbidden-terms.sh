#!/usr/bin/env bash
# Red-line enforcement — PRD §5.6. Any hit = exit 1 = CI failure = auto-reject.
set -u
cd "$(dirname "$0")/.."   # always run from the project folder

# 이 목록은 정본 `terminology.disease_words_banned` 와 같아야 한다.
# `check-package-consistency.py` 의 `check_red_line_words` 가 그 동일성을 검사한다.
# 여기서 정본을 직접 읽지 않는 이유는 이 스크립트가 첫 게이트이고 아직 파이썬·
# PyYAML 을 요구하지 않는다는 것뿐이다. 대조는 뒤 게이트가 한다.
PAT='diagnos|cavit|caries|decay|gingivit|periodont|abscess|lesion'
fail=0

# 스캔 대상. 2026-08-14 까지 이 스크립트는 employer-dashboard-poc 안의 src/·dist/·
# docs/ 만 봤고, 그래서 실제 화면이 한 번도 검사되지 않았다. 제안서도 본다 —
# 배포 코드만 검사하고 밖으로 나가는 문서를 빼두면 레드라인이 가장 많이 읽히는
# 곳에서만 안 걸린다.
#
# 2026-08-27 (#49): `index.html` 과 `app.html` 이 목록에서 빠졌다. 지웠기 때문이고,
# **없는 경로를 남겨두면 이 스크립트가 실패한다** — 그것이 #45 에서 넣은 규칙이다.
# 두 화면의 자리는 아래 두 템플릿이 받는다.
#
# `screens/employer.html.in` 은 재구축 화면의 원본이다. 렌더된 화면 쪽은
# `test_build_reads_canon.py` 의 `prose_guards` 가 정본 목록으로 본다 — 라벨이
# 정본에서 오므로 파일만 읽어서는 화면 문구를 다 볼 수 없다. 이쪽은 템플릿 산문,
# 저쪽은 렌더 결과이고 둘 다 필요하다.
FILES=(
  ../pages-root-redirect.html
  ../screens/employer.html.in
  ../screens/member.html.in
)
GLOBS=(
  '../output/proposal-v12/*.md'
  '../output/status/*.md'
  '../output/analysis/*.md'
)

# **없는 경로는 건너뛰지 않고 실패한다.** 2026-08-27 까지 `[ -f "$f" ] || continue`
# 였다. 재구축 헌장 §4.1 의 폐기 조건 2번이 그것을 지적한다: 헌 화면을 지우면
# 규제 스캔이 조용히 통과한다. 빈 글롭도 같다 — bash 는 안 맞는 글롭을 리터럴
# 문자열로 남기므로 디렉터리 이름이 바뀌면 제안서가 목록에서 소리 없이 빠진다.
scan_targets=()
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "RED LINE SCAN - declared path is gone: $f"
    echo "  스캔 목록에서 지우려면 그 결정을 여기에 적어라. 사라진 경로를"
    echo "  건너뛰면 레드라인 검사가 통과하면서 아무것도 안 본다."
    fail=1
    continue
  fi
  scan_targets+=("$f")
done
for g in "${GLOBS[@]}"; do
  matched=0
  for f in $g; do
    [ -f "$f" ] || continue
    scan_targets+=("$f")
    matched=1
  done
  if [ "$matched" -eq 0 ]; then
    echo "RED LINE SCAN - glob matched nothing: $g"
    fail=1
  fi
done

for f in "${scan_targets[@]}"; do
  hits=$(grep -niE "$PAT" "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in $(basename "$f"):"; echo "$hits"; fail=1; fi
  hits=$(grep -n '"Review"' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "RED LINE - banned signal label \"Review\" in $(basename "$f") (use \"Priority\"):"; echo "$hits"; fail=1; fi
done

# docs/ 는 이 폴더 안에 있고 PRD 자신의 레드라인 표는 뺀다.
# src/ 와 dist/ 블록이 여기 있었다. **폐기된 npm·Vite 계획의 산물이고 두 디렉터리는
# 없다** — `[ -d src ]` 가 언제나 거짓이라 그 블록들은 한 번도 돈 적이 없다. 돌 수
# 없는 검사를 남겨두면 커버리지 주장만 남는다. 계획이 폐기됐으므로 같이 지운다.
if [ ! -d docs ]; then
  echo "RED LINE SCAN - docs/ is gone (expected employer-dashboard-poc/docs)"
  fail=1
else
  hits=$(grep -rniE "$PAT" docs 2>/dev/null | grep -v '^docs/PRD\.md:' || true)
  if [ -n "$hits" ]; then echo "RED LINE - forbidden terms in docs (PRD.md excluded):"; echo "$hits"; fail=1; fi
fi

if [ "$fail" -eq 0 ]; then
  echo "red-line check passed — ${#scan_targets[@]} files + docs/"
fi
exit $fail
