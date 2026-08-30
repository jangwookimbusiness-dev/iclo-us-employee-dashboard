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
from urllib.parse import quote

import yaml

ROOT = Path(__file__).resolve().parent
BUILDER = ROOT / "scripts/build_screens.py"
CANON = ROOT / "contracts/proposal-package-v11.yml"
TEMPLATE = ROOT / "screens/employer.html.in"

# 화면이 그리는 행 수. 손으로 3·5 라 적으면 정본에 밴드를 더하거나 빌더에 단계를
# 더할 때 이 검사가 조용히 틀린 기대를 갖는다. 밴드는 정본이 정하고 **단계 수는
# 빌더의 FUNNEL_STAGES 가 정한다** — 정본 `kpis` 는 지표 목록이고 그중 다섯만 퍼널이다.
CANON_SIGNALS = yaml.safe_load(
    CANON.read_text(encoding="utf-8"))["dashboard"]["signals"]
sys.path.insert(0, str(ROOT / "scripts"))
CANON_FUNNEL = __import__("build_screens").FUNNEL_STAGES


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
    # tabs 는 리스트라 최상위 비교를 건너뛴다. 선택된 탭의 제목과 버튼 라벨을 각각 덮는다.
    ("tabs", "tabs[overview].heading",
     r"^(\s*heading: )Program overview$", r"\g<1>변조된 개요 제목", None,
     "Program overview", "변조된 개요 제목"),
    ("tabs", "tabs[signals].label",
     r"^(\s*label: )Signals$", r"\g<1>변조된 탭 라벨", None,
     "Signals", "변조된 탭 라벨"),
    # signals 의 점유율은 합이 100 이어야 빌드가 통과하므로 **키**를 덮는다. 점유율은
    # 한 줄만 고치면 합이 깨져 빌더가 거부하고, 그 거부 자체는 아래 고장 재현에서 본다.
    ("signals", "signals[].key",
     r"^(\s*- \{key: )Low(,\s+share: 52\})", r"\g<1>Lowest\g<2>", None,
     "Low", "Lowest"),
    ("signal_unit", "signal_unit",
     r"^(\s*unit: )촬영이 아니라 \*\*사람\*\*\. 사람당 그 창의 최신 유효 촬영 1건만 센다",
     r"\g<1>변조된 단위 진술", "변조된 단위 진술",
     "사람당 그 창의 최신 유효 촬영 1건만 센다", "변조된 단위 진술"),
    # `window: 롤링 12개월` 이 정본에 둘 있다 (repeat_participation·signal_distribution).
    # 화면은 뒤엣것만 읽으므로 앞엣것을 고치면 DOM 이 안 바뀌고 이 검사가 거짓 실패한다.
    # 그래서 앞줄 `unit:` 에 앵커를 걸어 뒤엣것을 특정한다.
    ("signal_window", "signal_window",
     r"(?s)(unit: 촬영이 아니라.*?\n\s*window: )롤링 12개월",
     r"\g<1>변조된 창", "변조된 창", "롤링 12개월", "변조된 창"),
    ("funnel", "funnel[valid].frac",
     r"^(\s*value:\s+)0\.28\b", r"\g<1>0.31", None, "28%", "31%"),
    ("funnel_nesting", "funnel_nesting",
     r"^(\s*funnel_nesting: \|\n\s*)Activated → Valid capture",
     r"\g<1>변조된 포개짐 규칙 Activated → Valid capture",
     None, None, "변조된 포개짐 규칙"),
    ("completed_provisional_label", "completed_provisional_label",
     r"^(\s*provisional_label: )잠정 — 청구지연 P90 실측 전",
     r"\g<1>변조된 잠정 문구", "변조된 잠정 문구",
     "잠정 — 청구지연 P90 실측 전", "변조된 잠정 문구"),
    # 깃발을 내리면 화면에서 문구가 **사라진다.** 새로 나타나는 문자열이 없으므로
    # dom_new 를 None 으로 두고 부재만 단언한다 — 없어지는 것이 관측 가능한 효과다.
    ("completed_provisional", "completed_provisional",
     r"^(\s*provisional: )true$", r"\g<1>false", "False",
     "잠정 — 청구지연 P90 실측 전", None),
    # scenarios 와 cards 는 리스트라 canon.json 최상위 값 비교를 건너뛰고(None)
    # DOM 으로만 본다. 화면이 첫 시나리오만 쓰므로 A 의 두 값을 각각 덮는다.
    ("scenarios", "scenarios[A].employees",
     r"^(\s*- \{key: A, employees: )10000", r"\g<1>44444", None,
     "10,000", "44,444"),
    ("scenarios", "scenarios[A].pmpm",
     r"^(\s*- \{key: A, employees: \d+, pmpm: )31\.4\b", r"\g<1>77.7", None,
     "$31.40", "$77.70"),
    # departments 는 리스트라 최상위 비교를 건너뛴다. 부서 하나의 이름을 바꾸면
    # 버튼과 (그 부서를 고른 화면의) 분모가 함께 따라와야 한다.
    ("departments", "departments[].tiny.name",
     r"^(\s*name: )Facilities \(pilot site\)$", r"\g<1>변조된 부서명", None,
     "Facilities (pilot site)", "변조된 부서명"),
    ("dept_caveat", "dept_caveat",
     r"^(\s*caveat: )부서를 고르면 분모가 바뀝니다\.",
     r"\g<1>변조된 부서 단서.", None,
     "부서를 고르면 분모가 바뀝니다.", "변조된 부서 단서"),
    ("cards", "cards[].label",
     r"^(\s*- label: )Dental PMPM \(allowed\)$", r"\g<1>변조된 카드 라벨", None,
     "Dental PMPM (allowed)", "변조된 카드 라벨"),
]

