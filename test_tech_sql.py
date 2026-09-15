#!/usr/bin/env python3
"""Check that the design document's SQL only names columns the document declares.

The tech doc is the build spec for phase 1 and not one line of its SQL has ever
been executed. Nothing objects when a column name is wrong, and on 2026-08-16
three wrong names shipped in a single day:

    s.window_start    canonical.oral_signal has no such column
    s.band            it is signal_band
    m.month_start     util.month_spine has month_date

The third arrived while fixing the first two. Reading does not catch this class;
a resolver does.

Deliberately narrow. It resolves an alias only when that alias is bound directly
to a table whose columns the document declares, and skips everything else —
CTEs, derived tables, tables declared elsewhere. A checker that guesses would
produce false positives, and a check people learn to ignore is worse than no
check at all. It prints what it skipped so the coverage is visible rather than
implied.

    python3 test_tech_sql.py

No dependencies.
"""
import re
import calendar
import datetime as dt
import math
import sqlite3
import sys
from pathlib import Path

DOC = (Path(__file__).parent /
       "output/proposal-v10/06_Tech/ICLO-Evidence-Layer-DB-설계-KO.md")

# Not columns: SQL functions and keywords that appear as `x.y` lookalikes, plus
# the wildcard.
SKIP_REFS = {"*"}


def declared_columns(text):
    """{'canonical.oral_signal': {'party_sk', ...}} from CREATE TABLE + ALTER ADD.

    Only the form with an explicit column list. `CREATE TABLE x AS SELECT ...`
    declares its columns by projection, which this does not try to infer.
    """
    tables = {}
    for m in re.finditer(
            r"CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"
            r"([\w.]+)\s*\(\s*\n(.*?)\n\s*\);", text, re.S | re.I):
        name, body = m.group(1).lower(), m.group(2)
        cols = set()
        for line in body.split("\n"):
            line = line.strip()
            if not line or line.startswith("--"):
                continue
            c = re.match(r"([a-z_][a-z0-9_]*)\s+[A-Z]", line)
            if c and c.group(1).upper() not in ("PRIMARY", "FOREIGN", "UNIQUE", "CONSTRAINT"):
                cols.add(c.group(1))
        if cols:
            tables[name] = cols

    # ALTER ... ADD COLUMN takes a list, not one column. The first version of
    # this read only the first name, so superseded_by and eligibility_episode_id
    # looked undeclared and the checker reported two defects that were not there.
    for m in re.finditer(r"ALTER\s+TABLE\s+([\w.]+)\s+ADD\s+COLUMN\s+(.*?);",
                         text, re.S | re.I):
        name, body = m.group(1).lower(), strip_comments(m.group(2))
        for part in body.split(","):
            c = re.match(r"\s*([a-z_][a-z0-9_]*)\s+\S", part, re.I)
            if c:
                tables.setdefault(name, set()).add(c.group(1).lower())
    return tables


def strip_comments(sql):
    """-- and /* */ removed.

    Without this the resolver reads prose. The correction note in §11.2 names
    the very columns it says are wrong — "the first version read s.window_start
    and s.band" — and the checker reported both as live defects. A checker that
    flags its own changelog is a checker people switch off.
    """
    sql = re.sub(r"/\*.*?\*/", " ", sql, flags=re.S)
    return re.sub(r"--[^\n]*", "", sql)


def sql_blocks(text):
    return [strip_comments(b) for b in re.findall(r"```sql\n(.*?)\n```", text, re.S)]


def check_block(block, tables):
    """Returns (errors, checked, skipped_aliases) for one fenced SQL block."""
    # alias -> table, only where the alias follows a qualified table name.
    bound, ambiguous = {}, set()
    for m in re.finditer(r"\b(?:FROM|JOIN)\s+([\w.]+)\s+(?:AS\s+)?([a-z][a-z0-9_]*)\b",
                         block, re.I):
        table, alias = m.group(1).lower(), m.group(2).lower()
        if alias in ("as", "on", "where", "select", "group", "order", "using", "set"):
            continue
        if alias in bound and bound[alias] != table:
            ambiguous.add(alias)        # same letter, two tables, one block
        bound[alias] = table

    # Aliases bound to something we cannot resolve: subqueries, CTEs, tables
    # whose columns are never declared. Named so the skip is visible.
    unresolved = {a for a, t in bound.items() if t not in tables}
    for m in re.finditer(r"\)\s*(?:AS\s+)?([a-z][a-z0-9_]*)\s*\n", block, re.I):
        unresolved.add(m.group(1).lower())
    for m in re.finditer(r"\b(?:WITH|,)\s*(\w+)\s+AS\s*\(", block, re.I):
        unresolved.add(m.group(1).lower())

    errors, checked = [], 0
    for m in re.finditer(r"\b([a-z][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b", block):
        alias, col = m.group(1), m.group(2)
        if alias in unresolved or alias in ambiguous or alias not in bound:
            continue
        if col in SKIP_REFS:
            continue
        table = bound[alias]
        checked += 1
        if col not in tables[table]:
            near = ", ".join(sorted(tables[table])[:6])
            errors.append(f"{alias}.{col} — {table} 에 그런 컬럼이 없다 (있는 것: {near} …)")
    return errors, checked, unresolved | ambiguous


