#!/usr/bin/env python3
"""Stage the exact public GitHub Pages surface.

The repository contains internal-audience design notes, contracts, historical
deliverables, and future export locations. Uploading the repository root makes
all of those web-addressable. Pages therefore receives only this explicit
allowlist; adding a file is a reviewed change to this script.
"""
from pathlib import Path
import shutil
import sys


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "_site"
PUBLIC_FILES = (
    Path("index.html"),
    Path("app.html"),
    Path("data/member-demo.json"),
)


def main() -> int:
    missing = [str(rel) for rel in PUBLIC_FILES if not (ROOT / rel).is_file()]
    symlinks = [str(rel) for rel in PUBLIC_FILES if (ROOT / rel).is_symlink()]
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

    for rel in PUBLIC_FILES:
        destination = OUT / rel
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, destination)

    expected = {rel.as_posix() for rel in PUBLIC_FILES}
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

    print("PASS — Pages artifact allowlist: " + ", ".join(sorted(actual)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
