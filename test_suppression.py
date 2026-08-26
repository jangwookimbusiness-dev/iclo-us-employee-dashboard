#!/usr/bin/env python3
"""Assert the dashboard never displays a count below the minimum cell size.

The bug this guards against: suppression used to key off department headcount
(`D.n < 20`) rather than the value in each cell, so a 200-person department
happily rendered "Priority · 8". This walks every scenario x department x tab,
dumps the rendered DOM, and fails if any displayed count is under the floor.

    python3 test_suppression.py

Needs Google Chrome. No other dependencies.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SRC = Path(__file__).parent / "index.html"
import os
import shutil


def _find_chrome():
    """Chrome lives somewhere different on every machine and on CI.

    This was pinned to the macOS app bundle, which meant the render tests could
    only ever run on one laptop — the reason they were never in CI.
    """
    env = os.environ.get("CHROME")
    if env and Path(env).exists():
        return env
    for name in ("google-chrome", "google-chrome-stable", "chromium",
                 "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if Path(mac).exists():
        return mac
    sys.exit("no Chrome found. Set $CHROME or put chrome on PATH.")


CHROME = _find_chrome()
MIN_CELL = 20
STATE_LINE = re.compile(r"let S = \{[^}]*\};")

SCENARIOS = ["A", "B", "C"]
DEPTS = ["All departments", "Operations", "Sales", "Engineering", "Finance",
         "Facilities (pilot site)"]
TABS = ["overview", "signals", "funnel"]

# Denominators, not cells: group size is what the suppression notice itself
# discloses, so these are allowed to render below the floor.
DENOMINATOR_LABELS = ("Eligible employees", "Covered members")


def render_dom(scen, dept, tab):
    html = SRC.read_text(encoding="utf-8")
    state = ('let S = {scen:"%s", tab:"%s", dept:"%s", lens:"employees", showSrc:true};'
             % (scen, tab, dept))
    patched, n = STATE_LINE.subn(state, html, count=1)
    if n != 1:
        sys.exit("could not find the state initialiser in index.html")
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(patched, encoding="utf-8")
        out = subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--dump-dom",
             "--virtual-time-budget=2000", page.as_uri()],
            capture_output=True, text=True, timeout=90)
        # A failed render used to reach the parsers as an empty string, which
        # then found nothing, which every assertion read as "no violations".
        # The whole suite passed with CHROME=/bin/false. Verified 2026-08-15.
        if out.returncode != 0:
            sys.exit(f"chrome exited {out.returncode}: {out.stderr.strip()[:300]}")
        if "</html>" not in out.stdout:
            sys.exit("chrome returned no document — nothing was rendered")
        return out.stdout


def displayed_counts(dom):
    """Every count the page actually shows, as (label, value) pairs."""
    found = []
    # bar rows: <span class="bl">LABEL</span> ... <span class="bv">52% · 1,234</span>
    for label, value in re.findall(
            r'<span class="bl">(.*?)</span>.*?<span class="bv">(.*?)</span>', dom, re.S):
        nums = re.findall(r"[\d,]+", re.sub(r"\d+%", "", value))
        for raw in nums:
            found.append((re.sub("<[^>]+>", "", label).strip(), int(raw.replace(",", ""))))
    # cards: <div class="lab">LABEL</div> ... <div class="val">1,234<span...
    for label, value in re.findall(
            r'<div class="lab">(.*?)</div>.*?<div class="val">([\d,]+)', dom, re.S):
        found.append((label.strip(), int(value.replace(",", ""))))
    return found


CELL_NOTICE = (f"This cell falls below the minimum cell size of {MIN_CELL}. "
               "The value is withheld by policy.")


def leaked_in_notice(dom):
    """A cell-level notice must be the fixed sentence — never the withheld value.

    Compared whole rather than scanned for digits: the sentence legitimately
    contains MIN_CELL, so a digit scan flags itself.
    """
    return [t for t in re.findall(r'<div class="d">(This cell falls below[^<]*)</div>', dom)
            if t.strip() != CELL_NOTICE]


def main():
    failures = []
    seen = 0                      # values actually parsed, not states walked
    for scen in SCENARIOS:
        for dept in DEPTS:
            for tab in TABS:
                dom = render_dom(scen, dept, tab)
                where = f"scen {scen} / {dept} / {tab}"
                for label, value in displayed_counts(dom):
                    seen += 1
                    if value < MIN_CELL and not label.startswith(DENOMINATOR_LABELS):
                        failures.append(f"{where}: '{label}' shows {value} (< {MIN_CELL})")
                for leak in leaked_in_notice(dom):
                    failures.append(f"{where}: suppression notice echoed {leak}")

    states = len(SCENARIOS) * len(DEPTS) * len(TABS)

    # `seen` 은 실제로 파싱한 값의 개수다. 2026-08-26 까지 이 변수는 증가만 하고
    # 어디에도 쓰이지 않았고, 출력은 states 를 찍었다 — 계산된 상수다. 그래서
    # displayed_counts() 가 54상태 전부에서 빈 리스트를 돌려줘도 "PASS — 54 states"
    # 가 나왔다. 변수 주석은 "values actually parsed, not states walked" 라고
    # 적혀 있었고 코드는 정확히 그 반대를 했다 (codex 재검토가 잡았다).
    #
    # 이 검사는 조용히 죽었다가 다시 세운 셋 중 하나다. 렌더가 실패해 빈 페이지가
    # 나왔을 때 "위반 없음" 으로 읽은 것이 그 사고였다. 그때 넣은 방어가 이 변수인데
    # 단언이 없어서 방어가 아니었다.
    if not seen:
        print(f"FAIL — {states} states walked but zero displayed values parsed. "
              f"렌더가 비었거나 DOM 구조가 바뀌었다 — '위반 없음' 이 아니다")
        sys.exit(1)

    # 상태당 최소 몇 개는 나와야 한다. 한 상태에서만 값이 나오고 53개가 비어도
    # 위 검사는 통과한다. 화면은 상태마다 KPI 를 렌더하므로 하한을 건다.
    if seen < states:
        print(f"FAIL — {states} states walked but only {seen} values parsed "
              f"(상태당 1개 미만). 일부 상태가 렌더되지 않았다")
        sys.exit(1)

    if failures:
        print(f"FAIL — {len(failures)} violation(s) across {states} states:")
        for f in failures:
            print("  " + f)
        sys.exit(1)
    print(f"PASS — {states} states, {seen} displayed values parsed, "
          f"none below {MIN_CELL}")


if __name__ == "__main__":
    main()
