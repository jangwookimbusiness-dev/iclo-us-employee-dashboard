#!/usr/bin/env python3
"""Assert every displayed number still derives from the constants block.

The dashboard used to state some values twice: the Overview card said "38%"
as a literal while the Funnel computed its rows from FRAC.activated, so
editing the constant moved one and not the other. Same for the repeat rate,
the dependent ratio, the minimum cell size and the data-currency line.

This perturbs each constant to a distinctive value, renders, and fails if
the new value does not reach the screen — or if the original leaks through
from somewhere that hardcoded it.

    python3 test_single_source.py

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

# (label, source pattern, replacement, tab to render, expected on screen, must NOT appear)
CASES = [
    ("FRAC.activated",
     r"activated:0\.38", "activated:0.44", "overview", ["44%"], ["38%"]),
    ("FRAC.repeat",
     r"repeat:0\.61", "repeat:0.77", "overview", ["77%"], ["61%"]),
    ("DEP_RATIO",
     r"const DEP_RATIO = 2\.2;", "const DEP_RATIO = 3.5;", "overview",
     ["×3.5", "35,000"], ["×2.2", "22,000"]),
    ("MIN_CELL",
     r"const MIN_CELL = 20;", "const MIN_CELL = 44;", "overview",
     ["n ≥ 44"], ["n ≥ 20"]),
    ("FRESH.completenessPct",
     r"completenessPct:98\.4", "completenessPct:71.3", "overview",
     ["71.3%"], ["98.4%"]),
    ("FRESH.claimsThru",
     r'claimsThru:"2026-05"', 'claimsThru:"2019-11"', "overview",
     ["2019-11"], ["2026-05"]),
    ("FRAC.closed",
     r"closed:0\.042", "closed:0.091", "funnel", ["910"], ["420"]),
]


def render(patched_html, tab):
    state = ('let S = {scen:"A", tab:"%s", dept:"All departments", '
             'lens:"employees", showSrc:true};' % tab)
    # Match the whole `let S = { ... };` block rather than one exact line.
    # The literal-string version broke silently when URL state was added and
    # stayed broken; the test only reported it as "could not find".
    pattern = re.compile(r"let S = \{.*?\n\};", re.S)
    if not pattern.search(patched_html):
        sys.exit("could not find the state initialiser in index.html")
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(pattern.sub(state, patched_html, count=1), encoding="utf-8")
        out = subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--dump-dom",
             "--virtual-time-budget=2000", page.as_uri()],
            capture_output=True, text=True, timeout=90)
        # strip the constants block itself — we are testing what reaches the
        # screen, and the block is inline in the page source
        return re.sub(r"single source of truth.*?const pct", "", out.stdout, flags=re.S)


def main():
    base = SRC.read_text(encoding="utf-8")
    failures = []
    for label, pattern, replacement, tab, expect, forbid in CASES:
        if not re.search(pattern, base):
            failures.append(f"{label}: constant not found — pattern {pattern!r}")
            continue
        dom = render(re.sub(pattern, replacement, base, count=1), tab)
        for token in expect:
            if token not in dom:
                failures.append(f"{label}: changed the constant but {token!r} never reached the screen")
        for token in forbid:
            if token in dom:
                failures.append(f"{label}: {token!r} still on screen — something hardcodes it")

    if failures:
        print(f"FAIL — {len(failures)} linkage break(s):")
        for f in failures:
            print("  " + f)
        sys.exit(1)
    print(f"PASS — {len(CASES)} constants, every one propagates to the screen")


if __name__ == "__main__":
    main()
