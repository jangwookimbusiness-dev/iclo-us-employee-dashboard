#!/usr/bin/env python3
"""동의가 사용 시점에 평가되는지, 화면이 실제 데이터를 읽는지 본다.

**2026-08-27 재작성 (#48).** 헌 판은 `app.html` 의 `let S = {...}` 초기화 줄을 정규식으로
바꿔치기해서 원하는 화면을 띄웠다. 헌장 §4.3 이 그것을 게이트 재분류에서 "다시 쓰기" 로
분류한 이유다 — **구현 독립 경계가 아니다.** 상태 초기화 줄 이름, CSS 클래스, DOM 문구,
`member-demo.json` 경로에 다 결합돼 있어서 화면을 고치면 검사가 깨지고, 검사를 통과시키려면
화면을 그 모양으로 유지해야 했다.

새 판은 셋을 바꿨다.

1. **상태를 URL 로 잡는다.** `?who=P3` 이 그 사람을 고른다. 기업 화면의 `?tab=` 과 같은
   이유이고 (PRD §2.2 — 모든 뷰가 링크 가능), 페이지 내부를 건드리지 않는다.
2. **빌드 경계에서 본다.** 정본과 임직원 데이터를 인자로 받는 같은 빌더를 돌리고 산출물을
   HTTP 로 열어 Chrome DOM 을 본다. `test_build_reads_canon.py` 와 같은 경계다.
3. **데이터를 바꾼다, 화면을 안 바꾼다.** "실데이터가 오면 같은 화면이 그 사람의 데이터를
   보인다" 는 문장은 JSON 교체가 작업 전부일 때만 참이다. 그것을 여기서 시험한다.

검사하는 것 넷:

- 데이터 없으면 화면 없음. 그리고 이름이 안 뜬다 (박아둔 사본이 없다).
- JSON 을 고치면 화면이 따라온다.
- **동의는 평가된다, 읽히지 않는다.** 막아야 하는 상태 넷: 철회 · 미부여 · 대체된 정책
  문안에 부여(STALE) · 사진 동의는 현행이나 처리 근거가 철회됨. 셋째가 boolean 으로
  표현 불가능한 상태이고, 틀리면 조용히 처리가 계속되는 상태다.
- **숫자 점수가 화면에 없다.** 밴드와 방향을 만드는 데 필요해서 계산되지만 렌더되지
  않는다 (PRD §5.4 · 정본 `surfaces.employee_app.numeric_score`). 데이터의 점수를 눈에
  띄는 값으로 바꿔놓고 DOM 에서 찾는다.

    python3 test_consent.py

Chrome 이 필요하다.
"""
import copy
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
DATA = ROOT / "data/member-demo.json"


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


def visible(dom):
    """`<script>`·`<style>`·주석을 걷는다.

    `--dump-dom` 은 스크립트 **소스**까지 준다. 걷지 않으면 화면에 없는 글자가 있다고
    읽힌다 — `test_build_reads_canon.py` 가 같은 함정을 세 번 밟았고 (스크립트 소스,
    스타일 본문, HTML 주석) 그 이유를 그쪽 docstring 이 적는다.
    """
    return re.sub(r"(?s)<!--.*?-->", "",
                  re.sub(r"(?is)<(script|style)\b[^>]*>.*?</\1\s*>", "", dom))


def serve(directory):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(directory), **kw)

        def log_message(self, *a):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


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


