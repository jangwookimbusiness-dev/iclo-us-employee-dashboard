#!/usr/bin/env python3
"""Stage the exact public GitHub Pages surface: one redirect, nothing else.

The printed booth QR code encodes the Pages root and the copy Snowflake holds
cannot be recalled. The employer demo that used to answer there was scrapped on
2026-08-13, so the root publishes a redirect to the live site.

**2026-08-26: the demo is no longer published at all.** Until now the allowlist
also carried `app.html` and `data/member-demo.json`, so the QR redirected while
the employee app stayed reachable one path over. That made the public surface
larger than the one thing it exists to do. The repository is restarting from a
clean base, and a scrapped demo has no reason to be on the internet in the
meantime.

The redirect is its own file rather than a rewritten `index.html` because
`index.html` is load-bearing locally: `test_single_source` and `test_suppression`
parse its constants, `check-package-consistency` asserts contract values against
it, `shots.py` renders proposal screenshots from it, and `.docstamps.json`
records its hash. It stays in the repository as a proposal illustration; it just
stops being served.

Run it locally with `bash scripts/serve.sh`.
"""
from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"

# (repository source, path it is published under). The two differ.
PUBLIC_FILES = (
    (Path("pages-root-redirect.html"), Path("index.html")),
)

# Files that must NOT reach Pages. Listing them is the point: an allowlist says
# what goes out, and this says what someone would plausibly put back. Both
# screens and the app's data feed were published until 2026-08-26.
FORBIDDEN_ON_PAGES = (
    Path("index.html"),
    Path("app.html"),
    Path("data/member-demo.json"),
)


def main() -> int:
    missing = [str(src) for src, _ in PUBLIC_FILES if not (ROOT / src).is_file()]
    symlinks = [str(src) for src, _ in PUBLIC_FILES if (ROOT / src).is_symlink()]
    if missing or symlinks:
        if missing:
            print("FAIL — Pages allowlist source missing: " + ", ".join(missing))
        if symlinks:
            print("FAIL — Pages allowlist source must not be a symlink: " + ", ".join(symlinks))
        return 1

    if OUT.is_symlink():
        print("FAIL — _site must be a directory, not a symlink")
        return 1
    if OUT.exists():
        shutil.rmtree(OUT)

    for src, published in PUBLIC_FILES:
        destination = OUT / published
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / src, destination)

    expected = {published.as_posix() for _, published in PUBLIC_FILES}
    actual = {
        path.relative_to(OUT).as_posix()
        for path in OUT.rglob("*")
        if path.is_file()
    }
    if actual != expected:
        extra = sorted(actual - expected)
        absent = sorted(expected - actual)
        print(f"FAIL — Pages artifact drift: extra={extra}, missing={absent}")
        return 1

    # The redirect is the whole point of the deployment, so prove the published
    # root actually carries the destination rather than trusting the copy.
    root_html = (OUT / "index.html").read_text(encoding="utf-8")
    if "grin-mauve.vercel.app" not in root_html:
        print("FAIL — published index.html does not carry the redirect target")
        return 1

    # And prove the demo did not come along. The drift check above compares the
    # staged set against PUBLIC_FILES, which means it agrees with whatever
    # PUBLIC_FILES currently says — it cannot notice a file being added to it.
    # This names the files instead.
    leaked = [str(f) for f in FORBIDDEN_ON_PAGES
              if f.name != "index.html" and (OUT / f).exists()]
    if (OUT / "index.html").stat().st_size > 8192:
        leaked.append("index.html (too large for a redirect stub)")
    if leaked:
        print("FAIL — the scrapped demo reached the public surface: "
              + ", ".join(leaked))
        return 1

    print("PASS — Pages artifact allowlist: " + ", ".join(sorted(actual)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
