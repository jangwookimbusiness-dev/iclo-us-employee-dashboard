#!/usr/bin/env python3
"""Fail when a derived document no longer matches what it was built from.

The drift this catches actually happened: the tech doc's markdown changed and
its committed PDF silently kept describing the previous version, and the only
detector was somebody asking "is the tech doc updated?". A screen changed and
the proposal's screenshots kept showing the old screen. Every one of those is
invisible in review, because the artifact looks complete — it is just a
complete picture of the wrong thing.

scripts/docs_build.py writes .docstamps.json recording the sha256 of every
source each artifact was built from, and of the artifact it produced. This test
recomputes and compares. Three distinct failures, each with its own message:

  · sources changed since the build   → rebuild (the common case)
  · artifact missing or hand-swapped  → rebuild (the sneaky case)
  · stamp file absent                 → nothing was ever built on this clone

Pure hashing — no Chrome, no make-pdf — so it runs in CI and pre-commit in
well under a second. The build itself cannot run in CI (make-pdf is a local
binary); CI's job is only to refuse drift, and the fix is always the same one
command:

    python3 scripts/docs_build.py

Per this repo's rule, the test counts what it verified and fails on zero.
"""
import glob
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "scripts/doc-manifest.json"
STAMPS = ROOT / ".docstamps.json"
FIX = "python3 scripts/docs_build.py"


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def resolve(patterns):
    out = []
    for pat in patterns:
        if any(c in pat for c in "*?["):
            out += [Path(h) for h in sorted(glob.glob(str(ROOT / pat)))]
        else:
            out.append(ROOT / pat)
    seen, uniq = set(), []
    for p in out:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def digest_sources(paths):
    missing = [p for p in paths if not p.exists()]
    if missing:
        return None, f"원본이 없음: {missing[0].relative_to(ROOT)}"
    return {str(p.relative_to(ROOT)): sha(p) for p in paths}, None


def main():
    if not MANIFEST.exists():
        sys.exit(f"FAIL — 매니페스트 없음: {MANIFEST.relative_to(ROOT)}")
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not STAMPS.exists():
        sys.exit(f"FAIL — .docstamps.json 없음. 이 클론에서 빌드된 적이 없다 → {FIX}")
    stamps = json.loads(STAMPS.read_text(encoding="utf-8"))

    errors, checked = [], 0

    # 스크린샷: 화면·데이터·촬영 스크립트가 바뀌면 12장이 다시 떠야 한다
    sc = m["screenshots"]
    st = stamps.get("screenshots")
    if not st:
        errors.append(f"screenshots: 스탬프 없음 → {FIX}")
    else:
        digest, err = digest_sources(resolve(sc["inputs"]))
        if err:
            errors.append(f"screenshots: {err}")
        elif digest != st.get("sources"):
            diff = [k for k in digest if digest[k] != st["sources"].get(k)]
            errors.append(f"screenshots: 원본이 빌드 이후 바뀜 ({', '.join(diff[:3])}) → {FIX}")
        else:
            for rel, want in st.get("artifacts", {}).items():
                p = ROOT / rel
                checked += 1
                if not p.exists():
                    errors.append(f"screenshots: {rel} 없음 → {FIX}")
                elif sha(p) != want:
                    errors.append(f"screenshots: {rel} 이 빌드 산출물과 다름 (손으로 바꿨나) → {FIX}")

    # PDF 들
    for entry in m["pdfs"]:
        name, out = entry["name"], ROOT / entry["out"]
        st = stamps.get(name)
        checked += 1
        if not st:
            errors.append(f"{name}: 스탬프 없음 → {FIX}")
            continue
        digest, err = digest_sources(resolve(entry["sources"]))
        if err:
            errors.append(f"{name}: {err}")
            continue
        if digest != st.get("sources"):
            diff = [k for k in digest if digest[k] != st["sources"].get(k)]
            errors.append(f"{name}: 원본이 빌드 이후 바뀜 ({', '.join(diff[:3])}) → {FIX}")
            continue
        if not out.exists():
            errors.append(f"{name}: PDF 없음 ({entry['out']}) → {FIX}")
            continue
        if sha(out) != st.get("artifact"):
            errors.append(f"{name}: PDF 가 빌드 산출물과 다름 (손으로 바꿨나) → {FIX}")

    if checked == 0:
        sys.exit("FAIL — 검사한 대상이 0개. 매니페스트가 비었거나 검사기가 고장났다")
    if errors:
        print(f"FAIL — {len(errors)}건")
        for e in errors:
            print("  ✗", e)
        sys.exit(1)
    pages = {e["name"]: stamps[e["name"]].get("pages") for e in m["pdfs"] if e["name"] in stamps}
    print(f"PASS — 산출물 {checked}개가 전부 원본과 일치 · "
          + " · ".join(f"{k} {v}쪽" for k, v in pages.items()))


if __name__ == "__main__":
    main()