def build(out_dir, data=None, data_missing=False):
    """같은 빌더를 돌린다. 데이터만 갈아끼운다.

    `data_missing` 은 화면이 데이터 파일 없이도 무언가를 그리는지 보기 위한 것이다.
    빌더는 데이터가 없으면 죽으므로, 빌드한 뒤 파일을 지운다 — 빌드 실패와 런타임
    fetch 실패는 다른 고장이고 여기서 보는 것은 뒤쪽이다.
    """
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False,
                                     encoding="utf-8") as f:
        json.dump(data if data is not None else
                  json.loads(DATA.read_text(encoding="utf-8")), f)
        tmp_data = Path(f.name)
    try:
        r = subprocess.run(
            [sys.executable, str(BUILDER), "--canon", str(CANON),
             "--member-data", str(tmp_data), "--out", str(out_dir), "--quiet"],
            capture_output=True, text=True, cwd=ROOT)
    finally:
        tmp_data.unlink()
    if r.returncode != 0:
        return f"빌드 실패: {(r.stdout + r.stderr).strip()[:250]}"
    if data_missing:
        (out_dir / "member.json").unlink()
    return None


# 선택 가능한 사람 = disabled 가 붙지 않은 버튼. 이름은 DOM 문구가 아니라 데이터에서
# 온 값이므로, 이 정규식이 보는 것은 구조(버튼과 그 상태)뿐이다.
# 상태별 화면 문구. 정본 consent_model.states 와 1:1 이고, 화면의 CONSENT_COPY 가
# 그 문구를 갖는다. 여기 손으로 적는 이유는 **검사가 화면과 독립이어야** 하기 때문이다 —
# 화면에서 읽어오면 화면이 다 "in force" 라고 적어도 통과한다.
COPY = {
    "철회": "withdrawn",
    "미부여": "not given",
    "대체된 문안": "needs re-consent",
    "근거 없음": "withdrawn",       # 처리 근거가 철회된 것이므로
    "만료": "expired",
}

BUTTON = re.compile(
    r'<button[^>]*class="subject"([^>]*)>\s*<span class="nm">([^<]*)</span>')


def offered(dom):
    """촬영 대상으로 제시된 이름. disabled 는 제외한다."""
    return {name for attrs, name in BUTTON.findall(visible(dom))
            if "disabled" not in attrs}


def listed(dom):
    """버튼으로 나온 모든 이름 (차단된 것 포함)."""
    return {name for _, name in BUTTON.findall(visible(dom))}