def check_relational_behavior(text):
    """Execute source SELECTs with SQLite date/table-function adapters.

    This checks relational results, not Snowflake DDL or policy enforcement.
    """
    def query(table):
        match = re.search(r"CREATE OR REPLACE TABLE " + re.escape(table)
                          + r" AS\n(.*?);", text, re.S)
        assert match, f"missing source query: {table}"
        return (match.group(1).replace("'9999-12-31'::DATE", "'9999-12-31'")
                .replace("TABLE(mart.claims_as_of(:as_of_seq))", "claims_as_of_result"))

    def dateadd(unit, count, value):
        assert unit.lower() == "month"
        day = dt.date.fromisoformat(value[:10])
        year, month = divmod(day.year * 12 + day.month - 1 + count, 12)
        return day.replace(year=year, month=month + 1,
                           day=min(day.day, calendar.monthrange(year, month + 1)[1])).isoformat()

    errors, checked = [], 0
    def expect(ok, message):
        nonlocal checked
        checked += 1
        if not ok:
            errors.append(message)

    with sqlite3.connect(":memory:") as db:
        db.row_factory = sqlite3.Row
        for schema in ("canonical", "mart", "util"):
            db.execute(f"ATTACH DATABASE ':memory:' AS {schema}")
        db.create_function("DATEADD", 3, dateadd)
        db.create_function("DATE_TRUNC", 2, lambda unit, value: value[:7] + "-01")
        db.create_function("LAST_DAY", 1, lambda value: value[:8] + str(
            calendar.monthrange(int(value[:4]), int(value[5:7]))[1]))
        # Snowflake division is fractional; SQLite integer division is not.
        db.create_function("DAY", 1, lambda value: float(value[8:10]))
        db.create_function("IFF", 3, lambda condition, yes, no: yes if condition else no)
        db.executescript("""
            CREATE TABLE util.month_spine (month_date TEXT);
            INSERT INTO util.month_spine VALUES ('2026-08-01');
            CREATE TABLE canonical.oral_signal (
                party_sk INTEGER, employer_id TEXT, captured_at TEXT,
                signal_band TEXT, model_version TEXT, quality_passed INTEGER);
            CREATE TABLE mart.party_department (
                party_sk INTEGER, employer_id TEXT, department TEXT,
                effective_date TEXT, end_date TEXT);
            CREATE TABLE canonical.member_month (
                party_sk INTEGER, employer_id TEXT, month_start TEXT,
                eligibility_span_sk INTEGER, covered_days INTEGER, is_subscriber INTEGER);
            CREATE TABLE canonical.eligibility_span (
                eligibility_span_sk INTEGER, party_sk INTEGER, employer_id TEXT,
                eligibility_episode_id INTEGER, snapshot_seq INTEGER);
            CREATE TABLE claims_as_of_result (
                party_sk INTEGER, employer_id TEXT, service_date TEXT, allowed_amount REAL);
            INSERT INTO canonical.member_month VALUES (1, 'A', '2026-08-01', 1, 15, 1);
            INSERT INTO canonical.member_month VALUES (1, 'A', '2026-08-01', 2, 16, 1);
            INSERT INTO canonical.eligibility_span VALUES (1, 1, 'A', 1, 1);
            INSERT INTO canonical.eligibility_span VALUES (2, 1, 'A', 2, 1);
            INSERT INTO canonical.eligibility_span VALUES (3, 2, 'B', 1, 2);
            INSERT INTO claims_as_of_result VALUES (1, 'A', '2026-08-12', 100.0);
            INSERT INTO mart.party_department VALUES (1, 'A', 'Sales', '2026-01-01', NULL);
            INSERT INTO mart.party_department VALUES (1, 'A', 'Finance', '2026-07-01', NULL);
            CREATE TABLE mart.department_size (
                employer_id TEXT, department TEXT, month_start TEXT, n INTEGER);
        """)
        fact = [dict(row) for row in db.execute(query("mart.person_month_fact"), {"as_of_seq": 2})]
        expect(len(fact) == 1 and fact[0]["allowed"] == 100
               and math.isclose(fact[0]["member_months"], 1.0)
               and fact[0]["subscriber_rows"] == 1 and fact[0]["department"] == "Finance",
               f"split eligibility spans must preserve money and person grain: {fact}")

        signal = query("mart.person_signal_fact")
        db.execute("INSERT INTO canonical.oral_signal VALUES (1,'A','2026-08-05','LOW','v1',1)")
        db.execute("INSERT INTO canonical.oral_signal VALUES (1,'A','2026-08-07','PRIORITY','v1',0)")
        before = [dict(row) for row in db.execute(signal) if row["employer_id"] == "A"]
        db.execute("INSERT INTO canonical.oral_signal VALUES (1,'B','2026-08-06','PRIORITY','v1',1)")
        after = [dict(row) for row in db.execute(signal) if row["employer_id"] == "A"]
        expect(len(before) == 1 and after == before, "tenant B signal changed tenant A output")

        db.execute("DELETE FROM canonical.oral_signal")
        for person, captured in enumerate(("2025-08-31", "2025-09-01", "2026-08-31", "2026-09-01")):
            db.execute("INSERT INTO canonical.oral_signal VALUES (?, 'A', ?, 'LOW', 'v1', 1)",
                       (person, captured))
        selected = {row["party_sk"] for row in db.execute(signal)}
        expect(selected == {1, 2}, f"report-inclusive 12-month boundaries: {selected}")

        suppress = query("mart.cell_suppression")
        for cells, expected in (
            ([("A", "Sales", "2026-07-01", 1000), ("A", "Sales", "2026-08-01", 1000)],
             {("Sales", "2026-07-01"), ("Sales", "2026-08-01")}),
            ([("A", "Sales", "2026-08-01", 1000), ("A", "All departments", "2026-08-01", 1019)],
             {("Sales", "2026-08-01"), ("All departments", "2026-08-01")}),
            ([("A", "Sales", "2026-08-01", 1000), ("A", "All departments", "2026-08-01", 1020)], set()),
        ):
            db.execute("DELETE FROM mart.department_size")
            db.executemany("INSERT INTO mart.department_size VALUES (?, ?, ?, ?)", cells)
            actual = {(row["department"], row["month_start"]) for row in db.execute(suppress)
                      if row["suppressed_by_neighbour"]}
            expect(actual == expected, f"suppression must cover both endpoints: {actual} != {expected}")
    return errors, checked


