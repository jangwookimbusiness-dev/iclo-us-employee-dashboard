#!/usr/bin/env python3
"""제안서 데크 마크다운 → 16:9 PDF.

    python3 scripts/build/proposal-v11/build_deck_v11.py \
        proposal-v11/v3-merged/제안서-데크-KO.md \
        proposal-v11/pdf/ICLO-Snowflake-제안서-v11-데크-16x9-KO.pdf

마크다운의 `배치:` 줄이 레이아웃을 고른다. 그 줄이 슬라이드에 인쇄되지는 않는다.
BRIEF 5.1 의 hallmark 게이트를 CSS 에 박아 두었다 — 게이트 번호를 주석으로 달아
두었으니 규칙을 바꿀 때 어디를 건드려야 하는지 바로 보인다.

의존: pandoc (마크다운 조각 → HTML), Chrome (인쇄).
"""
import html
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 배치 힌트 → CSS 클래스. 부분 문자열로 맞춘다.
LAYOUTS = [
    ("스크린샷", "shots"),
    ("전면 도식", "photo"),   # "흐름도"보다 먼저 본다. 설명문에 흐름도가 섞여도 이미지로 간다
    ("전면 사진", "photo"),
    ("전면 텍스트", "statement"),
    ("흐름도", "flow"),
    ("큰 문장", "lead"),
    ("인용", "quote"),
    ("4열", "wide"),
    ("2단", "two"),
    ("표 + 정의", "tabledefs"),
    ("세로", "prose"),
    ("표", "table"),
]


def layout_for(hint: str, title: str = "") -> str:
    if "표지" in title:
        return "cover"
    for needle, cls in LAYOUTS:
        if needle in hint:
            return cls
    return "prose"


def md_to_html(md: str) -> str:
    """pandoc 으로 조각 변환. 표·목록·코드블록을 직접 파싱하지 않기 위해서다."""
    out = subprocess.run(
        ["pandoc", "-f", "gfm", "-t", "html", "--no-highlight"],
        input=md, capture_output=True, text=True, check=True,
    )
    return out.stdout


def absolutise(md: str, base: pathlib.Path) -> str:
    """이미지 경로를 절대경로로. Chrome 이 file:// 로 읽을 수 있어야 한다."""
    def repl(m):
        raw = m.group(2)
        if raw.startswith(("file://", "http://", "https://", "data:")):
            return m.group(0)                   # image_lines 가 이미 절대화한 것
        p = pathlib.Path(raw) if raw.startswith("/") else (base / raw).resolve()
        if not p.exists():                      # 레포 루트 기준 경로도 허용
            p = (ROOT / raw).resolve()
        if not p.exists():
            print(f"  경고: 이미지 없음 {raw}", file=sys.stderr)
            return m.group(0)
        return f"![{m.group(1)}]({p.as_uri()})"
    return re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", repl, md)


def image_lines(md: str, base: pathlib.Path) -> str:
    """`사진: <경로>` / `왼쪽: <경로>` 같은 줄을 실제 이미지로 바꾼다."""
    def repl(m):
        raw = m.group(2)
        p = (base / raw).resolve()
        if not p.exists():
            p = (ROOT / raw).resolve()
        if not p.exists():
            print(f"  경고: 이미지 없음 {raw}", file=sys.stderr)
            return m.group(0)
        return f"![{m.group(1)}]({p.as_uri()})"
    return re.sub(r"^(사진|왼쪽|오른쪽): `?([^`\s]+\.(?:png|jpg|jpeg))`?$",
                  repl, md, flags=re.M)


def parse(path: pathlib.Path):
    text = path.read_text(encoding="utf-8")
    base = path.parent
    slides = []
    # `## S<n> 제목` 단위로 자른다. 그 앞의 렌더링 규칙 절은 버린다.
    for m in re.finditer(r"^## (S\d+[a-z]?)\s+(.+?)$\n(.*?)(?=^## |\Z)",
                         text, flags=re.M | re.S):
        num, title, body = m.group(1), m.group(2).strip(), m.group(3)
        hint = ""
        hm = re.search(r"^배치:\s*(.+)$", body, flags=re.M)
        if hm:
            hint = hm.group(1)
            body = body.replace(hm.group(0), "")
        body = re.sub(r"^---$", "", body, flags=re.M).strip()
        # 작성용 라벨은 걷어낸다. 슬라이드에 인쇄될 글이 아니다.
        body = re.sub(r"^캡션:\s*", "", body, flags=re.M)
        body = re.sub(r"^작은 글씨:\s*(.+)$", r"<sub>\1</sub>", body, flags=re.M)
        body = image_lines(body, base)
        body = absolutise(body, base)
        # 분량을 재서 빽빽한 장만 활자를 줄인다. 나머지는 발표용 크기로 간다.
        # 이미지 마크업은 빼고 센다. file:// 경로가 글자수에 잡히면 사진 장이
        # 빽빽한 것으로 오판된다.
        counted = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", body)
        plain = re.sub(r"\s+", " ", re.sub(r"[|`*>#\-\n]", " ", counted)).strip()
        dense = " dense" if len(plain) > 380 else ""
        slides.append({"num": num, "title": title,
                       "layout": layout_for(hint, title) + dense,
                       "body": md_to_html(body)})
    return slides


