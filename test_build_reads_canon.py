#!/usr/bin/env python3
"""정본을 변조하고 같은 빌더를 돌려, 새 값이 **화면에 그려지고** 옛 값이 없는지 본다.

이슈 #36 의 둘째 판정 기준이고 정본 `decided.REBUILD-FRAMEWORK` 가 지정한 경계다.
헌 `test_single_source` 는 `index.html` 의 리터럴을 고치고 Chrome 을 띄웠다. 이 검사는
**정본**을 고치고 빌더를 돌린 뒤 산출물을 HTTP 로 열어 DOM 을 본다.

첫 판은 렌더하지 않았다. 산출물이 값을 담고 있는지만 보고 "정본에서 산출물까지가 검사
대상이고 그 구간에 렌더링이 없다" 고 적었다. **그 논거는 경계를 잘못 그었다** — 판정
기준은 정본에서 **화면**까지이고, `CANON.min_cel` 같은 오타면 canon.json 에는 값이 있고
DOM 에는 없다. 그 공백을 첫 판 docstring 이 스스로 인정하고 있었으므로 없앤다.

렌더가 필요한 이유가 하나 더 있다. 화면이 `canon.json` 을 `fetch` 로 읽으므로 정적 파일을
읽는 것만으로는 값이 화면에 도달했는지 알 수 없다. `file://` 에서는 fetch 가 CORS 로
막히므로 HTTP 로 띄운다.

빈 렌더를 통과로 읽지 않는다. 기대는 "새 값이 있다" 와 "옛 값이 없다" 인데 **빈 문서는
후자를 만족시킨다** — `test_single_source` 가 `CHROME=/bin/false` 로 전부 통과한 적이
있고 (2026-08-15) 같은 함정이다. 그래서 카드가 그려졌는지를 먼저 단언한다.
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

ROOT = Path(__file__).resolve().parent
BUILDER = ROOT / "scripts/build_screens.py"
CANON = ROOT / "contracts/proposal-package-v11.yml"


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

# (canon.json 키, 라벨, 정본 정규식, 치환, canon.json 기대값 또는 None, DOM 옛, DOM 새)
#
# 정본 행은 끝에 주석을 달고 있어 `$` 앵커가 안 맞는다. 키와 값만 잡는다.
# 그리고 여러 값이 같은 키 이름을 쓴다 — `eligibility_thru` 는 값(따옴표 문자열)과
# 문서 라벨(한글 산문) 두 곳에 있고, `value:` 는 activated 와 repeat 양쪽에 있다.
# 그래서 값의 **형태**까지 정규식에 넣는다.
#
# 아래가 canon.json 의 키 전부를 덮어야 한다. 덮지 않으면 main() 이 실패한다 —
# 계약에 있으면서 아무도 화면 도달을 확인하지 않는 값이 생기는 것을 막는다.
CASES = [
    ("min_cell", "min_cell",
     r"^(\s*min_cell:\s+)20\b", r"\g<1>37", "37", "20", "37"),
    ("dep_ratio", "dep_ratio",
     r"^(\s*dep_ratio:\s+)2\.2\b", r"\g<1>4.9", "4.9", "22,000", "49,000"),
    ("activated", "activated",
     r"^(\s*value:\s+)0\.38\b", r"\g<1>0.77", "0.77", "38%", "77%"),
    ("repeat", "repeat",
     r"^(\s*value:\s+)0\.61\b", r"\g<1>0.29", "0.29", "61%", "29%"),
    ("repeat_denominator", "repeat_denominator",
     r"^(\s*denominator:\s+)같은 12개월에 유효 촬영이 1회 이상인 사람",
     r"\g<1>변조된 분모 문구", "변조된 분모 문구",
     "같은 12개월에 유효 촬영이 1회 이상인 사람", "변조된 분모 문구"),
    ("eligibility_thru", "eligibility_thru",
     r'^(\s*eligibility_thru:\s+)"2026-07"', r'\g<1>"2019-03"', "2019-03",
     "2026-07", "2019-03"),
    ("claims_thru", "claims_thru",
     r'^(\s*claims_thru:\s+)"2026-05"', r'\g<1>"2018-11"', "2018-11",
     "2026-05", "2018-11"),
    ("lag_days", "lag_days",
     r"^(\s*lag_days:\s+)60\b", r"\g<1>97", "97", "lag 60d", "lag 97d"),
    ("completeness_pct", "completeness_pct",
     r"^(\s*completeness_pct:\s+)98\.4\b", r"\g<1>71.6", "71.6",
     "98.4%", "71.6%"),
    # scenarios 는 리스트라 canon.json 최상위 값 비교를 건너뛰고(None) DOM 으로만 본다.
    # 화면이 첫 시나리오만 쓰므로 A 의 두 값을 각각 덮는다.
    ("scenarios", "scenarios[A].employees",
     r"^(\s*- \{key: A, employees: )10000", r"\g<1>44444", None,
     "10,000", "44,444"),
    ("scenarios", "scenarios[A].pmpm",
     r"^(\s*- \{key: A, employees: \d+, pmpm: )31\.4\b", r"\g<1>77.7", None,
     "$31.40", "$77.70"),
]


def serve(directory):
    """산출물을 HTTP 로 띄운다. fetch 는 file:// 에서 CORS 로 막힌다."""
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(directory), **kw)

        def log_message(self, *a):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def visible(dom):
    """`<script>`·`<style>` 본문을 걷어낸다.

    `--dump-dom` 은 스크립트 **소스**까지 준다. 그래서 `class="card"` 가 화면에
    카드가 하나도 없어도 JS 문자열 리터럴로 만족됐다 — 실측하면 원본 DOM 에 7개,
    스크립트를 걷어내면 5개다. 어제 "카드를 그리지 않음" 시험에서 카드 단언이 안
    터지고 값 검사만 걸린 것이 그 증거이고, docstring 은 "카드를 먼저 단언한다" 고
    쓰고 있었다. 공허한 단언이었다.
    """
    return re.sub(r"(?is)<(script|style)\b[^>]*>.*?</\1\s*>", "", dom)