# 임직원 화면(#48). 별 계약 파일 `member-canon.json` 과 별 화면 `member.html` 이므로
# 루프도 따로다 — 같은 루프에 넣으면 어느 화면의 어느 파일을 봐야 하는지가 케이스마다
# 달라지고, 그 분기가 검사의 가장 조용한 고장 자리가 된다.
#
# (member-canon.json 키, 라벨, 정본 정규식, 치환, 기대값 또는 None, DOM 옛, DOM 새)
MEMBER_CASES = [
    # 밴드 경계. `min: 80` 을 70 으로 낮추면 78점인 사람이 Moderate 에서 Low 로 간다.
    # **이 하나가 사람에게 어느 밴드라고 말할지를 바꾼다** — 그래서 정본으로 올렸다.
    #
    # 70 인 이유: 첫 판은 20 을 넣었고 빌더가 거부했다. [20, 68] 은 내림차순이 아니고,
    # 그러면 첫 밴드가 전부를 받는다. 불변식이 변조 범위를 좁힌 것이며, 넓히려고
    # 불변식을 풀면 검사가 지키려는 것을 검사가 없앤다. 68 < 70 ≤ 78 로 고른다.
    ("bands", "bands[Low].min",
     r"^(\s*min: )80$", r"\g<1>70", None, "Moderate", "Low"),
    ("bands", "bands[].advice",
     r"^(\s*advice: )A guided check-in is worth booking when convenient\.$",
     r"\g<1>변조된 조언 문장", None,
     "A guided check-in is worth booking when convenient.", "변조된 조언 문장"),
    # 방향 문턱. 71→78 은 +7 이므로 step 3 에서는 "나아졌다" 다. step 을 40 으로
    # 올리면 같은 차이가 "비슷하다" 가 된다.
    ("direction", "direction.step",
     r"^(\s*step: )3$", r"\g<1>40", None,
     "Better than your last check-in", "About the same as your last check-in"),
    ("direction", "direction.better",
     r"^(\s*better: )Better than your last check-in$",
     r"\g<1>변조된 방향 문구", None,
     "Better than your last check-in", "변조된 방향 문구"),
    # 치환이 첫 문장을 **먹는다.** 첫 판의 기대값에 먹힌 문장을 그대로 두었고 그래서
    # 실패했다 — 검사가 틀린 것이고, 그 실패가 정확히 그것을 말했다.
    ("disclaimer", "disclaimer",
     r"(?s)^(\s*disclaimer: \|\n\s*)A wellness signal from a guided photo\.",
     r"\g<1>변조된 면책 문구.",
     "변조된 면책 문구. Not a clinical finding and not medical advice. "
     "Only a dentist can say what is happening in a mouth.",
     "A wellness signal from a guided photo.", "변조된 면책 문구"),
    ("demo_scope", "demo_scope",
     r"^(\s*demo_scope: )In this demo the photo stays on this page and is not uploaded\.$",
     r"\g<1>변조된 데모 한정 문구",
     "변조된 데모 한정 문구",
     "In this demo the photo stays on this page and is not uploaded.",
     "변조된 데모 한정 문구"),
]

