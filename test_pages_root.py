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
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILDER = ROOT / "scripts/build_pages_site.py"
SITE = ROOT / "_site"

# 라이브 사이트. 리다이렉트가 여기를 가리켜야 한다.
LIVE_HOST = "grin-mauve.vercel.app"

# 폐기된 기업 데모의 지문. index.html 이 루트로 발행되면 이것들이 따라온다.
# 상수 블록이라 데모가 살아 있는 한 사라지지 않고, 사라졌다면 그건 데모가
# 아니므로 어느 쪽이든 이 검사가 맞다.
DEMO_FINGERPRINTS = ("const MIN_CELL", "const DEP_RATIO", "const FRAC")


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
    checked += 1

    # 1. 루트가 라이브 사이트로 보낸다.
    if LIVE_HOST not in html:
        fails.append(f"발행된 루트가 {LIVE_HOST} 를 안 가리킨다")
    checked += 1

    # 2. JS 로 즉시 넘긴다. 인쇄된 QR 로 온 사람이 뒤로가기를 눌렀을 때 이 stub
    #    으로 다시 떨어지지 않아야 하므로 history 를 남기지 않는 replace 여야 한다.
    if "location.replace" not in html:
        fails.append("루트에 location.replace 가 없다 — 뒤로가기가 stub 으로 되돌아온다")
    checked += 1

    # 3. no-JS 대비가 있다.
    if "http-equiv" not in html.lower() or "refresh" not in html.lower():
        fails.append("루트에 meta refresh 대비가 없다 — JS 없는 환경에서 아무 데도 안 간다")
    checked += 1

    # 4. **핵심.** 루트가 폐기된 기업 데모가 아니다.
    leaked = [f for f in DEMO_FINGERPRINTS if f in html]
    if leaked:
        fails.append(
            f"발행된 루트가 폐기된 기업 데모다 — 지문 {leaked} 가 있다. "
            f"index.html 이 리다이렉트 대신 루트로 발행됐다는 뜻이고, "
            f"인쇄된 부스 QR 이 그 화면을 다시 서빙한다")
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
