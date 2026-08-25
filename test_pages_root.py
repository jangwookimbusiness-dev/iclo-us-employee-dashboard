#!/usr/bin/env python3
"""발행된 Pages 루트가 리다이렉트인지, 폐기된 기업 데모가 아닌지 단언한다.

왜 별도 파일인가. `scripts/build_pages_site.py` 는 이미 자기 안에서 루트가
리다이렉트 대상을 실었는지 확인한다 (그 파일 67~72행). 그런데 **그 검사가
검사 대상과 같은 파일에 있다.** 그 스크립트를 통째로 다른 판으로 바꾸면 검사도
같이 사라지고, 새 판은 자기 `PUBLIC_FILES` 정의를 자기 자신과 대조해 통과한다.

실제로 그 상황이 지금 열려 있다. `chore/operational-readiness` 브랜치가 같은
경로에 `PUBLIC_FILES` 가 (원본, 발행이름) 쌍이 아니라 경로 하나인 판을 들고
있고, add/add 충돌을 그쪽으로 해소하면

    PASS — Pages artifact allowlist: app.html, data/member-demo.json, index.html

가 찍히면서 Pages 루트가 기업 데모로 돌아간다. 통과하는 이유는 바뀐 것이
정의 자체라서다. 새 정의를 자기 자신과 비교하면 언제나 맞다.

그래서 이 파일은 **정의를 안 읽는다.** 빌더를 그냥 실행시키고 나온 `_site/` 를
본다. `PUBLIC_FILES` 가 쌍이든 경로든 튜플이든 상관없이, 발행된 루트가 무엇인지
만 묻는다.

무엇이 걸려 있는가. 부스 QR 이 인쇄돼 나갔고 Snowflake 가 들고 있는 사본은
회수할 수 없다. 그 QR 이 Pages 루트를 가리키고, 거기 있던 기업 데모는
2026-08-13 에 폐기됐다. 루트가 데모로 돌아가면 폐기한 물건을 외부에 다시
서빙하는 것이고, 그걸 되돌리는 방법은 인쇄물 회수뿐이라 없다.

레드라인 검사도 이 파일을 못 지킨다 — `pages-root-redirect.html` 을 목록에
넣지만 `[ -f "$f" ] || continue` 로 가드하므로 파일이 사라지면 조용히 건너뛴다.
이 저장소에서 검사 셋이 죽은 것과 같은 형태다.
"""
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILDER = ROOT / "scripts/build_pages_site.py"
SITE = ROOT / "_site"

# 라이브 사이트. 리다이렉트가 여기를 가리켜야 한다.
LIVE_HOST = "grin-mauve.vercel.app"