def main():
    for path, label in ((BUILDER, "빌더"), (CANON, "정본"), (DATA, "임직원 데이터")):
        if not path.is_file():
            print(f"FAIL — {label} 없음: {path}")
            return 1

    base = json.loads(DATA.read_text(encoding="utf-8"))
    policy = base["policy_version"]
    # 관리 대상 첫 사람. 이름을 손으로 적지 않는다 — fixture 가 바뀌면 검사가
    # 조용히 다른 사람을 보게 된다.
    subject = next(p for p in base["parties"] if p.get("access"))
    names = [p["name"] for p in base["parties"]]

    ran, fails = set(), []

    with tempfile.TemporaryDirectory(prefix="consent-") as tmp:
        tmp = Path(tmp)
        httpd, port = serve(tmp)

        def render(slug, data=None, data_missing=False, who=None):
            err = build(tmp / slug, data, data_missing)
            if err:
                return None, err
            url = f"http://127.0.0.1:{port}/{slug}/member.html"
            if who:
                url += f"?who={who}"
            return dump_dom(url)

        try:
            # ── 1. 데이터가 없으면 화면이 없다 ────────────────────────────
            dom, err = render("nodata", data_missing=True)
            if err:
                fails.append(f"데이터 없음: {err}")
            else:
                if "No member data" not in visible(dom):
                    fails.append("데이터 파일이 없는데 화면이 그려졌다 — "
                                 "예비 사본이 다시 들어왔다")
                ran.add("no_data_message")
                # **문구만 보면 부족하다.** 첫 판은 이 문구와 이름 부재만 봤고, 그러면
                # `"No member data"` 를 유지한 채 결과 패널을 드러내고 임의의 밴드를
                # 넣어도 통과한다 (codex 2026-08-30). 밴드가 없다는 것을 직접 본다.
                m = re.search(r'<section id="result"([^>]*)>', dom)
                if m and "hidden" not in m.group(1):
                    fails.append("데이터 파일이 없는데 결과 영역이 드러나 있다")
                ran.add("no_data_names")
                if re.search(r'id="band">\s*[A-Za-z]', visible(dom)):
                    fails.append("데이터 파일이 없는데 밴드가 그려졌다 — "
                                 "그럴듯한 값으로 대체하는 경로가 생겼다")
                ran.add("no_data_result_hidden")
                leaked = [n for n in names if n in visible(dom)]
                if leaked:
                    fails.append(f"데이터 파일이 없는데 이름이 화면에 있다: {leaked}")
                ran.add("no_data_no_band")

            # ── 2. 화면이 데이터를 따라온다 ──────────────────────────────
            renamed = copy.deepcopy(base)
            renamed["parties"][0]["name"] = "Zzyzx Testcase"
            dom, err = render("renamed", renamed)
            if err:
                fails.append(f"이름 교체: {err}")
            else:
                shown = listed(dom)
                if "Zzyzx Testcase" not in shown:
                    fails.append("JSON 에서 이름을 바꿨는데 화면이 안 따라왔다")
                if base["parties"][0]["name"] in shown:
                    fails.append(f"이름을 바꿨는데 {base['parties'][0]['name']!r} 가 "
                                 f"남아 있다 — 화면이 박아둔 사본을 읽는다")
                ran.add("rename_follows")

            # ── 3. 동의는 평가된다 ──────────────────────────────────────
            # fixture 의 현행 정책 문안에서 만든다. 정책 버전을 손으로 적으면
            # 정본이 갱신될 때 STALE 사례가 조용히 ACTIVE 가 된다.
            g = lambda purpose, granted, ver, at: {
                "purpose": purpose, "granted": granted,
                "policy_version": ver, "at": at}
            cases = {
                "철회": [g("processing", True, policy, "2026-06-04T10:00:00Z"),
                        g("photo", True, policy, "2026-06-04T10:00:00Z"),
                        g("photo", False, policy, "2026-07-01T10:00:00Z")],
                "미부여": [g("processing", True, policy, "2026-06-04T10:00:00Z")],
                # 부여됐고 철회도 안 됐지만, 우리가 이미 대체한 문안에 부여됐다.
                # boolean 모델은 이것을 동의로 읽고 처리를 계속한다.
                "대체된 문안": [g("processing", True, policy, "2026-06-04T10:00:00Z"),
                            g("photo", True, "2000-01-01", "2000-01-01T10:00:00Z")],
                # 사진 동의는 현행이지만 그것이 딛고 선 처리 근거가 없다.
                "근거 없음": [g("processing", False, policy, "2026-07-01T10:00:00Z"),
                           g("photo", True, policy, "2026-06-04T10:00:00Z")],
                # CMIA §56.11(f) 만료. 부여됐고 철회도 안 됐고 문안도 현행인데
                # 유효기간이 지났다. 넷째 상태와 다른 다섯째다 (#62).
                "만료": [g("processing", True, policy, "2026-06-04T10:00:00Z"),
                       dict(g("photo", True, policy, "2026-06-04T10:00:00Z"),
                            expires_at="2026-07-01T00:00:00Z")],
            }
            for label, records in cases.items():
                d = copy.deepcopy(base)
                for p in d["parties"]:
                    if p["id"] == subject["id"]:
                        p["consent"] = records
                slug = "consent-" + re.sub(r"\W+", "-", label)
                dom, err = render(slug, d, who=subject["id"])
                if err:
                    fails.append(f"동의 {label}: {err}")
                    continue
                if subject["name"] in offered(dom):
                    fails.append(f"동의 {label} 인데 {subject['name']} 에게 "
                                 f"촬영이 열려 있다")
                ran.add("case_blocked")
                # **상태가 구별되어 표시돼야 한다.** 넷을 하나로 묶으면 재동의 요청
                # 문구를 옳게 쓸 수 없다 — 철회는 그 사람이 그만둔 것, STALE 은 우리가
                # 문안을 바꾼 것, 만료는 시간이 지난 것이다.
                # **그 사람의 버튼 안에서 찾는다.** 문서 전체를 보면 기본 fixture 의
                # P4(항상 photo 철회)가 `withdrawn` 을 들고 있어서 다른 사람의 상태가
                # 오답을 가린다 (codex 2026-08-30). 대상자 버튼만 잘라 본다.
                btn = next((attrs + name + why for attrs, name, why in
                            re.findall(r'<button[^>]*class="subject"([^>]*)>\s*'
                                       r'<span class="nm">([^<]*)</span>\s*'
                                       r'<span class="why[^"]*">([^<]*)</span>',
                                       visible(dom))
                            if name == subject["name"]), None)
                if btn is None:
                    fails.append(f"동의 {label}: 대상자 {subject['name']} 버튼을 "
                                 f"DOM 에서 못 찾았다 — 이 검사가 낡았다")
                elif COPY[label] not in btn:
                    fails.append(f"동의 {label} 인데 {subject['name']} 버튼에 "
                                 f"{COPY[label]!r} 가 없다 — 상태가 구별되어 "
                                 f"표시되지 않는다")
                ran.add("case_result_hidden")
                # 차단된 사람에게 밴드를 보이면, 하지 말라고 한 처리를 이미 한
                # 결과를 보이는 것이다. 결과 영역이 감춰져야 한다.
                m = re.search(r'<section id="result"([^>]*)>', dom)
                if not m:
                    fails.append(f"동의 {label}: 결과 영역이 DOM 에 없다")
                elif "hidden" not in m.group(1):
                    fails.append(f"동의 {label} 인데 결과 영역이 드러나 있다 — "
                                 f"허락받지 않은 처리의 결과가 화면에 있다")
                ran.add("case_no_booking")
                # **예약 넘김도 못 만든다.** 밴드를 못 보는 사람에게 예약을 권하는 것은
                # 하지 말라고 한 처리의 결과를 쓰는 것이다 (#60).
                events = re.findall(r'data-event="(\w+)"', visible(dom))
                if events:
                    fails.append(f"동의 {label} 인데 예약 이벤트 버튼이 {events} 있다 — "
                                 f"차단된 프로필은 예약도 못 만든다")
                ran.add("case_state_wording")

            # ── 4. 전부 동의한 사람은 통과한다 ───────────────────────────
            d = copy.deepcopy(base)
            for p in d["parties"]:
                if p["id"] == subject["id"]:
                    p["consent"] = [
                        g("processing", True, policy, "2026-06-04T10:00:00Z"),
                        g("photo", True, policy, "2026-06-04T10:00:00Z")]
            dom, err = render("consented", d, who=subject["id"])
            if err:
                fails.append(f"전부 동의: {err}")
            else:
                if subject["name"] not in offered(dom):
                    fails.append(f"전부 동의한 {subject['name']} 이 제시되지 않는다 "
                                 f"— 문이 닫힌 채로 굳었다")
                ran.add("future_expiry_ok")
                m = re.search(r'<section id="result"([^>]*)>', dom)
                if m and "hidden" in m.group(1):
                    fails.append("전부 동의인데 결과 영역이 감춰져 있다")
                ran.add("consented_offered")
                # 두 이벤트가 **구분되어** 나와야 한다. 하나로 합치면 "예약률" 이
                # 버튼을 누른 비율이 된다 (기술문서 §1.1·§5).
                events = set(re.findall(r'data-event="(\w+)"', visible(dom)))
                want = {"BOOKING_HANDOFF", "BOOKING_SELF_REPORTED"}
                if events != want:
                    fails.append(f"전부 동의한 사람의 예약 이벤트가 {sorted(events)} 다 "
                                 f"— {sorted(want)} 여야 한다. 둘을 합치면 예약률이 "
                                 f"버튼을 누른 비율이 된다")
                ran.add("consented_result_shown")
                # 그리고 확인되지 않은 것을 확인된 것처럼 적지 않는다.
                #
                # **`visible()` 만으로는 부족하다.** 예약 문구가 `result` 안에 있고
                # 그 절은 차단된 프로필에서 `hidden` 이므로, 문서 전체를 보면 감춰진
                # 자리의 글자까지 세게 된다. 반대로 감춰진 자리를 걷어내면 이 프로필
                # (전부 동의)에서는 드러나 있으니 그대로 잡힌다. 2026-08-28 에
                # 이 문구를 심어봤을 때 통과한 이유가 그것이었다 — 검사가 본 자리가
                # 화면에 보이는 자리와 달랐다.
                vis = re.sub(r"(?is)<section[^>]*\bhidden\b[^>]*>.*?</section>", "",
                             visible(dom))
                if "APPOINTMENT_BOOKED" in vis:
                    fails.append("화면에 APPOINTMENT_BOOKED 가 있다 — 예약 계층이 "
                                 "없으므로 그 단계는 존재하지 않는다")
                ran.add("consented_booking_pair")
                # 예약 단서가 보여야 한다. 자가 보고를 확인된 예약으로 읽히게 두지 않는다.
                if "기록되는 것은 당신이 말한 것입니다" not in vis:
                    fails.append("전부 동의한 사람 화면에 예약 단서가 없다 — 자가 "
                                 "보고가 확인된 예약으로 읽힌다")
                ran.add("consented_no_appointment_booked")

            # ── 4b. 만료 필드가 없는 기록은 계속 유효하다 ────────────────
            # **부재를 만료로 읽으면 안 된다.** 그러면 이 필드가 생기기 전에 받은
            # 동의 전부가 막힌다. fixture 의 기본 동의에는 expires_at 이 없으므로
            # 위 "전부 동의" 통과가 이미 그것을 보이지만, 미래 만료도 통과해야 한다.
            d = copy.deepcopy(base)
            for p_ in d["parties"]:
                if p_["id"] == subject["id"]:
                    p_["consent"] = [
                        g("processing", True, policy, "2026-06-04T10:00:00Z"),
                        dict(g("photo", True, policy, "2026-06-04T10:00:00Z"),
                             expires_at="2099-01-01T00:00:00Z")]
            dom, err = render("notyet", d, who=subject["id"])
            if err:
                fails.append(f"미래 만료: {err}")
            elif subject["name"] not in offered(dom):
                fails.append(f"만료일이 미래인데 {subject['name']} 이 막혔다 — "
                             f"만료 판정이 부등호를 뒤집었다")
            ran.add("consented_booking_caveat")

            # ── 5. 숫자 점수가 화면에 없다 ──────────────────────────────
            # 데이터의 점수를 눈에 띄는 값으로 바꾼다. 원래 값(78 등)으로 찾으면
            # 날짜나 CSS 숫자와 겹쳐 오탐이 나고, 오탐이 나는 검사는 곧 꺼진다.
            d = copy.deepcopy(base)
            marker = 7391
            for p in d["parties"]:
                if p["id"] == subject["id"]:
                    p["history"] = [{"on": "2026-01-02", "score": marker - 9},
                                    {"on": "2026-08-09", "score": marker}]
            dom, err = render("noscore", d, who=subject["id"])
            if err:
                fails.append(f"점수 비노출: {err}")
            else:
                dom = visible(dom)
                # **심은 점수를 전부 찾는다.** 첫 판은 `marker` 하나만 봤고 데이터에는
                # `marker - 9` 도 있었다 — 화면이 이전 점수만 보여도 통과했다.
                # 천 단위 구분 형태도 같이 본다: `7,391` 은 `7391` 이 아니다.
                for score in (marker, marker - 9):
                    for form in (str(score), f"{score:,}"):
                        if form in dom:
                            fails.append(f"점수 {form} 가 화면에 있다 — PRD §5.4 는 "
                                         f"임직원에게 숫자를 주지 않는다")
                    ran.add("no_score_hidden")
                # 그리고 밴드는 나와야 한다. 안 나오면 위 단언이 빈 화면으로
                # 만족된다 — 이 검사가 세 번 밟은 함정이다.
                if not re.search(r'<div class="band [A-Za-z]+" id="band">'
                                 r'\s*\w', dom):
                    fails.append("점수는 없는데 밴드도 없다 — 빈 화면은 "
                                 "'숫자 없음' 의 증거가 아니다")
                ran.add("no_score_band_present")
                # 눈금 없는 막대에 위치를 표시하는 것은 숫자를 숨긴 숫자다
                # (정본 core_ai_operation.change_without_a_number).
                if re.search(r'style="[^"]*width:\s*\d', dom):
                    fails.append("임직원 화면에 폭이 값을 싣는 요소가 있다 — "
                                 "눈금 없는 막대의 위치는 지운 숫자와 같다")
                ran.add("no_score_no_width")
        finally:
            httpd.shutdown()
            httpd.server_close()

    if fails:
        print(f"FAIL — 검사 {checked}건 중 {len(fails)}건 실패")
        for f in fails:
            print(f"  ✗ {f}")
        return 1
    # **개수가 아니라 이름을 요구한다.** 이 가드의 두 판이 틀렸다.
    #
    # 1판은 손으로 더한 상수였고 단언을 늘릴 때마다 다시 계산해야 해서 두 번 틀렸다.
    # 2판은 소스의 `checked += 1` 을 셌는데, **보호해야 할 단언과 같은 문장을 세므로
    # 단언과 카운터를 함께 지우면 기대값도 같이 줄어든다** (codex 2026-08-30). 개수를
    # 세는 가드는 그 경로를 막을 수 없다.
    #
    # 3판은 각 단언에 이름을 주고 **이름 집합**을 요구한다. 단언을 지우면 그 이름이
    # 안 들어오고, 이 목록에서 이름을 지우는 것은 "이 단언을 더 안 한다" 는 명시적
    # 선언이므로 diff 에서 보인다.
    REQUIRED = {
        "no_data_message", "no_data_names", "no_data_result_hidden", "no_data_no_band",
        "rename_follows",
        "case_blocked", "case_result_hidden", "case_no_booking", "case_state_wording",
        "future_expiry_ok",
        "consented_offered", "consented_result_shown", "consented_booking_pair",
        "consented_no_appointment_booked", "consented_booking_caveat",
        "no_score_hidden", "no_score_band_present", "no_score_no_width",
    }
    if ran != REQUIRED:
        missing, extra = sorted(REQUIRED - ran), sorted(ran - REQUIRED)
        print(f"FAIL — 실행되지 않은 단언: {missing or '없음'} · "
              f"목록에 없는 단언: {extra or '없음'}. "
              f"실행되지 않은 단언은 통과가 아니다")
        return 1
    print(f"PASS — 단언 {len(ran)}종. 데이터 파일이 없으면 화면도 이름도 없고, JSON 을 "
          f"고치면 화면이 따라온다")
    print(f"       동의 {len(cases)}종(철회·미부여·대체된 문안·근거 없음·만료)이 촬영을 "
          f"막고 결과 영역까지 감추며, 전부 동의한 사람은 통과한다")
    print(f"       숫자 점수는 DOM 에 없고 밴드는 있다. 폭으로 값을 싣는 요소도 없다")
    print(f"       예약 넘김 둘이 구분되어 나오고, 차단된 프로필은 그것도 못 만들며, "
          f"화면에 APPOINTMENT_BOOKED 가 없다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
