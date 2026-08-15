#!/usr/bin/env python3
"""Hold the A3 export to the contract in contracts/proposal-package-v11.yml.

A3 moves every figure on screen from a constants block to exported JSON, and
the moment it does, the JSON keys become the agreement between the export query
and the renderer. Rename a column and the screen goes blank rather than wrong,
which is worse than it sounds: nothing raises.

This is written before the export exists on purpose. What it must not do is
pass quietly in the meantime — a green check that verifies nothing is the
failure this repo has already had twice (test_single_source matched a literal
that changed; the red-line check never looked at the shipped file). So with no
exports on disk it prints PENDING and returns a distinct exit code, and CI
prints that line where a human sees it.

    python3 test_export_contract.py

Exit: 0 contract met · 1 violated · 2 nothing to check yet
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "contracts" / "proposal-package-v11.yml"
EXPORT_DIR = ROOT / "output" / "exports"

failures = []


def fail(where, msg):
    failures.append(f"{where}: {msg}")


def contract_fields():
    """Read the export contract without requiring PyYAML.

    Same reasoning as check-package-consistency.py — this repo has no runtime
    dependencies and a test is a bad place to introduce the first one.
    """
    t = CONTRACT.read_text(encoding="utf-8")
    block = re.search(r"^export_contract:$(.*?)^\w", t, re.S | re.M)
    if not block:
        sys.exit("계약에 export_contract 블록이 없다 — 정본을 먼저 고쳐라")
    b = block.group(1)

    # The contract explains itself inline, so `why` and friends sit at the same
    # indent as real keys. They are prose for the reader, not fields in the file.
    PROSE = {"why", "note", "rule", "how", "grain", "suppressed_row", "keep", "per_field"}

    def keys_under(name):
        m = re.search(rf"^  {name}:.*?$(.*?)(?=^  \w|\Z)", b, re.S | re.M)
        if not m:
            return []
        return [k for k in re.findall(r"^    ([a-z_]+):", m.group(1), re.M) if k not in PROSE]

    fields = re.search(r"^    fields:\s*\[(.*?)\]", b, re.S | re.M)
    return {
        "envelope": keys_under("envelope"),
        "freshness": keys_under("freshness"),
        "months": [f.strip() for f in fields.group(1).replace("\n", " ").split(",")] if fields else [],
    }


def check_file(path, spec):
    doc = json.loads(path.read_text(encoding="utf-8"))
    name = path.name

    for k in spec["envelope"]:
        if k not in doc:
            fail(name, f"envelope 에 {k} 없음")
    for k in spec["freshness"]:
        if k not in doc.get("freshness", {}):
            fail(name, f"freshness 에 {k} 없음")

    months = doc.get("months")
    if not isinstance(months, list) or not months:
        fail(name, "months 가 비었거나 배열이 아님")
        return doc
    # The contract exports 36 months even though the screen reads the latest,
    # so Trend can arrive later without touching the pipeline. A shorter file
    # is a different contract.
    span = {r.get("month_start") for r in months if r.get("month_start")}
    if len(span) != 36:
        fail(name, f"월이 36개여야 하는데 {len(span)}개 (month_start 기준)")

    for i, row in enumerate(months):
        missing = [f for f in spec["months"] if f not in row]
        if missing:
            fail(name, f"months[{i}] 에 {', '.join(missing)} 없음")
            break
        # A suppressed row keeps its place with nulls. Dropping it would hide
        # that the department exists at all, which cell suppression never
        # intended — it hides values, not the existence of a group.
        if row.get("department") is None:
            # Every measure has to be null, not just the two obvious ones.
            # Checking a sample let activation, signal and action values leak
            # through a row the contract calls suppressed.
            leaked = [f for f in spec["months"]
                      if f not in ("department", "employer_id", "month_start")
                      and row.get(f) is not None]
            if leaked:
                fail(name, f"months[{i}] 억제 행인데 {', '.join(leaked)} 가 남아 있음")

    if doc.get("employer_id") and any(
            r.get("employer_id") not in (None, doc["employer_id"]) for r in months):
        fail(name, "다른 employer_id 의 행이 섞여 있음 — 격리가 깨졌다")

    return doc


def main():
    spec = contract_fields()
    if not spec["months"]:
        sys.exit("계약에서 months.fields 를 읽지 못했다 — 이 테스트가 낡았다")

    exports = sorted(EXPORT_DIR.glob("employer-*.json")) if EXPORT_DIR.exists() else []
    if exports:
        # The contract names three employers and a department catalog. Accepting
        # whatever happens to be on disk would pass a partial release.
        want = {"employer-a.json", "employer-b.json", "employer-c.json"}
        have = {p.name for p in exports}
        if want - have:
            fail("release", f"계약이 요구하는 {', '.join(sorted(want - have))} 가 없음")
        if not (EXPORT_DIR / "departments.json").exists():
            fail("release", "departments.json 이 없음 — 억제된 부서가 필터에서 사라진다")
    if not exports:
        print("PENDING — 검사할 내보내기가 없다 (output/exports/employer-*.json)")
        print(f"  계약은 읽혔다: envelope {len(spec['envelope'])} · "
              f"freshness {len(spec['freshness'])} · months {len(spec['months'])} 필드")
        print("  A3 가 파일을 만들면 이 테스트가 자동으로 물린다. 통과가 아니다.")
        return 2

    docs = [check_file(p, spec) for p in exports]

    # One release, not three files that happen to share a directory. A manual
    # export can mix employer A from this run with B and C from the last one.
    for key in ("run_id", "schema_version", "report_snapshot_seq"):
        vals = {d.get(key) for d in docs}
        if len(vals) > 1:
            fail("release", f"{key} 가 파일마다 다름: {sorted(map(str, vals))}")

    if failures:
        print(f"FAIL — {len(failures)}건")
        for f in failures:
            print(f"  ✗ {f}")
        return 1

    print(f"PASS — {len(exports)}개 파일이 계약을 지킨다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