class RootDoc(HTMLParser):
    """발행된 루트를 구조로 읽는다. 부분문자열로 보면 우회가 쉽다.

    첫 판은 html 전체에 대해 `LIVE_HOST in html` · `"location.replace" in html` 을
    봤다. 그러면 **폐기된 대시보드에 그 단어들을 담은 HTML 주석 한 줄만 붙여도
    전부 통과한다** (codex 재검토, 2026-08-25). 주석과 스크립트와 메타 태그는
    브라우저에게 전혀 다른 것이므로 검사도 구분해야 한다.

    HTMLParser 는 주석을 handle_comment 로 따로 준다. 그래서 주석 내용은 어디에도
    누적하지 않는다 — 그게 이 클래스의 존재 이유다.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.script = []          # <script> 본문만
        self.refresh = []         # <meta http-equiv=refresh> 의 content
        self.canonical = []       # <link rel=canonical> 의 href
        self.text = []            # 사람이 보는 본문 텍스트
        self._in_script = False

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "script":
            self._in_script = True
        elif tag == "meta" and a.get("http-equiv", "").lower() == "refresh":
            self.refresh.append(a.get("content", ""))
        elif tag == "link" and "canonical" in a.get("rel", "").lower():
            self.canonical.append(a.get("href", ""))
        elif tag == "a" and a.get("href"):
            self.text.append(a["href"])

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_script = False

    def handle_data(self, data):
        (self.script if self._in_script else self.text).append(data)

    def handle_comment(self, data):
        pass          # 의도적으로 버린다. 주석은 브라우저 동작이 아니다

# 폐기된 기업 데모의 지문. index.html 이 루트로 발행되면 이것들이 따라온다.
# 상수 블록이라 데모가 살아 있는 한 사라지지 않고, 사라졌다면 그건 데모가
# 아니므로 어느 쪽이든 이 검사가 맞다.
DEMO_FINGERPRINTS = ("const MIN_CELL", "const DEP_RATIO", "const FRAC")

# 리다이렉트 stub 의 상한. 현재 약 1.3KB 이고 index.html 은 26KB 다. 지문 이름을
# 바꿔 위 검사를 피해도 크기는 남는다.
MAX_ROOT_BYTES = 8192


def main() -> int:
    checked = 0
    fails = []

    if not BUILDER.is_file():
        print(f"FAIL — 빌더가 없다: {BUILDER}")
        return 1

    proc = subprocess.run([sys.executable, str(BUILDER)],
                          capture_output=True, text=True, cwd=ROOT)
    if proc.returncode != 0:
        print(f"FAIL — 빌더가 실패했다 (exit {proc.returncode})")
        print((proc.stdout + proc.stderr).strip())
        return 1

    root = SITE / "index.html"
    if not root.is_file():
        print(f"FAIL — 발행된 루트가 없다: {root}")
        return 1
    html = root.read_text(encoding="utf-8")
    doc = RootDoc()
    doc.feed(html)
    script = "".join(doc.script)
    checked += 1

    # 1. 리다이렉트 목적지가 **실행되는 자리**에 있다. 스크립트 본문이든 meta
    #    refresh 의 content 든 canonical href 든, 브라우저가 실제로 쓰는 곳이어야
    #    한다. 주석은 위 파서가 버렸으므로 여기 안 들어온다.
    live_in = [w for w, hay in (("script", script),
                                ("meta refresh", " ".join(doc.refresh)),
                                ("canonical", " ".join(doc.canonical)))
               if LIVE_HOST in hay]
    if not live_in:
        fails.append(
            f"{LIVE_HOST} 가 실행되는 자리에 없다 — 스크립트·meta refresh·canonical "
            f"어디에도 없다 (주석에만 있는 것은 리다이렉트가 아니다)")
    checked += 1

    # 2. history 를 남기지 않는 replace 로 넘긴다. 인쇄된 QR 로 온 사람이 뒤로가기를
    #    눌렀을 때 이 stub 으로 다시 떨어지지 않아야 한다. 스크립트 본문에서만 본다.
    if "location.replace" not in script:
        fails.append("스크립트에 location.replace 가 없다 — 뒤로가기가 stub 으로 되돌아온다")
    checked += 1

    # 3. no-JS 대비. 태그로 확인한다.
    if not doc.refresh:
        fails.append("meta http-equiv=refresh 태그가 없다 — JS 없는 환경에서 아무 데도 안 간다")
    elif not any(LIVE_HOST in c for c in doc.refresh):
        fails.append(f"meta refresh 가 있는데 {LIVE_HOST} 를 안 가리킨다")
    checked += 1

    # 4. **핵심.** 루트가 폐기된 기업 데모가 아니다. 지문은 상수 블록이므로
    #    스크립트 본문에서 찾는다 — 주석에 적힌 같은 문자열은 데모가 아니다.
    leaked = [f for f in DEMO_FINGERPRINTS if f in script]
    if leaked:
        fails.append(
            f"발행된 루트가 폐기된 기업 데모다 — 스크립트에 지문 {leaked} 가 있다. "
            f"index.html 이 리다이렉트 대신 루트로 발행됐다는 뜻이고, "
            f"인쇄된 부스 QR 이 그 화면을 다시 서빙한다")
    checked += 1

    # 5. 리다이렉트 stub 은 작다. 대시보드는 안 작다. 지문 이름을 바꿔 4번을
    #    피하더라도 크기는 못 숨긴다 — 상수 이름을 고쳐도 화면 코드는 그대로다.
    if len(html) > MAX_ROOT_BYTES:
        fails.append(
            f"발행된 루트가 {len(html):,} 바이트다 — 리다이렉트 stub 이 "
            f"{MAX_ROOT_BYTES:,} 를 넘을 이유가 없다. 앱이 루트로 발행됐을 수 있다")
    checked += 1

    # 5. 원본 리다이렉트 파일이 자기 이름으로도 발행되지 않는다. 발행 이름은
    #    index.html 하나여야 하고, 둘 다 나가면 어느 쪽이 정본인지 모른다.
    if (SITE / "pages-root-redirect.html").exists():
        fails.append("pages-root-redirect.html 이 자기 이름으로도 발행됐다")
    checked += 1

    # 6. 대시보드는 여전히 나가야 한다 — 루트가 아닌 곳에서. 이 검사가 리다이렉트만
    #    보면 "둘 다 안 나간다" 도 통과시킨다.
    if not (SITE / "app.html").is_file():
        fails.append("app.html 이 발행되지 않았다")
    checked += 1

    if not checked:
        print("FAIL — 아무것도 검사하지 않았다")
        return 1
    if fails:
        print(f"FAIL — 검사 {checked}건 중 {len(fails)}건 실패")
        for f in fails:
            print(f"  ✗ {f}")
        return 1

    published = sorted(p.relative_to(SITE).as_posix()
                       for p in SITE.rglob("*") if p.is_file())
    print(f"PASS — 검사 {checked}건. Pages 루트는 {LIVE_HOST} 리다이렉트이고 "
          f"기업 데모가 아니다")
    print(f"       발행: {', '.join(published)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
