#!/usr/bin/env python3
"""Hold the A3 export to the contract in contracts/proposal-package-v11.yml.

A3 moves every figure on screen from a constants block to exported JSON, and
the moment it does, the JSON keys become the agreement between the export query
and the renderer. Rename a column and the screen goes blank rather than wrong,
which is worse than it sounds: nothing raises.

This is written before the export exists on purpose. PROJECT_PHASE makes that
state explicit: demo permits a clearly reported skip; a3 and a2 require the
export and fail when it is absent. A green check therefore means the repository
matches its declared phase, not that a missing artifact was silently accepted.

    python3 test_export_contract.py

Exit: 0 phase contract met · 1 violated
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTRACT = ROOT / "contracts" / "proposal-package-v11.yml"
EXPORT_DIR = Path(os.environ.get("ICLO_EXPORT_DIR", ROOT / "output" / "exports"))
PHASE_FILE = Path(os.environ.get("ICLO_PROJECT_PHASE", ROOT / "PROJECT_PHASE"))

failures = []


def fail(where, msg):
    failures.append(f"{where}: {msg}")


def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def is_text(value):
    return isinstance(value, str) and bool(value.strip())


def check_release_envelope(doc, name, phase, expected_employer=None):
    """Validate release identity values, not only key presence."""
    common = {
        "schema_version": lambda value: is_int(value) and value > 0,
        "run_id": is_text,
        "report_snapshot_seq": lambda value: is_int(value) and value >= 0,
        "exported_at": is_text,
        "synthetic": lambda value: isinstance(value, bool),
    }
    for key, valid in common.items():
        if key not in doc:
            fail(name, f"release envelope 에 {key} 없음")
        elif not valid(doc[key]):
            fail(name, f"release envelope 의 {key} 값/타입이 잘못됨: {doc[key]!r}")

    if phase in {"demo", "a3"} and doc.get("synthetic") is not True:
        fail(name, f"PROJECT_PHASE={phase} export 는 synthetic=true 여야 함")

    if expected_employer is not None:
        employer_id = doc.get("employer_id")
        if not is_text(employer_id):
            fail(name, f"envelope 의 employer_id 값/타입이 잘못됨: {employer_id!r}")
        elif employer_id != expected_employer:
            fail(name, f"파일명은 {expected_employer} 인데 employer_id={employer_id!r}")


def load_json(path):
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail(path.name, f"JSON 을 읽지 못함: {exc}")
        return None
    if not isinstance(doc, dict):
        fail(path.name, "최상위 JSON 이 객체가 아님")
        return None
    return doc


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


def check_file(path, spec, phase):
    doc = load_json(path)
    name = path.name
    if doc is None:
        return {}

    expected_employer = path.stem.removeprefix("employer-").upper()
    check_release_envelope(doc, name, phase, expected_employer)

    freshness = doc.get("freshness")
    if not isinstance(freshness, dict):
        fail(name, "freshness 가 객체가 아님")
        freshness = {}
    for key in spec["freshness"]:
        if key not in freshness:
            fail(name, f"freshness 에 {key} 없음")
    for key in ("eligibility_thru", "claims_thru"):
        if key in freshness and not is_text(freshness[key]):
            fail(name, f"freshness.{key} 값/타입이 잘못됨: {freshness[key]!r}")
    if "lag_days" in freshness and not (
            is_int(freshness["lag_days"]) and freshness["lag_days"] >= 0):
        fail(name, f"freshness.lag_days 값/타입이 잘못됨: {freshness['lag_days']!r}")
    if "completeness_pct" in freshness and not (
            is_number(freshness["completeness_pct"])
            and 0 <= freshness["completeness_pct"] <= 100):
        fail(name, "freshness.completeness_pct 는 0~100 숫자여야 함")

    months = doc.get("months")
    if not isinstance(months, list) or not months:
        fail(name, "months 가 비었거나 배열이 아님")
        return doc
    # The contract exports 36 months even though the screen reads the latest,
    # so Trend can arrive later without touching the pipeline. A shorter file
    # is a different contract.
    if len(months) != 36:
        fail(name, f"months 행이 36개여야 하는데 {len(months)}개")
    valid_rows = []
    for i, row in enumerate(months):
        if not isinstance(row, dict):
            fail(name, f"months[{i}] 가 객체가 아님")
        else:
            valid_rows.append((i, row))
    span = {
        row.get("month_start")
        for _, row in valid_rows
        if is_text(row.get("month_start"))
    }
    if len(span) != 36:
        fail(name, f"월이 36개여야 하는데 {len(span)}개 (month_start 기준)")

    for i, row in valid_rows:
        missing = [f for f in spec["months"] if f not in row]
        if missing:
            fail(name, f"months[{i}] 에 {', '.join(missing)} 없음")
            continue
        if not is_text(row.get("month_start")):
            fail(name, f"months[{i}].month_start 가 비었거나 문자열이 아님")
        if row.get("department") is not None and not is_text(row["department"]):
            fail(name, f"months[{i}].department 값/타입이 잘못됨")
        if row.get("employer_id") != doc.get("employer_id"):
            fail(name, f"months[{i}].employer_id 가 파일 소유자와 다름")
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

    # Reserved test employers must not reach an artifact. The row access policy
    # does not cover this: R_ENGINEER and R_ANALYST bypass it, so anything an
    # internal role produces can carry test rows. contracts employer_id_classes.
    ids = {doc.get("employer_id")} | {r.get("employer_id") for _, r in valid_rows}
    leaked = sorted(i for i in ids if isinstance(i, str) and i.startswith("_TEST_"))
    if leaked:
        fail(name, f"내부 테스트 employer_id 가 산출물에 있음: {', '.join(leaked)}")

    return doc


def main():
    if not PHASE_FILE.exists():
        sys.exit("FAIL — PROJECT_PHASE 없음 (demo | a3 | a2)")
    phase = PHASE_FILE.read_text(encoding="utf-8").strip()
    if phase not in {"demo", "a3", "a2"}:
        sys.exit(f"FAIL — 알 수 없는 PROJECT_PHASE: {phase!r}")

    spec = contract_fields()
    if not spec["months"]:
        sys.exit("계약에서 months.fields 를 읽지 못했다 — 이 테스트가 낡았다")

    exports = sorted(EXPORT_DIR.glob("employer-*.json")) if EXPORT_DIR.exists() else []
    catalog_path = EXPORT_DIR / "departments.json"
    if exports:
        # The contract names three employers and a department catalog. Accepting
        # whatever happens to be on disk would pass a partial release.
        want = {"employer-a.json", "employer-b.json", "employer-c.json"}
        have = {p.name for p in exports}
        if want - have:
            fail("release", f"계약이 요구하는 {', '.join(sorted(want - have))} 가 없음")
        if have - want:
            fail("release", f"계약에 없는 employer export 가 있음: {', '.join(sorted(have - want))}")
        if not catalog_path.exists():
            fail("release", "departments.json 이 없음 — 억제된 부서가 필터에서 사라진다")
    if not exports:
        if phase != "demo":
            sys.exit(f"FAIL — PROJECT_PHASE={phase} 인데 내보내기가 없다 "
                     "(output/exports/employer-*.json)")
        print("SKIP — PROJECT_PHASE=demo: A3 내보내기는 아직 필수 산출물이 아니다")
        print(f"  계약은 읽혔다: envelope {len(spec['envelope'])} · "
              f"freshness {len(spec['freshness'])} · months {len(spec['months'])} 필드")
        print("  phase 를 a3 또는 a2 로 바꾸면 내보내기 부재가 즉시 실패한다.")
        return 0

    docs = [check_file(p, spec, phase) for p in exports]

    # The catalog is part of the same release even though its row shape differs
    # from an employer file. It must carry the release identity or an old catalog
    # can be mixed with new employer payloads without detection.
    catalog = load_json(catalog_path) if catalog_path.exists() else None
    if catalog is not None:
        check_release_envelope(catalog, "departments.json", phase)
        allowed_employer_ids = {
            doc.get("employer_id") for doc in docs if is_text(doc.get("employer_id"))
        }
        departments = catalog.get("departments")
        if not isinstance(departments, list) or not departments:
            fail("departments.json", "departments 가 비었거나 배열이 아님")
        else:
            seen = set()
            for i, row in enumerate(departments):
                if not isinstance(row, dict):
                    fail("departments.json", f"departments[{i}] 가 객체가 아님")
                    continue
                department = row.get("department")
                employer_id = row.get("employer_id")
                if not is_text(department):
                    fail("departments.json", f"departments[{i}].department 가 비었거나 문자열이 아님")
                if not is_text(employer_id):
                    fail("departments.json", f"departments[{i}].employer_id 가 비었거나 문자열이 아님")
                elif employer_id.startswith("_TEST_"):
                    fail("departments.json", f"내부 테스트 employer_id 가 산출물에 있음: {employer_id}")
                elif employer_id not in allowed_employer_ids:
                    fail("departments.json", f"기업 파일에 없는 employer_id: {employer_id!r}")
                if is_text(employer_id) and is_text(department):
                    key = (employer_id, department)
                    if key in seen:
                        fail("departments.json", f"중복 부서 행: {employer_id!r}/{department!r}")
                    seen.add(key)

    # One release, not three files that happen to share a directory. A manual
    # export can mix employer A from this run with B and C from the last one.
    release_docs = docs + ([catalog] if catalog is not None else [])
    for key in ("run_id", "schema_version", "report_snapshot_seq"):
        vals = [d.get(key) for d in release_docs]
        if vals and any(value != vals[0] for value in vals[1:]):
            fail("release", f"{key} 가 파일마다 다름: {sorted(map(repr, vals))}")

    month_sets = {
        tuple(sorted(
            row.get("month_start") for row in doc.get("months", [])
            if isinstance(row, dict) and is_text(row.get("month_start"))
        ))
        for doc in docs
    }
    if len(month_sets) > 1:
        fail("release", "employer 파일의 month_start 집합이 서로 다름")

    if failures:
        print(f"FAIL — {len(failures)}건")
        for f in failures:
            print(f"  ✗ {f}")
        return 1

    print(f"PASS — {len(exports)}개 파일이 계약을 지킨다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
