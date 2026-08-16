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
    if skipped:
        print(f"  해석하지 않은 별칭 {len(skipped)}개 (서브쿼리·CTE·컬럼 미선언 테이블): "
              f"{', '.join(sorted(skipped)[:12])}")


if __name__ == "__main__":
    main()