def main():
    if not DOC.exists():
        sys.exit(f"기술문서 없음: {DOC}")
    text = DOC.read_text(encoding="utf-8")
    tables = declared_columns(text)
    if not tables:
        sys.exit("CREATE TABLE 을 하나도 못 읽었다 — 문서 형식이 바뀌었다")

    blocks = sql_blocks(text)
    if not blocks:
        sys.exit("```sql 블록이 없다 — 검사가 아무것도 안 봤다")

    all_errors, total, skipped = [], 0, set()
    for i, b in enumerate(blocks):
        errs, n, skip = check_block(b, tables)
        total += n
        skipped |= skip
        all_errors += [f"블록 {i + 1}: {e}" for e in errs]

    relational_errors, relational_checked = check_relational_behavior(text)
    all_errors += relational_errors

    if total == 0:
        sys.exit(f"컬럼 참조를 한 건도 해석하지 못했다 — {len(blocks)}블록, "
                 f"{len(tables)}테이블을 읽고도 0건이면 해석기가 고장난 것이다")

    if all_errors:
        print(f"FAIL — {len(all_errors)}건\n")
        for e in all_errors:
            print("  ✗", e)
        sys.exit(1)

    print(f"PASS — 선언된 테이블 {len(tables)}개, SQL 블록 {len(blocks)}개, "
          f"해석한 컬럼 참조 {total}건이 전부 실재")
    print(f"  관계 연산 반례 {relational_checked}개 통과 "
          "(SQLite 어댑터; Snowflake 정책 실행 아님)")
    if skipped:
        print(f"  해석하지 않은 별칭 {len(skipped)}개 (서브쿼리·CTE·컬럼 미선언 테이블): "
              f"{', '.join(sorted(skipped)[:12])}")


if __name__ == "__main__":
    main()