CSS = """
@page { size: 13.333in 7.5in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

:root {
  --coral: #C2333A;   /* 흰 배경 5.49:1. 게이트 40 */
  --navy:  #1B2A4A;
  --teal:  #007A87;
  --ink:   #16202E;
  --mute:  #5A6675;
  --rule:  #D8DEE6;
}

/* 게이트 37·38 — 서체는 본문 하나 + 코드용 모노 하나. */
body {
  font-family: "Apple SD Gothic Neo", "Helvetica Neue", Arial, sans-serif;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}
code, pre { font-family: "SF Mono", Menlo, monospace; }

.slide {
  width: 13.333in; height: 7.5in;
  page-break-after: always; break-after: page;
  padding: 0.62in 0.78in 0.5in;
  display: flex; flex-direction: column;
  position: relative; overflow: hidden;   /* 게이트 44 — 넘치면 잘려서 바로 보인다 */
  background: #fff;
}
.slide:last-child { page-break-after: auto; }

/* 게이트 54 — 번호는 제목 "위 같은 열". 옆에 두지 않는다. */
.num {
  font-size: 12pt; letter-spacing: .14em; color: var(--mute);
  margin-bottom: .10in;
}
h1.title {
  font-size: 34pt; line-height: 1.12;    /* 게이트 55 — 1.02 이상 */
  margin: 0 0 .26in; font-weight: 700; color: var(--navy);
  max-width: 11in;
}
.rule { height: 3px; background: var(--coral); width: 1.9in; margin-bottom: .26in; }
.body { flex: 1; min-height: 0; font-size: 17pt; line-height: 1.52;
        display: flex; flex-direction: column; justify-content: center; }
.body > :first-child { margin-top: 0; }
.body p { margin: 0 0 .19in; }
.body strong { color: var(--navy); }
.body a { color: var(--teal); }

table { border-collapse: collapse; width: 100%; margin: 0 0 .19in; font-size: 15pt; }
th, td { text-align: left; padding: .135in .16in; border-bottom: 1px solid var(--rule);
         vertical-align: top; line-height: 1.4; }
th { color: var(--navy); font-weight: 700; border-bottom: 2px solid var(--navy); }

ul, ol { margin: 0 0 .16in; padding-left: .26in; }
li { margin-bottom: .1in; }
blockquote { margin: 0 0 .16in; padding-left: .2in; border-left: 3px solid var(--coral);
             color: var(--navy); }
pre { background: #F4F6F9; padding: .2in; border-radius: 3px; font-size: 13pt;
      line-height: 1.45; overflow: hidden; }
code { font-size: .92em; background: #F0F3F7; padding: .01in .05in; border-radius: 2px; }
pre code { background: none; padding: 0; }
img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
sub { display: block; font-size: 9.5pt; color: var(--mute); margin-top: .06in; }

/* ── 배치별 ─────────────────────────────────────────────── */

/* 전면 텍스트. 게이트 6 — 전부 가운데 정렬하지 않는다. 왼쪽 정렬로 축을 깬다. */
.statement .body { display: flex; flex-direction: column; justify-content: center; }
.statement .body p:first-child { font-size: 30pt; line-height: 1.34; font-weight: 700;
                                 color: var(--navy); margin-bottom: .22in; max-width: 10in; }
.statement .body p { font-size: 19pt; max-width: 9.5in; }

/* 큰 문장 + 설명 */
.lead .body p:first-child { font-size: 25pt; line-height: 1.34; font-weight: 700;
                            color: var(--navy); margin-bottom: .2in; max-width: 10.5in; }

/* 2단. .body 의 flex 를 끄지 않으면 column-count 가 먹지 않고 제목과 겹친다. */
.two .body { display: block; column-count: 2; column-gap: .5in; }
.two .body > * { break-inside: avoid; }
.two .body table { font-size: 13.5pt; }

/* 4열 표는 글자를 줄여 한 장에 넣는다 */
.wide .body table { font-size: 13pt; }
.wide .body th, .wide .body td { padding: .11in .12in; }

/* 전면 사진 — 사진이 주인공, 캡션은 아래 밴드 */
.photo .body { justify-content: flex-start; }
.photo .body p:has(img) { flex: 1; min-height: 0; margin-bottom: .12in; }
.photo .body img { width: 100%; height: 100%; object-fit: cover; }
.photo .body p:not(:has(img)) { font-size: 15pt; max-width: 11in; }

/* 스크린샷 2장 나란히. 게이트 47 — 도형으로 그리지 않는다. */
.shots .body { justify-content: flex-start; }
.shots .body p:has(img) { display: flex; gap: .22in; align-items: flex-start; }
.shots .body p:has(img) img { flex: 1; min-width: 0; width: 100%; height: auto;
                              object-fit: contain; border: 1px solid var(--rule); }
.shots .body p:not(:has(img)) { font-size: 14pt; margin-bottom: .07in; }

/* 흐름도 */
.flow .body pre { font-size: 13.5pt; line-height: 1.6; background: #fff;
                  border: 1px solid var(--rule); }

/* 인용 */
.quote .body blockquote p { font-size: 16pt; line-height: 1.5; }

/* 표지 — 제목만 크게, 나머지는 왼쪽 정렬로 축을 깬다. 게이트 6 */
.cover .num, .cover .rule { display: none; }
.cover h1.title { display: none; }
.cover .body { display: flex; flex-direction: column; justify-content: center; }
.cover .body blockquote { border: 0; padding: 0; margin-bottom: .34in; }
.cover .body blockquote p { font-size: 40pt; line-height: 1.16; font-weight: 700;
                            color: var(--navy); margin: 0; }
.cover .body > p { font-size: 14pt; color: var(--mute); max-width: 8in;
                   border-top: 2px solid var(--coral); padding-top: .16in;
                   display: inline-block; }

/* 게이트 44 — 380자 넘는 장만 한 단계 낮춘다. 지금은 S12·S16 둘뿐. */
.dense h1.title { font-size: 29pt; margin-bottom: .2in; }
.dense .rule { margin-bottom: .2in; }
.dense .body { font-size: 14pt; line-height: 1.45; }
.dense .body table { font-size: 12.5pt; }
.dense .body th, .dense .body td { padding: .085in .12in; }
.dense .body p { margin: 0 0 .14in; }
.dense .body blockquote p { font-size: 13.5pt; }

.foot { position: absolute; left: .78in; right: .78in; bottom: .3in;
        display: flex; justify-content: space-between;
        font-size: 9pt; color: var(--mute); }
"""

