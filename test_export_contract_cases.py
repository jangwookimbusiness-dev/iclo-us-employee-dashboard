#!/usr/bin/env python3
"""Exercise A3 export-contract failure paths with temporary releases."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import test_export_contract as contract_test


ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "test_export_contract.py"
SPEC = contract_test.contract_fields()


def month_rows(employer_id):
    rows = []
    for index in range(36):
        row = {field: 0 for field in SPEC["months"]}
        row.update({
            "month_start": f"{2024 + index // 12}-{index % 12 + 1:02d}-01",
            "department": "All",
            "employer_id": employer_id,
        })
        rows.append(row)
    return rows


def employer_doc(employer_id):
    return {
        "schema_version": 1,
        "run_id": "run-001",
        "report_snapshot_seq": 7,
        "exported_at": "2026-08-25T12:00:00Z",
        "employer_id": employer_id,
        "synthetic": True,
        "freshness": {
            "eligibility_thru": "2026-07-31",
            "claims_thru": "2026-06-30",
            "lag_days": 56,
            "completeness_pct": 98.5,
        },
        "months": month_rows(employer_id),
    }


def catalog_doc():
    return {
        "schema_version": 1,
        "run_id": "run-001",
        "report_snapshot_seq": 7,
        "exported_at": "2026-08-25T12:00:00Z",
        "synthetic": True,
        "departments": [
            {"employer_id": employer_id, "department": "All"}
            for employer_id in ("A", "B", "C")
        ],
    }


def write_json(path, value):
    path.write_text(json.dumps(value), encoding="utf-8")


def write_valid_release(export_dir):
    export_dir.mkdir(parents=True)
    for employer_id in ("A", "B", "C"):
        write_json(export_dir / f"employer-{employer_id.lower()}.json", employer_doc(employer_id))
    write_json(export_dir / "departments.json", catalog_doc())


def run_case(name, mutate=None, expected_exit=1, expected_text=None, create_release=True):
    with tempfile.TemporaryDirectory(prefix="iclo-export-contract-") as tmp:
        work = Path(tmp)
        export_dir = work / "exports"
        phase_file = work / "PROJECT_PHASE"
        phase_file.write_text("a3\n", encoding="utf-8")
        if create_release:
            write_valid_release(export_dir)
        if mutate:
            mutate(export_dir)

        env = {
            **os.environ,
            "ICLO_EXPORT_DIR": str(export_dir),
            "ICLO_PROJECT_PHASE": str(phase_file),
        }
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        output = result.stdout + result.stderr
        if result.returncode != expected_exit:
            raise AssertionError(
                f"{name}: exit {result.returncode}, expected {expected_exit}\n{output}"
            )
        if expected_text and expected_text not in output:
            raise AssertionError(f"{name}: {expected_text!r} not found\n{output}")


def change_json(export_dir, filename, change):
    path = export_dir / filename
    doc = json.loads(path.read_text(encoding="utf-8"))
    change(doc)
    write_json(path, doc)


def add_suppressed_value_leak(doc):
    row = doc["months"][0]
    row["department"] = None
    for field in SPEC["months"]:
        if field not in {"month_start", "department", "employer_id"}:
            row[field] = None
    row["activated"] = 1


def main():
    cases = [
        ("valid release", None, 0, "PASS", True),
        ("A3 export missing", None, 1, "내보내기가 없다", False),
        ("catalog missing", lambda path: (path / "departments.json").unlink(), 1,
         "departments.json 이 없음", True),
        ("catalog run mismatch", lambda path: change_json(
            path, "departments.json", lambda doc: doc.update(run_id="run-002")),
         1, "run_id 가 파일마다 다름", True),
        ("catalog rows empty", lambda path: change_json(
            path, "departments.json", lambda doc: doc.update(departments=[])),
         1, "departments 가 비었거나 배열이 아님", True),
        ("synthetic wrong type", lambda path: change_json(
            path, "employer-a.json", lambda doc: doc.update(synthetic="true")),
         1, "synthetic 값/타입이 잘못됨", True),
        ("filename owner mismatch", lambda path: change_json(
            path, "employer-a.json", lambda doc: doc.update(employer_id="B")),
         1, "파일명은 A 인데 employer_id='B'", True),
        ("month set mismatch", lambda path: change_json(
            path, "employer-c.json",
            lambda doc: doc["months"][0].update(month_start="2030-01-01")),
         1, "month_start 집합이 서로 다름", True),
        ("month owner null", lambda path: change_json(
            path, "employer-a.json",
            lambda doc: doc["months"][0].update(employer_id=None)),
         1, "employer_id 가 파일 소유자와 다름", True),
        ("employer file missing", lambda path: (path / "employer-b.json").unlink(),
         1, "계약이 요구하는 employer-b.json", True),
        ("extra employer file", lambda path: write_json(
            path / "employer-d.json", employer_doc("D")),
         1, "계약에 없는 employer export", True),
        ("malformed JSON", lambda path: (path / "employer-a.json").write_text(
            "{", encoding="utf-8"),
         1, "JSON 을 읽지 못함", True),
        ("non-object JSON", lambda path: write_json(path / "employer-a.json", []),
         1, "최상위 JSON 이 객체가 아님", True),
        ("suppressed value leak", lambda path: change_json(
            path, "employer-a.json", add_suppressed_value_leak),
         1, "억제 행인데 activated 가 남아 있음", True),
        ("freshness out of range", lambda path: change_json(
            path, "employer-a.json",
            lambda doc: doc["freshness"].update(completeness_pct=101)),
         1, "0~100 숫자여야 함", True),
        ("catalog duplicate", lambda path: change_json(
            path, "departments.json",
            lambda doc: doc["departments"].append(dict(doc["departments"][0]))),
         1, "중복 부서 행", True),
        ("catalog test employer", lambda path: change_json(
            path, "departments.json",
            lambda doc: doc["departments"][0].update(employer_id="_TEST_A")),
         1, "내부 테스트 employer_id", True),
    ]
    for case in cases:
        run_case(*case)
    print(f"PASS — export contract regression cases {len(cases)}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
