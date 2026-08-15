#!/usr/bin/env python3
"""Regenerate the proposal screenshots. Deterministic — same input, same PNGs.

Every state here is reachable by URL, which is the point. Until 2026-08-15 the
suppression view was not: `?dept=` did not exist and the department <select>
never marked its own selection, so the one screenshot the proposal most needs
had to be produced by a human clicking, and looked wrong when it wasn't.

    python3 scripts/shots.py [outdir]        # default: output/shots/
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
PORT = 8731


def find_chrome():
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


# (name, page, query, viewport). The dashboard is a desktop surface and the app
# is a phone one, so they get different widths — 500 on the phone because
# headless lays out at 500 regardless of --window-size and a narrower shot
# clips rather than reflows.
SHOTS = [
    ("dashboard-overview",   "index.html", {"tab": "overview"},                              (1280, 1400)),
    ("dashboard-signals",    "index.html", {"tab": "signals"},                               (1280, 1400)),
    ("dashboard-funnel",     "index.html", {"tab": "funnel"},                                (1280, 1400)),
    ("dashboard-suppressed", "index.html", {"tab": "overview", "dept": "Facilities (pilot site)"}, (1280, 1400)),
    ("dashboard-members",    "index.html", {"tab": "overview", "lens": "members"},           (1280, 1400)),
    ("app-home",             "app.html",   {},                                               (500, 1050)),
    ("app-coverage",         "app.html",   {},                                               (500, 1050)),
    ("app-care",             "app.html",   {},                                               (500, 1050)),
]

# app.html keeps its screen in a JS variable rather than the URL — it is a
# single-member demo, so there is nothing to deep-link to yet. Patch instead.
APP_TAB = {"app-home": "home", "app-coverage": "coverage", "app-care": "care"}


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "output" / "shots"
    out.mkdir(parents=True, exist_ok=True)
    chrome = find_chrome()

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        # Poll rather than sleep: a fixed sleep is either slow or flaky.
        # Connection-refused returns instantly, so the retry needs its own
        # pause or the whole budget burns in microseconds.
        import time
        import urllib.error
        import urllib.request
        for _ in range(100):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/", timeout=0.3)
                break
            except (urllib.error.URLError, OSError):
                time.sleep(0.1)
        else:
            sys.exit("local server never came up")

        tmp = ROOT / ".shots-tmp"
        tmp.mkdir(exist_ok=True)
        try:
            for name, page, query, (w, h) in SHOTS:
                target = page
                if name in APP_TAB:
                    src = (ROOT / page).read_text(encoding="utf-8")
                    anchor = 'let S = { tab:"home", step:0 };'
                    # Check the anchor exists rather than that the text changed:
                    # the home shot patches "home" to "home" and a changed-text
                    # check reads that no-op as a stale script.
                    if src.count(anchor) != 1:
                        sys.exit(f"{page}: state initialiser not found — shots.py is stale")
                    patched = src.replace(
                        anchor, 'let S = { tab:"%s", step:0 };' % APP_TAB[name], 1)
                    target = f".shots-tmp/{name}.html"
                    (ROOT / target).write_text(patched, encoding="utf-8")

                url = f"http://127.0.0.1:{PORT}/{target}"
                if query:
                    url += "?" + urlencode(query)
                png = out / f"{name}.png"
                subprocess.run(
                    [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                     f"--window-size={w},{h}", f"--screenshot={png}",
                     "--virtual-time-budget=2500", url],
                    capture_output=True, timeout=120)
                if not png.exists():
                    sys.exit(f"{name}: chrome produced no file")
                print(f"  {name:24s} {png.stat().st_size // 1024:>4d} KB  {url}")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    finally:
        server.terminate()
        server.wait(timeout=10)

    print(f"\n{len(SHOTS)} shots → {out}")


if __name__ == "__main__":
    main()