# 빌드 시점에 템플릿으로 치환되는 값. `canon.json` 에 없으므로 위 CASES 와 단언이
# 다르다 — **렌더된 DOM 이 아니라 빌드된 산출물 텍스트를 본다.**
#
# 왜 DOM 이 아닌가. 색은 `<style>` 안에 있고 `visible()` 이 `<style>` 을 걷어낸다.
# 걷어내는 이유가 있었다: `--dump-dom` 이 스크립트 소스를 주므로 JS 문자열이 존재
# 단언을 공짜로 만족시킨다. `<style>` 을 남기면 같은 함정이 CSS 로 돌아온다.
#
# 그러면 계산된 스타일을 봐야 하지만 `--dump-dom` 은 그것을 주지 않고, 받으려면
# CDP 를 붙여야 한다. **여기서 멈추는 이유는 이것이 약한 검사가 아니라 옮긴 검사라는
# 것이다** — `check_dashboard` 가 `index.html` 에 걸고 있던 coral 규칙도 정확히 같은
# 것을 봤다: 스타일시트가 선언한 값. 계산된 색까지 보는 것은 그 검사도 못 했다.
#
# title 은 예외로 DOM 에도 나온다 (헤더의 `.logo`). 아래 루프가 산출물에서 보는 것으로
# 충분하고, 별도로 DOM 을 다시 열지 않는다 — 같은 문자열이다.
#
# (이름, 정본 정규식, 치환, 산출물 옛, 산출물 새)
# 옛 값의 **개수가 줄었는지**를 본다, 없어졌는지가 아니다. 색 값이 정본에 둘씩 있다 —
# `colors.coral` 과 `colors.bars.light.Priority` 가 둘 다 #C2333A 고, 다크도 같다.
# 한쪽만 변조하면 다른 쪽이 남으므로 "옛 값이 사라졌다" 는 거짓 실패가 된다. 개수
# 비교는 그 경우를 정확히 다루고, 템플릿이 색을 손으로 품고 있으면 개수가 안 줄어서
# 걸린다 — 잡으려던 고장은 그것이다.
STYLE_CASES = [
    ("title", r"^(\s*title: )ICLO HomeDen Employer Analytics$",
     r"\g<1>변조된 제품 제목", "ICLO HomeDen Employer Analytics", "변조된 제품 제목"),
    ("coral", r'^(\s*coral: )"#C2333A"', r'\g<1>"#0B0B0B"', "#C2333A", "#0B0B0B"),
    ("coral_dark", r'^(\s*coral_dark_mode: )"#FF8E8D"', r'\g<1>"#0C0C0C"',
     "#FF8E8D", "#0C0C0C"),
    ("navy", r'^(\s*navy: )"#1B2A4A"', r'\g<1>"#0D0D0D"', "#1B2A4A", "#0D0D0D"),
    ("teal", r'^(\s*teal: )"#007A87"', r'\g<1>"#0E0E0E"', "#007A87", "#0E0E0E"),
    ("background", r'^(\s*background: )"#FFFFFF"', r'\g<1>"#0F0F0F"',
     "#FFFFFF", "#0F0F0F"),
    ("bar_track", r'^(\s*light: )"#F7F8FA"', r'\g<1>"#1A1A1A"', "#F7F8FA", "#1A1A1A"),
    ("bar_track_dark", r'^(\s*dark: )"#0F1930"', r'\g<1>"#1B1B1B"',
     "#0F1930", "#1B1B1B"),
    ("bar_low", r'^(\s*light: \{Low: )"#7E90AE"', r'\g<1>"#1C1C1C"',
     "#7E90AE", "#1C1C1C"),
    ("bar_moderate", r'(\{Low: "#7E90AE", Moderate: )"#4E8F98"', r'\g<1>"#1D1D1D"',
     "#4E8F98", "#1D1D1D"),
    ("bar_priority", r'(Moderate: "#4E8F98", Priority: )"#C2333A"', r'\g<1>"#1E1E1E"',
     "#C2333A", "#1E1E1E"),
    ("bar_low_dark", r'^(\s*dark:  \{Low: )"#5B7099"', r'\g<1>"#1F1F1F"',
     "#5B7099", "#1F1F1F"),
    ("bar_moderate_dark", r'(\{Low: "#5B7099", Moderate: )"#4FA0A9"',
     r'\g<1>"#2A2A2A"', "#4FA0A9", "#2A2A2A"),
    ("bar_priority_dark", r'(Moderate: "#4FA0A9", Priority: )"#FF8E8D"',
     r'\g<1>"#2B2B2B"', "#FF8E8D", "#2B2B2B"),
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
    """`<script>`·`<style>`·HTML 주석을 걷어낸다.

    `--dump-dom` 은 스크립트 **소스**까지 준다. 그래서 `class="card"` 가 화면에
    카드가 하나도 없어도 JS 문자열 리터럴로 만족됐다 — 실측하면 원본 DOM 에 7개,
    스크립트를 걷어내면 5개다. 어제 "카드를 그리지 않음" 시험에서 카드 단언이 안
    터지고 값 검사만 걸린 것이 그 증거이고, docstring 은 "카드를 먼저 단언한다" 고
    쓰고 있었다. 공허한 단언이었다.

    주석도 같은 이유로 걷어낸다. 템플릿 상단에 왜 이렇게 만들었는지를 적은 긴 주석이
    있고 그것이 산출물에 그대로 실린다. 존재 단언 쪽에서는 그 주석이 화면 대신 조건을
    만족시킬 수 있고 — 합성 고지가 화면에서 사라져도 주석에 그 문구가 있으면 통과한다 —
    부재 단언 쪽에서는 설계 이유를 설명하는 문장이 금지어로 걸린다. **화면에 없는
    글자를 화면에 있다고 읽는 것이 이 검사가 세 번째로 밟는 함정이다.**
    """
    return re.sub(r"(?s)<!--.*?-->", "",
                  re.sub(r"(?is)<(script|style)\b[^>]*>.*?</\1\s*>", "", dom))


def squash(s):
    """구두점을 접는다. 가운뎃점 하나로 피해갈 수 있으면 검사가 아니라 권고다.

    `check_dashboard` 가 `index.html`·`app.html` 에 쓰는 것과 같은 규칙이다.
    """
    return re.sub(r"[\s·\-–—/|,]+", "", s)


def prose_guards(dom):
    """렌더된 화면에 금지어·금지 용어·범위 없는 절대 표현이 없는지 본다.

    **`check_dashboard` 가 헌 화면에만 걸고 있던 것을 빌드 경계로 옮긴 것이다.**
    옛 검사는 `index.html` 과 `app.html` 을 열었고 재구축 화면은 아무도 안 봤다.
    라벨이 정본에서 오게 된 지금은 더 그렇다 — 화면에 뜨는 문자열이 템플릿에
    없으므로 파일을 읽는 검사로는 잡을 수가 없고, 렌더를 봐야 잡힌다.

    규칙은 정본에서 읽는다. 여기 옮겨 적으면 금지어 목록이 두 곳에 사는 값이 된다.
    """
    doc = yaml.safe_load(CANON.read_text(encoding="utf-8"))
    bad = []

    for w in doc["terminology"]["disease_words_banned"]:
        if re.search(rf"\b{w}\w*", dom, re.I):
            bad.append(f"렌더된 화면에 금지어 {w!r}")

    flat = squash(dom)
    for item in doc["terminology"]["forbidden"]:
        if squash(item["wrong"]) in flat:
            bad.append(f"렌더된 화면에 금지 용어 {item['wrong']!r} "
                       f"→ {item['right']!r}")

    for item in doc["scoped_claims"]:
        wrong, right = item["wrong"], item["right"]
        for m in re.finditer(re.escape(wrong), dom):
            if not dom[m.start():m.start() + len(right)] == right:
                bad.append(f"렌더된 화면의 {wrong!r} 는 {right!r} 로 범위를 좁혀야 함")

    # 합성 데이터 고지. 이 화면의 숫자는 전부 합성이고, 고지가 빠진 캡처가
    # 제안서로 나간 적이 있다.
    if "Synthetic data" not in dom:
        bad.append("렌더된 화면에 'Synthetic data' 고지가 없다")

    return bad


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
    for path, label in ((BUILDER, "빌더"), (CANON, "정본"),
                        (TEMPLATE, "템플릿")):
        if not path.is_file():
            print(f"FAIL — {label} 없음: {path}")
            return 1

    original = CANON.read_text(encoding="utf-8")
    tabs = yaml.safe_load(original)["dashboard"]["tabs"]
    checked, fails = 0, []

    with tempfile.TemporaryDirectory(prefix="build-canon-") as tmp:
        tmp = Path(tmp)

        base = build(CANON, tmp / "base")
        if base.returncode != 0:
            # 빌더가 말한 이유를 그대로 넘긴다. 안 넘겼을 때 "변조 없이도 빌드가
            # 실패한다" 만 남아서, 치환 자리를 하나 늘렸을 뿐인 사람이 정본을
            # 의심하게 됐다.
            print(f"FAIL — 변조 없이도 빌드가 실패한다: "
                  f"{(base.stdout + base.stderr).strip()[:300]}")
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

        # 치환 자리도 같은 규칙을 받는다. 권위는 템플릿이다 — 빌더는 남은 자리를
        # 거부하므로 템플릿의 `{{...}}` 집합이 곧 치환되는 값의 전부다. 케이스가
        # 없는 자리가 있으면 정본에서 색을 바꿔도 산출물 도달을 아무도 안 본다.
        holes = set(re.findall(r"\{\{(\w+)\}\}",
                              TEMPLATE.read_text(encoding="utf-8")))
        styled = {s[0] for s in STYLE_CASES}
        if holes != styled:
            print(f"FAIL — 템플릿 치환 자리와 STYLE_CASES 가 어긋난다. "
                  f"케이스 없는 자리: {sorted(holes - styled)}, "
                  f"자리 없는 케이스: {sorted(styled - holes)}")
            return 1
        checked += 1

        base_html = (tmp / "base/employer.html").read_text(encoding="utf-8")

        httpd, port = serve(tmp)
        try:
            dom, err = dump_dom(f"http://127.0.0.1:{port}/base/employer.html")
            if err:
                print(f"FAIL — 기준선 렌더 실패: {err}")
                return 1
            base_dom = visible(dom)
            if 'class="card"' not in base_dom:
                print("FAIL — 기준선 DOM 에 카드가 없다. fetch 가 실패했거나 화면이 "
                      "아무것도 그리지 않았다 — '위반 없음' 이 아니다")
                return 1
            checked += 1

            # 산문 규칙은 기준선 렌더에만 건다. 변조본은 정본을 일부러 망가뜨린
            # 것이므로 거기서 나오는 문구는 판정 대상이 아니다.
            for msg in prose_guards(base_dom):
                fails.append(msg)
            checked += 1

            # **임직원 화면도 같은 규칙을 받는다** (2026-08-27, #49). 이 화면의
            # 문구는 대부분 정본에서 런타임에 온다 — 면책 문장, 조언 셋, 방향 문구,
            # 데모 한정 문구, 밴드 이름. 템플릿 파일을 읽는 레드라인 스캔은 그것들을
            # 볼 수가 없고, 정본 자체는 아무도 금지어로 스캔하지 않는다. 그 틈이 이
            # 화면에서 더 위험한 이유는 여기 뜨는 문장이 **한 사람에게 자기 입에
            # 대해 하는 말**이라는 것이다.
            member_dom, err = dump_dom(
                f"http://127.0.0.1:{port}/base/member.html")
            if err:
                fails.append(f"임직원 기준선 렌더 실패: {err}")
            else:
                member_visible = visible(member_dom)
                # 빈 렌더가 "위반 없음" 이 되지 않게 밴드를 먼저 단언한다.
                if not re.search(r'<div class="band [A-Za-z]+" id="band">\s*\w',
                                 member_visible):
                    fails.append("임직원 기준선 DOM 에 밴드가 없다 — 산문 검사가 "
                                 "빈 화면을 통과로 읽는다")
                else:
                    for msg in prose_guards(member_visible):
                        fails.append("임직원 화면: " + msg)
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

                # 3. 새 값이 DOM 까지 갔는가. dom_new 가 None 인 경우가 있다 —
                #    깃발을 내리는 변조는 새 문자열을 만들지 않고 문구를 없앤다.
                #    관측 가능한 효과가 부재뿐이면 부재만 단언한다.
                if dom_new is not None:
                    if dom_new not in dom:
                        fails.append(f"{name}: 정본을 고쳤는데 화면에 {dom_new!r} 가 "
                                     f"안 나온다. 값이 canon.json 까지만 갔다")
                    checked += 1

                # 4. 옛 값이 화면에 남지 않았는가. 앞뒤에 문자·숫자·점이 붙으면 그 값이
                #    아니다 — CSS 의 20px, 2026-07 의 20, 31.40 의 일부를 거른다.
                #    오탐이 미탐보다 위험하다: 언제나 실패하는 검사는 곧 꺼진다.
                #    dom_old 가 None 이면 옛 문구가 새 문구의 부분문자열인 경우다
                #    (`funnel_nesting` — 규칙 문장 앞에 말을 붙인다).
                if dom_old is not None:
                    if re.search(rf"(?<![\w.]){re.escape(dom_old)}(?![\w.])", dom):
                        fails.append(f"{name}: 정본을 고쳤는데 화면에 옛 값 "
                                     f"{dom_old!r} 가 남아 있다 — 템플릿이나 라벨이 "
                                     f"손으로 적힌 값을 품고 있다")
                    checked += 1

            # 탭. 값 단언은 위에서 **전체 DOM** 을 본다 — `hidden` 패널도 DOM 에
            # 있으므로 어느 탭에 있든 값이 잡힌다. 그것은 "정본 값이 fetch→렌더 경로를
            # 통과했나" 라는 판정에는 맞지만 "그 값이 보이나" 는 아니다. 그래서 탭은
            # 여기서 따로 본다: `?tab=` 이 그 패널을 드러내고 나머지를 감추는가.
            for tab in tabs:
                raw, err = dump_dom(
                    f"http://127.0.0.1:{port}/base/employer.html?tab={tab['key']}")
                if err:
                    fails.append(f"tab:{tab['key']}: 렌더 실패 — {err}")
                    continue
                for other in ("overview", "signals", "funnel"):
                    m = re.search(rf'<section id="panel-{other}"[^>]*>', raw)
                    if not m:
                        fails.append(f"tab:{tab['key']}: panel-{other} 가 DOM 에 없다")
                        continue
                    is_hidden = "hidden" in m.group(0)
                    if (other == tab["key"]) == is_hidden:
                        fails.append(
                            f"tab:{tab['key']}: panel-{other} 가 "
                            f"{'감춰져' if is_hidden else '드러나'} 있다 — "
                            f"?tab={tab['key']} 이면 그 패널만 드러나야 한다")
                    checked += 1
                if f'<h2 id="heading">{tab["heading"]}</h2>' not in raw:
                    fails.append(f"tab:{tab['key']}: 제목이 {tab['heading']!r} 가 "
                                 f"아니다 — 탭마다 정본 제목을 써야 한다")
                checked += 1
                sel = re.findall(r'data-key="(\w+)" aria-controls="[^"]*" '
                                 r'aria-selected="true"', raw)
                if sel != [tab["key"]]:
                    fails.append(f"tab:{tab['key']}: aria-selected=true 인 탭이 "
                                 f"{sel} 다. 색만으로 고른 탭을 알리면 색을 못 보는 "
                                 f"사람에게 그 정보가 사라진다")
                checked += 1

            # 없는 `?tab=` 은 첫 탭으로 떨어진다. 빈 화면을 내면 안 된다.
            raw, err = dump_dom(
                f"http://127.0.0.1:{port}/base/employer.html?tab=nope")
            if err:
                fails.append(f"tab:fallback: 렌더 실패 — {err}")
            elif 'class="card"' not in visible(raw):
                fails.append("tab:fallback: 모르는 ?tab= 에 빈 화면이 나왔다 — "
                             "첫 탭으로 떨어져야 한다")
            checked += 1

            # 컨트롤 크기. PRD §5.4 는 44px 미만 컨트롤을 금지한다. 계산된 높이는
            # `--dump-dom` 이 안 주므로 **선언**을 본다. 색 검사와 같은 한계이고
            # 같은 이유로 여기서 멈춘다 — 없는 검사보다 낫고, 약한 척하지 않는다.
            if not re.search(r"\.tab\{[^}]*min-height:\s*44px", base_html):
                fails.append("컨트롤 크기: `.tab` 에 min-height:44px 선언이 없다 "
                             "(PRD §5.4 — 44px 미만 컨트롤 금지)")
            checked += 1

            # **최소 셀.** 자격자를 100명으로 낮추면 Priority 밴드가 15명,
            # 완료 조치가 4명이 되어 둘 다 문턱 아래로 내려간다. 화면 아래 문구가
            # 첫 판부터 "그런 셀은 값을 안 보인다" 고 주장하고 있었고 화면에는 셀이
            # 아예 없었다 — 이제 있으므로 주장이 참이어야 한다 (PRD §5.4, n < 20).
            mutated, n = re.subn(r"^(\s*- \{key: A, employees: )10000",
                                 r"\g<1>100", original, count=1, flags=re.M)
            if n != 1:
                fails.append("최소 셀: 시나리오 A 를 못 찾았다 — 검사가 낡았다")
            else:
                mcanon = tmp / "canon-mincell.yml"
                mcanon.write_text(mutated, encoding="utf-8")
                if build(mcanon, tmp / "mincell").returncode != 0:
                    fails.append("최소 셀: 변조한 정본으로 빌드가 실패했다")
                else:
                    for key in ("signals", "funnel"):
                        raw, err = dump_dom(f"http://127.0.0.1:{port}/mincell/"
                                            f"employer.html?tab={key}")
                        if err:
                            fails.append(f"최소 셀 {key}: 렌더 실패 — {err}")
                            continue
                        dom = visible(raw)
                        if "withheld" not in dom:
                            fails.append(
                                f"최소 셀 {key}: 자격자 100명이면 문턱 아래 셀이 "
                                f"생기는데 화면에 'withheld' 가 없다. 아래 문구가 "
                                f"주장하는 것을 화면이 안 한다")
                        checked += 1
                    # **억제한 행에 비율이 남아 있으면 억제가 아니다.** Priority
                    # 15명은 100 × 15% 이고 자격자 100 은 같은 화면에 공표돼 있다 —
                    # 비율과 분모가 있으면 인원은 곱셈 한 번이다. 첫 판이 정확히 그
                    # 상태로 돌았고 (`15% · withheld`), 템플릿 주석은 그러면 안 된다고
                    # 쓰고 있었다. 그래서 억제된 행에서 `%` 를 찾는다.
                    #
                    # 채움 막대도 같이 본다. 정본이 "눈금 없는 막대에 위치를 표시하는
                    # 것은 숫자를 숨긴 숫자" 라고 적는다 — 15% 폭 막대는 지운 숫자와
                    # 같은 정보다.
                    for key, rows_expected in (("signals", len(CANON_SIGNALS)),
                                               ("funnel", len(CANON_FUNNEL))):
                        raw, err = dump_dom(f"http://127.0.0.1:{port}/mincell/"
                                            f"employer.html?tab={key}")
                        if err:
                            fails.append(f"최소 셀 누출 {key}: 렌더 실패 — {err}")
                            continue
                        # **그 패널 안에서만 센다.** 처음에 문서 전체를 셌고, 감춰진
                        # 패널의 억제 행과 스크립트 소스의 `class="fill …"` 문자열
                        # 리터럴이 같이 잡혀 3행·7막대가 나왔다. 실제 화면은 각각
                        # 1행·2행이었다 — 검사가 틀렸고 화면은 맞았다.
                        panel = re.search(
                            rf'<section id="panel-{key}"[^>]*>(.*?)</section>',
                            visible(raw), re.S)
                        if not panel:
                            fails.append(f"최소 셀 누출 {key}: 패널을 못 찾았다")
                            continue
                        body = panel.group(1)

                        rows = re.findall(
                            r'<div class="(?:brow|stage)">(.*?)(?=<div class="'
                            r'(?:track|sbar)")', body, re.S)
                        leaked = [r for r in rows if "withheld" in r and "%" in r]
                        if leaked:
                            fails.append(
                                f"최소 셀 누출 {key}: 억제한 행 {len(leaked)}개에 "
                                f"비율이 남아 있다. 공표된 분모와 곱하면 억제한 "
                                f"인원이 그대로 나온다")
                        checked += 1

                        withheld = body.count("withheld (n &lt; 20)")
                        fills = len(re.findall(r'class="(?:fill|sfill)[ "]', body))
                        if withheld == 0:
                            fails.append(
                                f"최소 셀 누출 {key}: 자격자 100명인데 억제된 행이 "
                                f"없다 — 이 검사가 아무것도 안 보고 있다")
                        elif fills != rows_expected - withheld:
                            fails.append(
                                f"최소 셀 누출 {key}: 억제 {withheld}행인데 채움 "
                                f"막대가 {fills}개다 ({rows_expected - withheld} "
                                f"이어야 한다) — 폭이 지운 숫자를 그대로 싣는다")
                        checked += 1

            # **`test_suppression` 에서 옮겨온 단언** (2026-08-27, #49). 헌 검사는
            # `index.html` 의 상태 초기화 줄을 바꿔치기해 시나리오 3 × 부서 3 × 탭 6 =
            # 54 상태를 걸으며 "화면에 뜬 어떤 값도 문턱 아래가 아니다" 를 봤다.
            # 그것이 잡던 버그는 억제가 셀 값이 아니라 부서 인원(`D.n < 20`)을 보고
            # 있어서 200명 부서가 "Priority · 8" 을 그린 것이다.
            #
            # **잃은 차원을 정직하게 적는다.** 새 화면에는 부서 필터가 없고 (정본 데모에
            # 정본 계약과 화면 필터가 없다) 시나리오 선택기도 없다. 그래서 54 상태 중
            # 걸을 수 있는 것은 시나리오 3 × 셀 탭 2 = 6 이다.
            #
            # **2026-08-28 정정.** 첫 판은 "데모 정본에 부서 데이터가 없다" 고 적었는데
            # 틀렸다 — `scripts/generate_synthetic.py` 의 SPEC 에 부서 넷과
            # `tiny_department`(n=14/8/16, 의도적으로 최소 셀 미만)가 있다. 없는 것은
            # 데이터가 아니라 정본 계약과 화면 필터다. 부서 차원은 `?dept=` 가 돌아올
            # 때 함께 돌아오고, 지금 그것을 걷는 척하는 검사를 쓰면 안 된다.
            #
            # 그리고 위 최소 셀 블록과 방향이 반대다. 그쪽은 자격자를 100명으로 낮춰
            # **억제가 일어나는지** 보고, 이쪽은 실제 시나리오 셋에서 **억제될 것이
            # 없는지** 본다. 둘 다 필요하다: 앞엣것만 있으면 언제나 억제하는 화면이
            # 통과하고, 뒤엣것만 있으면 절대 억제하지 않는 화면이 통과한다.
            min_cell = int(json.loads(
                (tmp / "base/canon.json").read_text(encoding="utf-8"))["min_cell"])
            scenarios = yaml.safe_load(original)["dashboard"]["scenarios"]
            parsed, walked, withheld_total, caveat_checked = 0, 0, 0, 0
            for scen in scenarios:
                mutated, n = re.subn(
                    r"^(\s*- \{key: A, employees: )10000",
                    rf"\g<1>{scen['employees']}", original, count=1, flags=re.M)
                if n != 1:
                    fails.append("억제 하한: 시나리오 A 를 못 찾았다 — 검사가 낡았다")
                    break
                slug = f"floor-{scen['key']}"
                (tmp / f"canon-{slug}.yml").write_text(mutated, encoding="utf-8")
                if build(tmp / f"canon-{slug}.yml", tmp / slug).returncode != 0:
                    fails.append(f"억제 하한 {scen['key']}: 빌드 실패")
                    continue
                # **부서 차원.** #49 가 잃었다고 기록한 것이고 #59 가 되돌린다.
                # 전사(None) + 부서 전부를 걷는다. 시나리오 × 부서 × 셀 탭.
                # **화면이 렌더하는 것은 `scenarios[0]` 이다.** 이 블록은 A 의 자격자
                # 수를 각 시나리오 값으로 바꿔 빌드하므로, 읽어야 하는 분할도 A 의
                # 것이다. 첫 판은 `scen["key"]` 로 읽었고 그래서 B·C 에서 화면(A 분할,
                # tiny 14)과 기대(B 분할, tiny 8)가 어긋나 거짓 실패가 났다.
                split = json.loads(
                    (tmp / slug / "canon.json").read_text(encoding="utf-8")
                )["departments"][0]["split"]
                depts = [None] + sorted(split)
                # 부서별 분모. 자격자 면제 판정에 쓴다.
                eligible_of = {**split, None: scen["employees"]}
                for dept in depts:
                  for tab in ("signals", "funnel"):
                    q = f"?tab={tab}" + (f"&dept={quote(dept)}" if dept else "")
                    raw, err = dump_dom(f"http://127.0.0.1:{port}/{slug}/"
                                        f"employer.html{q}")
                    where = f"{scen['key']}/{dept or '전사'}/{tab}"
                    if err:
                        fails.append(f"억제 하한 {where}: 렌더 실패 — {err}")
                        continue
                    walked += 1
                    panel = re.search(
                        rf'<section id="panel-{tab}"[^>]*>(.*?)</section>',
                        visible(raw), re.S)
                    if not panel:
                        fails.append(f"억제 하한 {where}: 패널이 없다")
                        continue
                    body = panel.group(1)
                    withheld_here = body.count("withheld (n &lt; 20)")
                    withheld_total += withheld_here

                    # **부서를 고른 화면에는 단서가 보여야 하고 전사 화면에는 안 보여야
                    # 한다.** 비율이 전사 기준이라는 사실을 안 적으면, 만들어낸 부서별
                    # 분포를 측정값으로 제시하는 것이 된다. 2026-08-28 에 단서를 영구
                    # 감추는 고장을 심었더니 통과했다 — 그때 없던 단언이 이것이다.
                    m = re.search(r'<p class="caveat[^"]*" id="deptcaveat"([^>]*)>',
                                  visible(raw))
                    if not m:
                        fails.append(f"부서 단서 {where}: deptcaveat 요소가 DOM 에 없다")
                    else:
                        hidden = "hidden" in m.group(1)
                        if bool(dept) == hidden:
                            fails.append(
                                f"부서 단서 {where}: 부서를 "
                                f"{'골랐는데 단서가 감춰져' if dept else '안 골랐는데 단서가 드러나'} "
                                f"있다 — 비율이 전사 기준이라는 사실을 안 적으면 "
                                f"만들어낸 부서별 분포를 측정값으로 제시하는 것이 된다")
                        caveat_checked += 1
                    # 화면에 실제로 뜬 인원. `1,234` 꼴만 센다 — 비율(`38%`)과
                    # 금액(`$31.40`)은 사람 수가 아니므로 문턱의 대상이 아니다.
                    for figure in re.findall(
                            r'<div class="(?:bval|snum)"[^>]*>(.*?)</div>',
                            body, re.S):
                        if "withheld" in figure:
                            continue
                        m = re.search(r"·\s*([\d,]+)\s*$", figure.strip())
                        if not m:
                            continue
                        parsed += 1
                        value = int(m.group(1).replace(",", ""))
                        # 자격자는 분모 자신이고 기업이 이미 아는 자기 부서 인원이다.
                        # 헌 검사도 같은 이유로 분모 라벨을 면제했다.
                        if tab == "funnel" and value == eligible_of[dept]:
                            continue
                        if value < min_cell:
                            fails.append(
                                f"억제 하한 {where}: 화면에 {value} 가 떴다 "
                                f"(문턱 {min_cell}) — 억제되지 않았다")
            # `seen` 이 증가만 하고 아무 데도 안 쓰이던 것이 헌 검사의 결함이었다.
            # 0이면 렌더가 비었거나 DOM 구조가 바뀐 것이고, 그것은 '위반 없음' 이 아니다.
            # **억제가 실제로 일어난 자리가 있어야 한다.** 시나리오 B 의 Finance(210명)
            # 는 완료 조치가 9명이라 문턱 아래다. 하나도 안 걸리면 이 검사가 억제를
            # 확인한 것이 아니라 억제할 것이 없는 상태만 걸은 것이다.
            if walked and withheld_total == 0:
                fails.append(
                    f"억제 하한: {walked}상태를 걸었는데 억제된 셀이 하나도 없다 — "
                    f"작은 부서에서 문턱 아래 값이 나와야 하고, 안 나오면 부서 분모가 "
                    f"안 적용되고 있다")
            if walked and parsed < walked:
                fails.append(f"억제 하한: {walked}상태를 걸었는데 파싱한 값이 "
                             f"{parsed}개다 (상태당 1개 미만). 일부 상태가 "
                             f"렌더되지 않았고, 안 읽은 화면은 통과가 아니다")
            checked += 1
            floor_walked, floor_parsed = walked, parsed
            floor_withheld = withheld_total
            floor_caveat = caveat_checked

            # 임직원 화면. 같은 빌더, 다른 계약 파일과 다른 화면.
            member_staged = set(json.loads(
                (tmp / "base/member-canon.json").read_text(encoding="utf-8")))
            member_covered = {c[0] for c in MEMBER_CASES}
            if member_staged != member_covered:
                fails.append(
                    f"member-canon.json 과 MEMBER_CASES 가 어긋난다. 케이스 없는 "
                    f"키: {sorted(member_staged - member_covered)}, 키 없는 "
                    f"케이스: {sorted(member_covered - member_staged)}")
            checked += 1

            for key, name, pattern, repl, new, dom_old, dom_new in MEMBER_CASES:
                mutated, n = re.subn(pattern, repl, original, count=1, flags=re.M)
                if n != 1:
                    fails.append(f"member:{name}: 정본에서 변조 지점을 못 찾았다 — "
                                 f"정본 구조가 바뀌었고 이 검사가 낡았다")
                    continue

                slug = "member-" + re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-")
                mcanon = tmp / f"canon-{slug}.yml"
                mcanon.write_text(mutated, encoding="utf-8")
                r = build(mcanon, tmp / slug)
                if r.returncode != 0:
                    fails.append(f"member:{name}: 변조한 정본으로 빌드가 실패했다: "
                                 f"{(r.stdout + r.stderr).strip()[:150]}")
                    continue

                if new is not None:
                    blob = json.loads((tmp / slug / "member-canon.json")
                                      .read_text(encoding="utf-8"))
                    got = blob.get(key)
                    if str(got) != new:
                        fails.append(f"member:{name}: 정본을 고쳤는데 "
                                     f"member-canon.json 이 {got!r} 이다")
                    checked += 1

                raw, err = dump_dom(
                    f"http://127.0.0.1:{port}/{slug}/member.html")
                if err:
                    fails.append(f"member:{name}: 렌더 실패 — {err}")
                    continue
                dom = visible(raw)

                # 밴드가 그려졌는지 먼저 본다. 빈 화면은 "옛 값 없음" 을 공짜로
                # 만족시킨다 — 이 파일이 세 번 밟은 함정이고 여기서도 같다.
                if not re.search(r'<div class="band [A-Za-z]+" id="band">\s*\w', dom):
                    fails.append(f"member:{name}: DOM 에 밴드가 없다 — fetch 가 "
                                 f"실패했거나 화면이 계약을 못 읽었다")
                    continue
                checked += 1

                if dom_new not in dom:
                    fails.append(f"member:{name}: 정본을 고쳤는데 화면에 "
                                 f"{dom_new!r} 가 안 나온다")
                checked += 1
                if dom_old is not None:
                    if re.search(rf"(?<![\w.]){re.escape(dom_old)}(?![\w.])", dom):
                        fails.append(f"member:{name}: 정본을 고쳤는데 화면에 옛 값 "
                                     f"{dom_old!r} 가 남아 있다")
                    checked += 1

            # 치환 값. 산출물 텍스트를 본다 (위 STYLE_CASES 주석의 이유).
            for name, pattern, repl, old, new in STYLE_CASES:
                mutated, n = re.subn(pattern, repl, original, count=1, flags=re.M)
                if n != 1:
                    fails.append(f"style:{name}: 정본에서 변조 지점을 못 찾았다 — "
                                 f"정본 구조가 바뀌었고 이 검사가 낡았다")
                    continue

                slug = f"style-{name}"
                mcanon = tmp / f"canon-{slug}.yml"
                mcanon.write_text(mutated, encoding="utf-8")
                r = build(mcanon, tmp / slug)
                if r.returncode != 0:
                    fails.append(f"style:{name}: 변조한 정본으로 빌드가 실패했다: "
                                 f"{(r.stdout + r.stderr).strip()[:150]}")
                    continue

                built = (tmp / slug / "employer.html").read_text(encoding="utf-8")
                if new not in built:
                    fails.append(f"style:{name}: 정본을 {new!r} 로 고쳤는데 산출물에 "
                                 f"없다. 빌더가 이 자리를 정본에서 안 읽는다")
                checked += 1
                # 개수 비교. 같은 색이 정본에 둘씩 있어서 (coral 과 bars.Priority)
                # 부재를 요구하면 거짓 실패가 된다. 줄어들지 않는 것이 진짜 고장이다.
                was, now = base_html.count(old), built.count(old)
                if now >= was:
                    fails.append(f"style:{name}: 정본을 고쳤는데 산출물의 옛 값 "
                                 f"{old!r} 개수가 {was}→{now} 다. 줄지 않았으므로 "
                                 f"템플릿이 그 값을 손으로 품고 있다")
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
    print(f"PASS — 검사 {checked}건. fetch 값 {len(CASES)}개(계약 키 "
          f"{len(covered)}개 전부)와 치환 값 {len(STYLE_CASES)}개(템플릿 자리 전부)를 "
          f"변조했을 때 산출물과 렌더된 DOM 이 함께 따라 움직이고 옛 값이 남지 않는다")
    print(f"       탭 {len(tabs)}개가 각각 자기 패널만 드러내고 모르는 ?tab= 은 첫 "
          f"탭으로 떨어진다. 자격자를 100명으로 낮추면 문턱 아래 셀이 인원·비율·"
          f"막대를 함께 감춘다")
    print(f"       시나리오 {len(scenarios)} × (전사+부서) × 셀 탭 2 = {floor_walked}상태. "
          f"화면에 뜬 인원 {floor_parsed}개가 전부 문턱 위이고 문턱 아래 {floor_withheld}개가 "
          f"억제됐다 (#49 가 잃었다고 적은 부서 차원을 #59 가 되돌렸다). "
          f"부서 단서 노출을 {floor_caveat}회 확인했다")
    print(f"       임직원 화면은 계약 키 {len(MEMBER_CASES)}건을 별 파일로 받는다 — "
          f"밴드 경계를 흔들면 같은 점수가 다른 밴드로 옮겨가고, 방향 문턱을 올리면 "
          f"같은 차이가 '비슷하다' 가 된다")
    print(f"       렌더된 화면에 금지어·금지 용어·범위 없는 절대 표현이 없고 "
          f"합성 고지가 있다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
