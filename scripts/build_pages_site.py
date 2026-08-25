#!/usr/bin/env python3
"""Stage the exact public GitHub Pages surface.

Until now Pages served the repository root verbatim, which made the internal
design notes, contracts and historical deliverables web-addressable. Pages now
receives only this explicit allowlist; adding a file is a reviewed change here.

The first entry is published under a name it does not have in the repository.
The booth QR code is printed and the copy Snowflake holds cannot be recalled;
it encodes the Pages root. The employer demo that used to answer there was
scrapped on 2026-08-13, so the root publishes a redirect to the live site
instead. The redirect is its own file rather than a rewritten index.html
because index.html is load-bearing for the gates: test_single_source and
test_suppression parse its constants, check-package-consistency asserts fifteen
contract values against it, shots.py renders five screenshots from it, and
.docstamps.json records its hash.
"""
from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"

# (repository source, path it is published under). The two differ for one entry.
PUBLIC_FILES = (
    (Path("pages-root-redirect.html"), Path("index.html")),
    (Path("app.html"), Path("app.html")),
    (Path("data/member-demo.json"), Path("data/member-demo.json")),
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

    print("PASS — Pages artifact allowlist: " + ", ".join(sorted(actual)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
