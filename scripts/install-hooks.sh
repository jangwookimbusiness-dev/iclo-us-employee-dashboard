#!/usr/bin/env bash
# Install the pre-commit hook. Run once per clone:
#
#     bash scripts/install-hooks.sh
#
# The hook runs only the two fast checks — red lines and canon consistency,
# both well under a second. The two render tests drive headless Chrome over 54
# states and belong in CI, not in the path between you and a commit.
#
# This exists because a failed CI run costs the same minutes as a passing one.
# Catching an obvious break locally keeps the budget for real failures.
# It is a guard, not a gate: `git commit --no-verify` still goes through, and
# that is deliberate — the enforcement conversation belongs to A2, when real
# data arrives.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" <<'HOOK_BODY'
#!/usr/bin/env bash
# Installed by scripts/install-hooks.sh — edit that, not this.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

fail=0
printf 'pre-commit: red lines … '
if out=$(bash employer-dashboard-poc/scripts/check-forbidden-terms.sh 2>&1); then
  printf 'ok\n'
else
  printf 'FAIL\n%s\n' "$out"; fail=1
fi

printf 'pre-commit: canon consistency … '
if out=$(python3 scripts/check-package-consistency.py 2>&1); then
  printf 'ok\n'
else
  printf 'FAIL\n%s\n' "$out"; fail=1
fi

# 순수 해시 대조라 1초 안에 끝난다. md 를 고치고 PDF·스크린샷을 안 만들면 여기서
# 멈춘다 — 기술문서 PDF 가 md 와 다른 판으로 커밋된 일이 실제로 있었고, 잡은 것은
# 검사가 아니라 우연한 질문이었다. 고치는 명령은 실패 메시지가 알려준다.
printf 'pre-commit: doc freshness … '
if out=$(python3 test_doc_freshness.py 2>&1); then
  printf 'ok\n'
else
  printf 'FAIL\n%s\n' "$out"; fail=1
fi

if [ "$fail" -ne 0 ]; then
  printf '\nCommit stopped. Fix the above, or use --no-verify if you mean it.\n'
  exit 1
fi
exit 0
HOOK_BODY

chmod +x "$HOOK"
echo "installed → .git/hooks/pre-commit"
echo "  runs: check-forbidden-terms.sh, check-package-consistency.py, test_doc_freshness.py"
echo "  the two render tests stay in CI (.github/workflows/gates.yml)"
