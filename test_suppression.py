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
    for scen in SCENARIOS:
        for dept in DEPTS:
            for tab in TABS:
                dom = render_dom(scen, dept, tab)
                where = f"scen {scen} / {dept} / {tab}"
                for label, value in displayed_counts(dom):
                    if value < MIN_CELL and not label.startswith(DENOMINATOR_LABELS):
                        failures.append(f"{where}: '{label}' shows {value} (< {MIN_CELL})")
                for leak in leaked_in_notice(dom):
                    failures.append(f"{where}: suppression notice echoed {leak}")

    checked = len(SCENARIOS) * len(DEPTS) * len(TABS)
    if failures:
        print(f"FAIL — {len(failures)} violation(s) across {checked} states:")
        for f in failures:
            print("  " + f)
        sys.exit(1)
    print(f"PASS — {checked} states, no displayed count below {MIN_CELL}")


if __name__ == "__main__":
    main()
