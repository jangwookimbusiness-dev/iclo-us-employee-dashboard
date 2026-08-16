#!/usr/bin/env python3
"""Assert the app enforces consent at the point of use, and reads real data.

Two properties, both of which used to be claims rather than behaviour:

1. THE DATA BOUNDARY. app.html holds no member data. It fetches
   data/member-demo.json and renders nothing without it. The proposal says
   "the same screen shows that person's own data once real data arrives";
   that sentence is only true if swapping the JSON is the whole job. This test
   swaps the JSON and checks the screen follows.

2. CONSENT IS EVALUATED, NOT READ. Consent is a list of records with a policy
   version, and a capture is gated on evaluating them at the moment of use.
   Three states must all block: withdrawn, never given, and granted under a
   superseded policy text. The third is the one a boolean cannot express and
   the one that silently keeps processing if you get it wrong.

    python3 test_consent.py

Needs Google Chrome. No other dependencies.
"""
import http.server
import json
import os
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

ROOT = Path(__file__).parent
APP = ROOT / "app.html"
DATA = ROOT / "data/member-demo.json"


def _find_chrome():
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
STATE_LINE = re.compile(r"let S = \{[^}]*\};")


def render(tab, data, step=0):
    """Serve a tree containing app.html + the given data, and dump the DOM.

    Served over HTTP rather than file:// on purpose: the app fetches its data,
    and fetch is blocked on file URLs. Rendering it the way it actually runs is
    the point — a test that stubs out the fetch would not have caught the
    shots.py <base> bug that turned every screenshot into an error page.
    """
    html = APP.read_text(encoding="utf-8")
    state = 'let S = { tab:"%s", step:%d, subject:null };' % (tab, step)
    patched, n = STATE_LINE.subn(state, html, count=1)
    if n != 1:
        sys.exit("could not find the state initialiser in app.html")

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "app.html").write_text(patched, encoding="utf-8")
        (root / "data").mkdir()
        (root / "data/member-demo.json").write_text(
            json.dumps(data) if data is not None else "", encoding="utf-8")
        if data is None:
            (root / "data/member-demo.json").unlink()

        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *a, **kw):
                super().__init__(*a, directory=str(root), **kw)

            def log_message(self, *a):
                pass

        with socketserver.TCPServer(("127.0.0.1", 0), Handler) as srv:
            port = srv.server_address[1]
            threading.Thread(target=srv.serve_forever, daemon=True).start()
            out = subprocess.run(
                [CHROME, "--headless=new", "--disable-gpu", "--dump-dom",
                 "--virtual-time-budget=3000",
                 f"http://127.0.0.1:{port}/app.html"],
                capture_output=True, text=True, timeout=90)
            srv.shutdown()

    if out.returncode != 0:
        sys.exit(f"chrome exited {out.returncode}: {out.stderr.strip()[:300]}")
    if "</html>" not in out.stdout:
        sys.exit("chrome returned no document — nothing was rendered")
    return out.stdout


def selectable(dom):
    """Names offered as capture subjects on the 'who is this for' screen."""
    return set(re.findall(r'<button data-subject="[^"]*">\s*'
                          r'<span class="nm">([^<]*)</span>', dom))


def main():
    if not DATA.exists():
        sys.exit(f"missing {DATA}")
    base = json.loads(DATA.read_text(encoding="utf-8"))
    checks = 0

    # ---- 1. no data, no screen -------------------------------------------
    dom = render("home", None)
    if "No member data" not in dom:
        sys.exit("FAIL: app rendered without its data file — a fallback copy has crept back in")
    names = [p["name"] for p in base["parties"]]
    leaked = [n for n in names if n in dom]
    if leaked:
        sys.exit(f"FAIL: member names present with no data file: {leaked}")
    checks += 1

    # ---- 2. the screen follows the data, not the code ---------------------
    renamed = json.loads(json.dumps(base))
    renamed["parties"][0]["name"] = "Zzyzx Testcase"
    dom = render("home", renamed)
    if "Zzyzx Testcase" not in dom:
        sys.exit("FAIL: renaming a party in the JSON did not change the screen")
    if base["parties"][0]["name"] in dom:
        sys.exit(f"FAIL: '{base['parties'][0]['name']}' still on screen after rename — "
                 "the app is reading a baked-in copy")
    checks += 1

    # ---- 3. consent gates the capture, in all three failing states --------
    # Built from the shipped fixture so this tracks the real policy version.
    policy = base["policy_version"]
    subject = base["parties"][0]["name"]

    cases = {
        "withdrawn": [{"purpose": "processing", "granted": True,  "policy_version": policy, "at": "2026-06-04T10:00:00Z"},
                      {"purpose": "photo",      "granted": True,  "policy_version": policy, "at": "2026-06-04T10:00:00Z"},
                      {"purpose": "photo",      "granted": False, "policy_version": policy, "at": "2026-07-01T10:00:00Z"}],
        "never": [{"purpose": "processing", "granted": True, "policy_version": policy, "at": "2026-06-04T10:00:00Z"}],
        # Granted, never withdrawn — but to text we have replaced. A boolean
        # model reads this as consent and keeps processing.
        "stale": [{"purpose": "processing", "granted": True, "policy_version": policy,        "at": "2026-06-04T10:00:00Z"},
                  {"purpose": "photo",      "granted": True, "policy_version": "2000-01-01", "at": "2000-01-01T10:00:00Z"}],
        # Photo consent is current but the basis it rests on is gone.
        "processing_withdrawn": [{"purpose": "processing", "granted": False, "policy_version": policy, "at": "2026-07-01T10:00:00Z"},
                                 {"purpose": "photo",      "granted": True,  "policy_version": policy, "at": "2026-06-04T10:00:00Z"}],
    }

    for label, records in cases.items():
        d = json.loads(json.dumps(base))
        d["parties"][0]["consent"] = records
        dom = render("capture", d)
        if subject in selectable(dom):
            sys.exit(f"FAIL: consent '{label}' still allows a capture for {subject}")
        checks += 1

    # ---- 4. and the happy path still works --------------------------------
    d = json.loads(json.dumps(base))
    d["parties"][0]["consent"] = [
        {"purpose": "processing", "granted": True, "policy_version": policy, "at": "2026-06-04T10:00:00Z"},
        {"purpose": "photo",      "granted": True, "policy_version": policy, "at": "2026-06-04T10:00:00Z"},
    ]
    dom = render("capture", d)
    if subject not in selectable(dom):
        sys.exit(f"FAIL: fully consented profile {subject} is not offered — the gate is stuck shut")
    checks += 1

    if checks < 7:
        sys.exit(f"FAIL: only {checks} checks ran, expected 7 — the test lost coverage")
    print(f"PASS — {checks} checks: data boundary holds, consent blocks "
          "withdrawn/never/stale/no-basis and admits the consented")


if __name__ == "__main__":
    main()
