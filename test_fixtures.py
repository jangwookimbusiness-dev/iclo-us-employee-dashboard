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

    def load(n):
        return yaml.safe_load((FIX / n).read_text(encoding="utf-8"))

    # Recompute from the inputs, not from other numbers in `expected`.
    # The first version of this compared expected values against each other,
    # which is internal consistency, not verification — changing an input left
    # it green. codex caught that on 2026-08-15.
    from datetime import date

    def d8(v):
        # PyYAML turns an unquoted 2026-01-31 into a date, not a string.
        return v if isinstance(v, date) else date.fromisoformat(str(v))

    def dur(s, open_end=None):
        """Days a span covers, inclusive, from the fixture's own input.

        `to: null` means still open; the caller says what the month's end is.
        """
        a = d8(s["from"])
        if s.get("to") is None:
            return open_end
        return (d8(s["to"]) - a).days + 1

    def spans(n, keep=lambda s: True):
        return [s for s in load(n)["input"]["eligibility_spans"] if keep(s)]

    def allowed(n):
        return sum(c["allowed"] for c in load(n)["input"].get("claims", []))

    JAN = 31

    d = load("01-baseline.yml")
    mm = sum(dur(s) for s in spans("01-baseline.yml")) / JAN
    if not close(d["expected"]["member_months"], mm):
        fails.append(f"01: 입력에서 {mm} 인데 expected 는 {d['expected']['member_months']}")
    if not close(d["expected"]["dental_pmpm"], allowed("01-baseline.yml") / mm):
        fails.append("01: allowed / member_months 가 expected 와 다르다")

    mm = sum(dur(s) for s in spans("02-rehire-same-month.yml")) / JAN
    if not close(load("02-rehire-same-month.yml")["expected"]["member_months"], mm):
        fails.append(f"02: 입력에서 {mm}")

    # 현행 버전만 (superseded_by 가 없는 것). 실패 모드는 둘 다 전개한 값.
    cur = spans("03-retro-term.yml", lambda s: not s.get("superseded_by"))
    e = load("03-retro-term.yml")["expected"]
    if not close(e["member_months"], sum(dur(s) for s in cur) / JAN):
        fails.append("03: 현행 버전만 전개한 값과 다르다")
    both = sum(dur(s, open_end=JAN) for s in spans("03-retro-term.yml"))
    if not close(e["failure_mode"]["value"], both / JAN):
        fails.append("03: 실패 모드가 두 버전 합과 다르다")

    e = load("04-two-employers.yml")["expected"]
    for row in e["rows"]:
        want = sum(c["allowed"] for c in load("04-two-employers.yml")["input"]["claims"]
                   if c["employer"] == row["employer"])
        if not close(row["allowed"], want):
            fails.append(f"04: {row['employer']} 의 allowed 가 입력과 다르다")

    e = load("05-midyear-plan-change.yml")["expected"]
    mm = sum(dur(s) for s in spans("05-midyear-plan-change.yml")) / JAN
    if not close(e["member_months"], mm):
        fails.append("05: 두 span 합이 expected 와 다르다")
    if not close(e["dental_pmpm"], allowed("05-midyear-plan-change.yml") / mm):
        fails.append("05: PMPM 이 입력 청구와 다르다")

    e = load("06-idempotency.yml")["expected"]
    if not close(e["member_months"], dur(spans("06-idempotency.yml")[0]) / JAN):
        fails.append("06: 한 번 돌린 값과 다르다")
    if not close(e["failure_mode"]["value"], e["member_months"] * load("06-idempotency.yml")["input"]["runs"]):
        fails.append("06: 실패 모드가 실행 횟수배가 아니다")

    rows = load("07-month-length.yml")["expected"]["rows"]
    claims = {str(c["service_date"])[:7]: c["allowed"]
              for c in load("07-month-length.yml")["input"]["claims"]}
    for r, dim in zip(rows, (31, 28)):
        if not close(r["member_months"], 1.0):
            fails.append(f"07: {r['month']} 완전 가입자는 1.0 이어야 한다")
        if not close(r["dental_pmpm"], claims[str(r["month"])] / 1.0):
            fails.append(f"07: {r['month']} PMPM 이 입력 청구와 다르다")
    bad = load("07-month-length.yml")["expected"]["failure_mode"]["value"]
    for b, dim in zip(bad, (31, 28)):
        if not close(b["member_months"], dim / 30.4):
            fails.append(f"07: 실패 모드 {b['month']} 가 {dim}/30.4 와 다르다")

    if fails:
        print(f"FAIL — {len(fails)}건")
        for x in fails:
            print(f"  ✗ {x}")
        return 1
    print(f"PASS — fixture {len(files)}개, 손 계산 재확인 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
