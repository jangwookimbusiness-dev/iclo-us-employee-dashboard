#!/usr/bin/env python3
"""Build every derived document and stamp what it was built from.

    python3 scripts/docs_build.py            # rebuild what is stale, restamp
    python3 scripts/docs_build.py --force    # rebuild everything

One command replaces the by-hand sequence this repo ran for two days: rebuild
each PDF when its markdown changed, and never forget one. The forgetting is the
point — the tech doc's PDF went stale against its markdown exactly once, and the
only reason it was caught was that someone happened to ask.

2026-08-27 (#49): the screenshot stage is gone with the screens it shot. The
twelve PNGs stay in the repository as frozen sales artifacts — charter §4.1
preserves the sent proposal and its images rather than reproducing them — and the
proposal PDF still lists `assets/*` among its sources, so changing a PNG by hand
still breaks that PDF's stamp.

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


def normalize_pdf_dates(pdf: Path, digest: str) -> None:
    """PDF 안의 생성·수정 시각을 소스 내용에서 유도한 고정값으로 바꾼다.

    왜. make-pdf 는 빌드 시각을 박으므로 **같은 소스를 두 번 빌드하면 바이트가
    달라진다** — 측정해보면 크기는 같고 다른 바이트가 딱 4개, 전부 타임스탬프다.
    그래서 내용이 안 바뀐 재빌드도 git 에 새 blob 을 하나 더 얹는다. 2026-08-25
    시점에 히스토리의 1MiB 초과 blob 201MiB 중 **110MiB(55%)가 관리 PDF 두 개의
    34개 판본**이었고(이슈 #23 인벤토리), 그 대부분이 이 시각 때문이다.

    고정값을 소스 digest 에서 유도하는 이유는 두 가지다. 상수로 박으면 서로 다른
    내용의 문서가 같은 날짜를 갖게 되어 사람이 볼 때 거짓이 되고, 실제 시각을 쓰면
    결정성이 깨진다. digest 에서 유도하면 **내용이 같으면 같고 다르면 다르다.**

    ponytail: PyMuPDF 는 이미 requirements-dev.txt 에 핀돼 있다. 새 의존성 없음.
    실패하면 조용히 넘긴다 — 결정성은 좋은 것이지 문서 빌드를 막을 이유가 아니다.
    """
    try:
        import pymupdf
    except ImportError:
        try:
            import fitz as pymupdf          # 구버전 이름
        except ImportError:
            return
    try:
        # digest 는 문자열이 아니라 경로→해시 매핑이다. 안정적으로 직렬화해 한 번 더
        # 해싱한다 — 정렬하지 않으면 dict 순서가 값에 새어 들어온다.
        import datetime
        import hashlib
        import json as _json
        key = hashlib.sha256(
            _json.dumps(digest, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()
        offset = int(key[:8], 16) % (20 * 365 * 24 * 3600)
        when = datetime.datetime(2000, 1, 1) + datetime.timedelta(seconds=offset)
        stamp = when.strftime("D:%Y%m%d%H%M%S+00'00'")

        doc = pymupdf.open(pdf)
        md = doc.metadata or {}
        md["creationDate"] = stamp
        md["modDate"] = stamp
        doc.set_metadata(md)
        # XMP 에도 날짜가 실린다. 비워야 한 군데만 고치고 다른 데가 남는 일이 없다.
        doc.set_xml_metadata("")
        # saveIncr() 은 **덧붙이기**라 옛 CreationDate 가 파일에 그대로 남고 새 것이
        # 뒤에 붙는다. 첫 판이 그래서 여전히 비결정적이었다. garbage=4 로 전체를
        # 다시 쓰면 옛 객체가 사라진다.
        rewritten = pdf.with_suffix(".normalized.pdf")
        doc.save(str(rewritten), garbage=4, deflate=True)
        doc.close()

        # 마지막 비결정 요소: 트레일러의 `/ID [<..><..>]`. PDF 작성기가 저장마다
        # 난수로 만들고 PyMuPDF 는 이걸 지정하는 API 가 없다. 측정해보면 날짜를
        # 고정한 뒤에도 남는 차이가 정확히 이 59바이트였다. 같은 **길이**의
        # 결정적 값으로 바꾼다 — 트레일러는 xref 뒤에 오므로 길이를 유지하면
        # startxref 오프셋이 안 흔들린다.
        import re as _re
        raw = rewritten.read_bytes()

        def _fixed_id(match):
            body = match.group(0)
            hexes = _re.findall(rb"<([0-9a-fA-F]+)>", body)
            out = body
            for i, h in enumerate(hexes):
                repl = hashlib.sha256(f"{key}:{i}".encode()).hexdigest()[:len(h)]
                repl = repl.upper().encode() if h.isupper() else repl.encode()
                out = out.replace(b"<" + h + b">", b"<" + repl + b">", 1)
            return out

        patched = _re.sub(rb"/ID\s*\[\s*<[0-9a-fA-F]+>\s*<[0-9a-fA-F]+>\s*\]",
                          _fixed_id, raw)
        if len(patched) != len(raw):
            raise ValueError("/ID 치환이 길이를 바꿨다 — xref 가 깨진다")
        rewritten.write_bytes(patched)
        rewritten.replace(pdf)
    except Exception as exc:
        # 결정성은 좋은 것이지 문서 빌드를 막을 이유가 아니다. 다만 조용히 넘기면
        # 이 함수가 죽은 것을 아무도 모르므로 한 줄 남긴다.
        print(f"  (PDF 날짜 정규화 건너뜀: {type(exc).__name__}: {exc})")


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
    normalize_pdf_dates(tmp_out, digest)
    tmp_out.replace(out)

    import re
    pages = len(re.findall(rb"/Type\s*/Page[^s]", out.read_bytes()))
    stamps[entry["name"]] = {"sources": digest, "artifact": sha(out), "pages": pages}
    print(f"  {entry['name']:<18} 빌드 — {pages}쪽")
    return True


def main():
    force = "--force" in sys.argv
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    stamps = load_stamps()
    changed = False
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
