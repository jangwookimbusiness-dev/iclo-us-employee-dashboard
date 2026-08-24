#!/usr/bin/env python3
"""Build every derived document and stamp what it was built from.

    python3 scripts/docs_build.py            # rebuild what is stale, restamp
    python3 scripts/docs_build.py --force    # rebuild everything

One command replaces the by-hand sequence this repo ran for two days: re-shoot
the screenshots when a screen changed, rebuild each PDF when its markdown
changed, keep the ordering right (screenshots feed the proposal PDF), and never
forget one. The forgetting is the point — the tech doc's PDF went stale against
its markdown exactly once, and the only reason it was caught was that someone
happened to ask.

Stamps, not timestamps. PDFs and PNGs are not byte-reproducible (Chrome embeds
creation dates), so freshness cannot be "artifact unchanged". Instead
.docstamps.json records the sha256 of every SOURCE a target was built from,
plus the sha of the artifact that build produced. test_doc_freshness.py fails
when current sources no longer match the stamp (someone edited and did not
rebuild) or the artifact does not match (someone swapped a PDF by hand).

Skip-if-fresh is what makes this runnable on every commit without churn: a
no-op build touches nothing, so PNGs and PDFs only change in commits where
their sources changed.

Builds need make-pdf and Chrome, so CI intentionally runs only the freshness
check. That split is deliberate: the machine that edits is the machine that
builds; CI just refuses drift.
"""
import glob
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts/doc-manifest.json"
STAMPS = ROOT / ".docstamps.json"

MAKE_PDF_CANDIDATES = [
    Path(os.environ["MAKE_PDF_BIN"]).expanduser()
    if os.environ.get("MAKE_PDF_BIN") else None,
    Path.home() / ".codex/skills/gstack/make-pdf/dist/pdf",
    Path.home() / ".claude/skills/gstack/make-pdf/dist/pdf",
    Path.home() / ".gstack/repos/gstack/make-pdf/dist/pdf",
]
MAKE_PDF = next((p for p in MAKE_PDF_CANDIDATES if p and p.exists()), None)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def resolve(patterns):
    """Expand globs relative to ROOT, sorted, deduped. Missing non-glob = error."""
    out = []
    for pat in patterns:
        if any(c in pat for c in "*?["):
            hits = sorted(glob.glob(str(ROOT / pat)))
            if not hits:
                sys.exit(f"docs_build: 글롭이 아무것도 못 찾음 — {pat}")
            out += [Path(h) for h in hits]
        else:
            p = ROOT / pat
            if not p.exists():
                sys.exit(f"docs_build: 원본 없음 — {pat}")
            out.append(p)
    seen, uniq = set(), []
    for p in out:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def source_digest(paths) -> dict:
    return {str(p.relative_to(ROOT)): sha(p) for p in paths}


def load_stamps() -> dict:
    if STAMPS.exists():
        return json.loads(STAMPS.read_text(encoding="utf-8"))
    return {}


def build_pdf(entry, stamps, force):
    srcs = resolve(entry["sources"])
    digest = source_digest(srcs)
    out = ROOT / entry["out"]
    st = stamps.get(entry["name"])
    if (not force and st and st.get("sources") == digest
            and out.exists() and sha(out) == st.get("artifact")):
        print(f"  {entry['name']:<18} 최신 — 건너뜀")
        return False

    if not MAKE_PDF:
        checked = ", ".join(str(p) for p in MAKE_PDF_CANDIDATES if p)
        sys.exit("docs_build: make-pdf 없음 — gstack을 설치하거나 "
                 f"MAKE_PDF_BIN을 지정하세요. 확인한 경로: {checked}")
    # macOS 샌드박스에서는 /private/tmp를 선호하고, Linux에서는 시스템 임시
    # 디렉터리로 폴백한다. 어느 쪽이든 빌드가 끝나면 제거한다.
    preferred_tmp = Path("/private/tmp")
    tmp_root = preferred_tmp if preferred_tmp.is_dir() else Path(tempfile.gettempdir())
    tmp = tempfile.mkdtemp(prefix="pdf", dir=tmp_root)
    # 한글 출력 파일명을 make-pdf 가 거부하는 경우가 있어 ASCII 임시명으로 만들고 옮긴다.
    tmp_out = out.parent / f".build-{entry['name']}.pdf"
    try:
        r = subprocess.run(
            [str(MAKE_PDF), "generate", str(srcs[0]), str(tmp_out), *entry.get("flags", [])],
            env={**os.environ, "TMPDIR": tmp}, capture_output=True, text=True, cwd=ROOT)
        if r.returncode != 0 or not tmp_out.exists():
            tmp_out.unlink(missing_ok=True)
            sys.exit(f"docs_build: {entry['name']} 빌드 실패\n{r.stderr[-400:]}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    tmp_out.replace(out)

    import re
    pages = len(re.findall(rb"/Type\s*/Page[^s]", out.read_bytes()))
    stamps[entry["name"]] = {"sources": digest, "artifact": sha(out), "pages": pages}
    print(f"  {entry['name']:<18} 빌드 — {pages}쪽")
    return True


def build_shots(m, stamps, force):
    srcs = resolve(m["inputs"])
    digest = source_digest(srcs)
    arts = [ROOT / a for a in m["artifacts"]]
    st = stamps.get("screenshots")
    fresh = (st and st.get("sources") == digest
             and all(a.exists() for a in arts)
             and {str(a.relative_to(ROOT)): sha(a) for a in arts} == st.get("artifacts"))
    if not force and fresh:
        print("  screenshots        최신 — 건너뜀")
        return False

    r = subprocess.run([sys.executable, str(ROOT / "scripts/shots.py"), m["outdir"]],
                       capture_output=True, text=True, cwd=ROOT)
    if r.returncode != 0:
        sys.exit(f"docs_build: shots.py 실패\n{r.stderr[-400:]}\n{r.stdout[-400:]}")
    missing = [a for a in arts if not a.exists()]
    if missing:
        sys.exit(f"docs_build: shots.py 가 끝났는데 산출물이 없음 — {missing[0]}")
    stamps["screenshots"] = {
        "sources": digest,
        "artifacts": {str(a.relative_to(ROOT)): sha(a) for a in arts},
    }
    print(f"  screenshots        재촬영 — {len(arts)}장")
    return True


def main():
    force = "--force" in sys.argv
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    stamps = load_stamps()
    changed = build_shots(m["screenshots"], stamps, force)
    for entry in m["pdfs"]:
        changed |= build_pdf(entry, stamps, force)
    STAMPS.write_text(json.dumps(stamps, ensure_ascii=False, indent=1, sort_keys=True),
                      encoding="utf-8")
    print("스탬프 갱신" if changed else "전부 최신 — 스탬프만 재확인")
    # 빌드 직후 자기 검증 — 빌더와 검사기가 어긋나면 여기서 바로 드러난다
    r = subprocess.run([sys.executable, str(ROOT / "test_doc_freshness.py")],
                       capture_output=True, text=True, cwd=ROOT)
    print(r.stdout.strip())
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