PAGE = """<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>{title}</title><style>{css}</style></head><body>{slides}</body></html>"""

SLIDE = """<section class="slide {layout}">
  <div class="num">{num}</div>
  <h1 class="title">{title}</h1>
  <div class="rule"></div>
  <div class="body">{body}</div>
  <div class="foot"><span>ICLO × Snowflake</span><span>{num} / {total}</span></div>
</section>"""


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    src, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
    if not shutil.which("pandoc"):
        print("pandoc 이 필요합니다", file=sys.stderr)
        return 1
    if not pathlib.Path(CHROME).exists():
        print("Chrome 이 필요합니다", file=sys.stderr)
        return 1

    slides = parse(src)
    if not slides:
        print("슬라이드를 찾지 못했습니다. `## S1 제목` 형식인지 확인하십시오.", file=sys.stderr)
        return 2

    total = len(slides)
    body = "\n".join(
        SLIDE.format(layout=s["layout"], num=s["num"],
                     title=html.escape(s["title"]), body=s["body"], total=total)
        for s in slides
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    htmlfile = out.with_suffix(".html")
    htmlfile.write_text(PAGE.format(title=src.stem, css=CSS, slides=body), encoding="utf-8")

    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    "--allow-file-access-from-files",
                    f"--print-to-pdf={out}", htmlfile.as_uri()],
                   check=True, capture_output=True)
    print(f"{total}장 · {out}")
    for s in slides:
        print(f"  {s['num']:>4} {s['layout']:<10} {s['title']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