def dump_dom(url):
    out = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--dump-dom",
         "--virtual-time-budget=3000", url],
        capture_output=True, text=True, timeout=90)
    if out.returncode != 0:
        return None, f"chrome exited {out.returncode}: {out.stderr.strip()[:200]}"
    if "</html>" not in out.stdout:
        return None, "chrome returned no document — nothing was rendered"
    return out.stdout, None


def build(canon_path, out_dir):
    return subprocess.run(
        [sys.executable, str(BUILDER), "--canon", str(canon_path),
         "--out", str(out_dir), "--quiet"],
        capture_output=True, text=True, cwd=ROOT)


def main():
    for path, label in ((BUILDER, "빌더"), (CANON, "정본")):
        if not path.is_file():
            print(f"FAIL — {label} 없음: {path}")
            return 1

    original = CANON.read_text(encoding="utf-8")
    checked, fails = 0, []

    with tempfile.TemporaryDirectory(prefix="build-canon-") as tmp:
        tmp = Path(tmp)

        if build(CANON, tmp / "base").returncode != 0:
            print("FAIL — 변조 없이도 빌드가 실패한다")
            return 1

        # 계약에 있으면서 아무 케이스도 덮지 않는 키가 있으면, 그 값은 정본이 바뀌어도
        # 화면 도달을 확인하는 사람이 없다. 그게 이 검사의 가장 큰 공백이 될 수 있으므로
        # 먼저 본다 — 빌더가 스테이징을 늘리면 여기서 걸린다.
        staged = set(json.loads(
            (tmp / "base/canon.json").read_text(encoding="utf-8")))
        covered = {c[0] for c in CASES}
        if staged - covered:
            print(f"FAIL — canon.json 이 스테이징하는데 변조 케이스가 없는 키: "
                  f"{sorted(staged - covered)}. 정본이 바뀌어도 화면 도달을 "
                  f"확인하는 사람이 없다 — CASES 에 넣거나 스테이징에서 빼라")
            return 1
        if covered - staged:
            print(f"FAIL — CASES 가 덮는데 canon.json 에 없는 키: "
                  f"{sorted(covered - staged)}. 검사가 낡았다")
            return 1
        checked += 1

        httpd, port = serve(tmp)
        try:
            dom, err = dump_dom(f"http://127.0.0.1:{port}/base/employer.html")
            if err:
                print(f"FAIL — 기준선 렌더 실패: {err}")
                return 1
            if 'class="card"' not in visible(dom):
                print("FAIL — 기준선 DOM 에 카드가 없다. fetch 가 실패했거나 화면이 "
                      "아무것도 그리지 않았다 — '위반 없음' 이 아니다")
                return 1
            checked += 1

            for key, name, pattern, repl, new, dom_old, dom_new in CASES:
                mutated, n = re.subn(pattern, repl, original, count=1, flags=re.M)
                if n != 1:
                    fails.append(f"{name}: 정본에서 변조 지점을 못 찾았다 — "
                                 f"정본 구조가 바뀌었고 이 검사가 낡았다")
                    continue

                slug = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-")
                mcanon = tmp / f"canon-{slug}.yml"
                mcanon.write_text(mutated, encoding="utf-8")
                r = build(mcanon, tmp / slug)
                if r.returncode != 0:
                    fails.append(f"{name}: 변조한 정본으로 빌드가 실패했다: "
                                 f"{(r.stdout + r.stderr).strip()[:150]}")
                    continue

                # 1. 빌더가 정본을 읽는가 — canon.json 이 새 값을 받았는지.
                #    리스트·중첩 값은 최상위 비교를 건너뛴다 (new=None).
                if new is not None:
                    blob = json.loads(
                        (tmp / slug / "canon.json").read_text(encoding="utf-8"))
                    got = blob.get(key)
                    if str(got) != new:
                        fails.append(f"{name}: 정본을 {new} 로 고쳤는데 canon.json 이 "
                                     f"{got!r} 이다. 빌드가 정본을 안 읽는다")
                    checked += 1

                raw, err = dump_dom(f"http://127.0.0.1:{port}/{slug}/employer.html")
                if err:
                    fails.append(f"{name}: 렌더 실패 — {err}")
                    continue
                dom = visible(raw)

                # 2. 화면이 그렸는가. 빈 DOM 은 아래 "옛 값 없음" 을 공짜로 만족시킨다.
                if 'class="card"' not in dom:
                    fails.append(f"{name}: DOM 에 카드가 없다 — fetch 실패이거나 "
                                 f"화면이 canon.json 을 못 읽었다")
                    continue
                checked += 1

                # 3. 새 값이 DOM 까지 갔는가
                if dom_new not in dom:
                    fails.append(f"{name}: 정본을 고쳤는데 화면에 {dom_new!r} 가 "
                                 f"안 나온다. 값이 canon.json 까지만 갔다")
                checked += 1

                # 4. 옛 값이 화면에 남지 않았는가. 앞뒤에 문자·숫자·점이 붙으면 그 값이
                #    아니다 — CSS 의 20px, 2026-07 의 20, 31.40 의 일부를 거른다.
                #    오탐이 미탐보다 위험하다: 언제나 실패하는 검사는 곧 꺼진다.
                if re.search(rf"(?<![\w.]){re.escape(dom_old)}(?![\w.])", dom):
                    fails.append(f"{name}: 정본을 고쳤는데 화면에 옛 값 {dom_old!r} 가 "
                                 f"남아 있다 — 템플릿이나 라벨이 손으로 적힌 값을 품고 있다")
                checked += 1
        finally:
            httpd.shutdown()
            httpd.server_close()

    if not checked:
        print("FAIL — 아무것도 검사하지 않았다")
        return 1
    if fails:
        print(f"FAIL — 검사 {checked}건 중 {len(fails)}건 실패")
        for f in fails:
            print(f"  ✗ {f}")
        return 1
    print(f"PASS — 검사 {checked}건. 정본 값 {len(CASES)}개(계약 키 {len(covered)}개 전부)를 "
          f"변조했을 때 canon.json 과 렌더된 DOM 이 함께 따라 움직이고 옛 값이 남지 않는다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
