#!/usr/bin/env python3
"""Check the fixtures against their own stated arithmetic.

The expected values in fixtures/ are hand-computed, which is the point — a
generator tuned to match a constant can cancel out a broken transform, so the
expectation has to come from somewhere the pipeline cannot reach.

Hand-computed also means mistyped. This recomputes the ones that are pure
arithmetic from the inputs in the file, so a wrong number is caught here rather
than by a pipeline that fails and sends someone hunting the wrong bug.

    python3 test_fixtures.py
"""
import sys
from pathlib import Path

FIX = Path(__file__).resolve().parent / "fixtures"
REQUIRED = ("name", "guards", "input", "expected")
fails = []

try:
    import yaml
except ImportError:
    print("SKIP — PyYAML 없음. CI 는 설치하고 돈다")
    sys.exit(0)


def close(a, b, tol=1e-5):
    return abs(float(a) - float(b)) < tol


def main():
    files = sorted(FIX.glob("*.yml"))
    if len(files) != 7:
        fails.append(f"fixture 가 7개여야 하는데 {len(files)}개다")

    for f in files:
        d = yaml.safe_load(f.read_text(encoding="utf-8"))
        for k in REQUIRED:
            if k not in d:
                fails.append(f"{f.name}: {k} 없음")
        exp = d.get("expected", {})
        # Every fixture has to show its working. Without it a wrong expectation
        # is indistinguishable from a wrong pipeline.
        target = exp if isinstance(exp, dict) else {}
        if "working" not in target:
            fails.append(f"{f.name}: expected.working 없음 — 재계산 근거가 있어야 한다")

    # Spot-recompute the arithmetic ones straight from the inputs.
    def load(n):
        return yaml.safe_load((FIX / n).read_text(encoding="utf-8"))

    e = load("01-baseline.yml")["expected"]
    if not close(e["dental_pmpm"], e["allowed"] / e["member_months"]):
        fails.append("01: allowed / member_months 가 dental_pmpm 과 다르다")

    e = load("02-rehire-same-month.yml")["expected"]
    if not close(e["member_months"], 22 / 31):
        fails.append("02: 10일+12일 = 22/31 이어야 한다")

    e = load("03-retro-term.yml")["expected"]
    if not close(e["member_months"], 15 / 31):
        fails.append("03: 현행 버전만 15/31 이어야 한다")
    if not close(e["failure_mode"]["value"], (31 + 15) / 31):
        fails.append("03: 실패 모드는 두 버전이 모두 전개된 (31+15)/31 이다")

    e = load("05-midyear-plan-change.yml")["expected"]
    if not close(e["member_months"], 1.0):
        fails.append("05: 15일+16일 = 31일 = 1.0 이어야 한다")

    rows = load("07-month-length.yml")["expected"]["rows"]
    if not (close(rows[0]["dental_pmpm"], 30.0) and close(rows[1]["dental_pmpm"], 30.0)):
        fails.append("07: 실제 일수로 나누면 두 달 모두 30.00 이어야 한다")

    if fails:
        print(f"FAIL — {len(fails)}건")
        for x in fails:
            print(f"  ✗ {x}")
        return 1
    print(f"PASS — fixture {len(files)}개, 손 계산 재확인 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
