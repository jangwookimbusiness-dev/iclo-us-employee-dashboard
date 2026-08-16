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
    ("dashboard-overview",   "index.html", {"tab": "overview"},                              (1280, 660)),
    ("dashboard-signals",    "index.html", {"tab": "signals"},                               (1280, 720)),
    ("dashboard-funnel",     "index.html", {"tab": "funnel"},                                (1280, 850)),
    ("dashboard-suppressed", "index.html", {"tab": "overview", "dept": "Facilities (pilot site)"}, (1280, 700)),
    ("dashboard-members",    "index.html", {"tab": "overview", "lens": "members"},           (1280, 660)),
    ("app-home",             "app.html",   {},                                               (500, 1700)),
    ("app-coverage",         "app.html",   {},                                               (500, 830)),
    ("app-care",             "app.html",   {},                                               (500, 1050)),
    ("app-settings",         "app.html",   {},                                               (500, 1400)),
    ("app-whoisit",          "app.html",   {},                                               (500, 1050)),
    ("app-camera",           "app.html",   {},                                               (500, 1100)),
    ("app-notanalysed",      "app.html",   {},                                               (500, 1400)),
]

# app.html keeps its screen in a JS variable rather than the URL — it is a
# single-member demo, so there is nothing to deep-link to yet. Patch instead.
APP_TAB = {"app-home": "home", "app-coverage": "coverage", "app-care": "care",
           "app-settings": "settings", "app-whoisit": "capture"}
# Two shots need a subject picked and a step set, which is not URL state — the
# app is a single-member demo with nothing to deep-link to yet.
APP_STATE = {"app-camera":      'let S = { tab:"capture", step:1, subject:"P1" };',
             "app-notanalysed": 'let S = { tab:"capture", step:3, subject:"P1" };'}


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

        # app.html fetches data/member-demo.json by relative path. A patched
        # copy lives one directory down in .shots-tmp/, where that path resolves
        # to .shots-tmp/data/... and 404s — the app would then render its "no
        # member data" screen and every app shot would be that error, silently.
        # A <base> restores the original resolution. Rewriting the fetch string
        # instead would mean the shots no longer exercise the real path.
        def patch(src, anchor, repl, name):
            if src.count(anchor) != 1:
                sys.exit(f"app.html: state initialiser not found — shots.py is stale")
            if "<base " in src:
                sys.exit("app.html already has a <base> — shots.py would inject a second")
            # app.html has no <head> element; it opens straight into <meta
            # charset>. The first version of this anchored on "<head>", found
            # nothing, and injected nothing — and every app shot came out as the
            # "no member data" error screen while the run reported 12 successes.
            # Assert the injection took.
            head = '<meta charset="utf-8">'
            if src.count(head) != 1:
                sys.exit("app.html: charset meta not found — shots.py is stale")
            src = src.replace(head, head + '\n<base href="../">', 1)
            if '<base href="../">' not in src:
                sys.exit("app.html: <base> injection failed")
            target = f".shots-tmp/{name}.html"
            (ROOT / target).write_text(src.replace(anchor, repl, 1), encoding="utf-8")
            return target

        try:
            for name, page, query, (w, h) in SHOTS:
                target = page
                anchor = 'let S = { tab:"home", step:0, subject:null };'
                if name in APP_STATE:
                    target = patch((ROOT / page).read_text(encoding="utf-8"),
                                   anchor, APP_STATE[name], name)
                elif name in APP_TAB:
                    # Check the anchor exists rather than that the text changed:
                    # the home shot patches "home" to "home" and a changed-text
                    # check reads that no-op as a stale script.
                    target = patch((ROOT / page).read_text(encoding="utf-8"), anchor,
                                   'let S = { tab:"%s", step:0, subject:null };' % APP_TAB[name],
                                   name)

                url = f"http://127.0.0.1:{PORT}/{target}"
                if query:
                    url += "?" + urlencode(query)
                png = out / f"{name}.png"
                # The PNGs are committed, so "the file exists" proves nothing —
                # a failed run would report success over yesterday's images.
                # Delete first, then require a fresh one.
                png.unlink(missing_ok=True)
                cam = (["--use-fake-device-for-media-stream",
                        "--use-fake-ui-for-media-stream"] if name == "app-camera" else [])
                r = subprocess.run(
                    [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                     *cam, f"--window-size={w},{h}", f"--screenshot={png}",
                     "--virtual-time-budget=3000", url],
                    capture_output=True, timeout=120)
                if r.returncode != 0:
                    sys.exit(f"{name}: chrome exited {r.returncode}: "
                             f"{r.stderr.decode('utf-8', 'replace').strip()[:300]}")
                if not png.exists() or png.stat().st_size < 2000:
                    sys.exit(f"{name}: chrome produced no usable file")
                print(f"  {name:24s} {png.stat().st_size // 1024:>4d} KB  {url}")
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    finally:
        server.terminate()
        server.wait(timeout=10)

    print(f"\n{len(SHOTS)} shots → {out}")


if __name__ == "__main__":
    main()
