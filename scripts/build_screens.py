#!/usr/bin/env python3
"""화면을 정본에서 빌드한다. 재구축의 §4.2 골격.

헌장 §4.2 의 요구가 둘이었다. **정본을 빌드 시점에 읽는 경로가 손 작업 없이 서는가**,
그리고 **변조→렌더 검사를 그 경계에 붙일 수 있는가.** 이 파일이 첫째를 만들고
`test_build_reads_canon.py` 가 둘째를 만든다.

왜 이것이 필요한가. 헌 화면은 상수를 정본에서 **손으로 옮겼다.** `MIN_CELL = 20` 이
`index.html` 에도 있고 정본에도 있어서, 한 곳만 고치는 날이 온다. `test_single_source`
가 그것을 막으려고 리터럴을 변조하고 Chrome 으로 렌더해서 확인했다 — 검사로 막던 것이다.
빌드가 정본을 읽으면 그 값이 **한 곳에만 존재**하고 검사할 것이 줄어든다.

다만 검사가 사라지지는 않는다 (codex 헌장 검토). 빌드 시점 읽기는 손 복사 단계만 없애고,
템플릿·라벨·다른 컴포넌트가 옛 값을 품는 것은 그대로 가능하다. 그래서 같은 검사를
**빌드 경계에서** 다시 세운다 — 변조한 정본으로 빌더를 돌리고 산출물을 본다.

스택 판단. npm·Vite·React 는 `AGENTS.md` 가 기각했고, 빌드 도구 다섯이 이미 Python 이고,
정본이 YAML 이다. 새 의존성 0으로 선다. 템플릿 엔진도 안 쓴다 — 정적 페이지에 치환이면
충분하고, Jinja 를 넣으면 핀할 의존성이 하나 늘고 그만큼의 값어치가 없다.

사용법:
  python3 scripts/build_screens.py                  # build/ 에 렌더
  python3 scripts/build_screens.py --canon PATH     # 다른 정본으로 (변조 검사용)
  python3 scripts/build_screens.py --out DIR
"""
import argparse
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CANON = ROOT / "contracts/proposal-package-v11.yml"
OUT = ROOT / "build"
TEMPLATE = ROOT / "screens/employer.html.in"


# 개요 화면이 그리는 카드와 그 순서. 정본의 `dashboard.kpis` 는 지표 **목록**이고
# 순서는 배치다 — 배치를 정본에 넣으면 정본이 CSS 를 알아야 한다. 라벨은 정본,
# 순서는 여기. 키가 정본에 없으면 빌드가 죽는다 (아래 `labels[k]`).
OVERVIEW_CARDS = ("eligible_employees", "covered_members", "activated",
                  "repeat_participation", "pmpm_allowed")

# 퍼널 단계와 그 순서. 정본 `metric_time_contracts.funnel_nesting` 이 이 다섯이 같은
# 보고월·같은 자격자 분모를 써서 **겹쳐야** 한다고 정한다. 순서는 그 포개짐의 방향이다.
#
# 첫 단계의 분수는 1.0 이다 — 자격자가 분모 자신이다. 정본에 `FRAC.eligible: 1.0` 을
# 넣지 않는 이유는 그것이 측정값이 아니라 정의라는 것이다. 정본에 두면 누가 0.9 로
# 고칠 수 있고, 그러면 분모가 자기보다 작아진다.
FUNNEL_STAGES = (
    ("eligible_employees", None),
    ("activated", "FRAC.activated"),
    ("valid_capture", "FRAC.valid"),
    ("open_actions", "FRAC.gap"),
    ("closed_actions", "FRAC.closed"),
)


def load_canon(path):
    """정본에서 화면이 쓰는 값만 꺼낸다.

    없으면 조용히 기본값을 쓰지 않고 죽는다. 기본값은 정본이 거짓이 되는 경로다.
    """
    doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    dash = doc["dashboard"]
    kpi = {k["const"]: k["value"] for k in dash["kpis"] if k.get("const")}
    labels = {k["key"]: k["label"] for k in dash["kpis"] if k.get("key")}
    tabs = {t["key"]: t for t in dash["tabs"]}
    missing = [k for k in OVERVIEW_CARDS if k not in labels]
    if missing:
        # 트레이스백 대신 이유를 적는다. 정본에서 `key:` 를 지우는 것은 있을 수 있는
        # 편집이고, 그때 나오는 KeyError 는 무엇을 되돌려야 하는지 안 알려준다.
        sys.exit(f"build_screens: 정본 dashboard.kpis 에 key 가 없다 {missing} — "
                 f"개요 카드가 라벨을 가져올 자리다")
    mtc = dash["metric_time_contracts"]
    completed = mtc["completed_actions"]

    funnel = [{"key": k, "label": labels[k],
               "frac": 1.0 if const is None else kpi[const]}
              for k, const in FUNNEL_STAGES]

    # **포개짐을 빌드가 거부한다.** 정본 `funnel_nesting` 이 다섯 단계가 같은 보고월과
    # 같은 자격자 분모를 써서 겹쳐야 한다고 정한다. 그 말의 검사 가능한 내용은 뒤
    # 단계가 앞 단계보다 클 수 없다는 것이다. 화면에 캡션으로 그 규칙을 적어두고
    # 값은 안 보는 것이 R1 이다 — 규칙을 산문으로 쓰고 코드가 안 하는 것.
    for prev, cur in zip(funnel, funnel[1:]):
        if cur["frac"] > prev["frac"]:
            sys.exit(
                f"build_screens: 퍼널이 포개지지 않는다 — "
                f"{cur['key']}({cur['frac']}) > {prev['key']}({prev['frac']}). "
                f"정본 funnel_nesting 이 금지하는 상태이고, 뒤 단계가 앞 단계보다 "
                f"크면 두 단계가 다른 창이나 다른 분모를 쓰고 있다는 뜻이다")

    # 밴드 분포는 100% 를 채워야 한다. 안 채우면 화면의 바 셋이 트랙을 못 채우고,
    # 그 상태는 "나머지 사람은 어디 갔나" 라는 질문에 화면이 답을 못 하는 것이다.
    share_sum = sum(s["share"] for s in dash["signals"])
    if share_sum != 100:
        sys.exit(f"build_screens: 밴드 점유율 합이 {share_sum}% 다 — "
                 f"분포는 100% 여야 한다. 사람 단위 분포에서 합이 안 맞으면 "
                 f"밴드가 겹치거나 어느 밴드에도 안 들어간 사람이 있다")

    def plain(s):
        """정본의 마크다운 강조를 걷는다. 화면에 별표가 그대로 나가지 않게."""
        return re.sub(r"\*\*(.+?)\*\*", r"\1", " ".join(s.split()))

    # 화면이 **읽는 것만** 넣는다. #43 에서 14개 중 일곱을 뺐다 —
    # valid·gap·closed·signals 가 Signals·Funnel 탭 것이었고 그 탭이 없었다. 안 쓰는
    # 값을 계약에 두면 썩는다: 정본이 바뀌어도 아무도 모르고, 검사도 그 값이 화면에
    # 도달했는지 확인할 방법이 없다. **"탭이 서면 그때 같이 넣는다" 고 적었고 지금
    # 탭이 섰다 (#46).** 그래서 넷이 돌아온다.
    #
    # 신선도 넷은 남긴다. 결정 기록이 `PROJECT_PHASE=demo` 동안 신선도를 정본 소유로
    # 명시했고, 컨텍스트 바가 그 넷을 그린다.
    return {
        # 탭 셋 전부. 첫 판은 `heading` 하나만 스테이징했다 — 개요 제목이고, 화면에
        # 탭이 하나였다. 이제 라벨과 제목이 탭마다 있고 URL 상태(`?tab=`)가 key 를 쓴다.
        "tabs": [{"key": t["key"], "label": t["label"], "heading": t["heading"]}
                 for t in dash["tabs"]],
        # 라벨은 정본 것이다. 첫 판은 다섯 개를 템플릿 JS 배열에 손으로 적었고, 그중
        # 셋은 정본에 아예 없는 문자열이었다 — 헌 화면에서 옮겨 적은 것이다.
        "cards": [{"key": k, "label": labels[k]} for k in OVERVIEW_CARDS],
        "min_cell": dash["constants"]["min_cell"],
        "dep_ratio": dash["constants"]["dep_ratio"],
        "eligibility_thru": dash["constants"]["eligibility_thru"],
        "claims_thru": dash["constants"]["claims_thru"],
        "lag_days": dash["constants"]["lag_days"],
        "completeness_pct": dash["constants"]["completeness_pct"],
        "activated": kpi["FRAC.activated"],
        "repeat": dash["repeat_participation"]["value"],
        "repeat_denominator": dash["metric_time_contracts"]["repeat_participation"]["denominator"],
        "scenarios": [
            {"key": s["key"], "label": s["label"],
             "employees": s["employees"], "pmpm": s["pmpm"]}
            for s in dash["scenarios"]
        ],
        # Signals 탭. 밴드와 점유율뿐이다 — PRD §5.4 가 기업 뷰에 숫자 점수를 금지한다.
        "signals": [{"key": s["key"], "share": s["share"]} for s in dash["signals"]],
        # 단위 진술도 정본 것이다. "촬영이 아니라 사람" 은 이 화면에서 가장 오해하기
        # 쉬운 사실이고 (한 사람이 50번 찍어 분포를 흔드는 것이 정본이 적은 게임 벡터다),
        # 손으로 적으면 정의가 바뀔 때 화면만 남는다.
        "signal_unit": plain(mtc["signal_distribution"]["unit"]),
        "signal_window": mtc["signal_distribution"]["window"],
        # Funnel 탭. 라벨은 kpis, 분수는 FRAC. 첫 단계는 분모 자신이라 1.0 이다.
        "funnel": funnel,
        "funnel_nesting": plain(mtc["funnel_nesting"]),
        # 완료 조치의 잠정 표시. 정본이 산문으로만 갖고 있어서 화면이 읽을 수 없었다.
        "completed_provisional": bool(completed.get("provisional")),
        "completed_provisional_label": completed.get("provisional_label", ""),
    }


def load_style(path):
    """빌드 시점에 템플릿 안으로 치환되는 값. `canon.json` 에 안 들어간다.

    **측정값과 갈라놓는 이유는 fetch 가 닿지 못하는 자리가 있다는 것뿐이다.** 색은
    CSS 커스텀 프로퍼티로 `:root` 에 있고 CSS 는 fetch 를 못 한다. 제목은 `<head>`
    안에 있어서 fetch 가 돌아오기 전에 이미 탭에 뜬다.

    JS 로 `setProperty` 를 부르는 길도 있었다. 안 간 이유는 다크 모드다 —
    미디어 쿼리 두 벌을 JS 로 다시 만들고 OS 테마 전환 리스너까지 달아야 하는데,
    빌드 시점 치환은 CSS 를 그대로 두고 값만 넣는다.

    A3 도 이 경계를 지지한다. 전환하면 `canon.json` 자리가 기업별 export 로 바뀌지만
    색과 제목은 테넌트 데이터가 아니다. 그것들이 export 스키마에 들어가면 기업마다
    화면 색을 보낼 수 있게 되는데 그건 아무도 원하지 않는다.
    """
    dash = yaml.safe_load(path.read_text(encoding="utf-8"))["dashboard"]
    col = dash["colors"]
    style = {
        "title": dash["title"],
        "coral": col["coral"],
        "coral_dark": col["coral_dark_mode"],
        "navy": col["navy"],
        "teal": col["teal"],
        "background": col["background"],
        # 바 트랙. PRD §5.4 의 3:1 레드라인을 재는 상대색이고, 그래서 정본이 갖는다.
        "bar_track": col["bar_track"]["light"],
        "bar_track_dark": col["bar_track"]["dark"],
    }
    # 밴드 색 여섯. 이름은 `bar_low`·`bar_low_dark` 처럼 만든다 — 밴드 키를 손으로
    # 나열하면 정본에 밴드를 넣어도 자리가 안 생기고, 그걸 아무도 모른다.
    for mode, suffix in (("light", ""), ("dark", "_dark")):
        for band, hexv in col["bars"][mode].items():
            style[f"bar_{band.lower()}{suffix}"] = hexv
    return style


def render(style):
    """템플릿에 `{{...}}` 자리만 채운다. 측정값은 여기 안 들어간다.

    첫 판은 정본 JSON 을 `<script type="application/json">` 블록으로 HTML 안에
    박았다. **결정 기록(#37, 정본 `decided.REBUILD-FRAMEWORK`)이 다른 모양을
    지정한다** — `canon.json` 을 같은 출력 디렉터리에 **별 파일**로 놓고 화면이
    그것을 읽는다.

    그 모양이 나은 이유는 A3 다. 전환하면 측정값이 기업별 export JSON 으로 가고
    화면은 같은 자리에서 다른 파일을 읽는다. 값이 HTML 안에 박혀 있으면 그때
    템플릿을 다시 손봐야 한다.

    대가는 하나. 화면이 `fetch` 를 쓰므로 `file://` 로 못 열고 HTTP 가 필요하다.
    `app.html` 이 이미 그랬고 `scripts/serve.sh` 가 있다.

    치환은 남는 자리를 허용하지 않는다. `{{navy}}` 가 그대로 산출물에 남으면 화면은
    그 색을 잃고 검사는 "새 값 없음" 으로 걸린다. 걸리기 전에 여기서 죽는다 —
    템플릿에 자리를 늘렸는데 `load_style` 에 안 넣은 경우가 그것이다.
    """
    html = TEMPLATE.read_text(encoding="utf-8")
    for name, value in style.items():
        html = html.replace("{{" + name + "}}", str(value))
    left = sorted(set(re.findall(r"\{\{(\w+)\}\}", html)))
    if left:
        sys.exit(f"build_screens: 템플릿의 치환 자리가 남았다 {left} — "
                 f"load_style 이 그 이름을 안 준다")
    return html


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon", type=Path, default=CANON)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not args.canon.is_file():
        sys.exit(f"build_screens: 정본 없음 {args.canon}")
    if not TEMPLATE.is_file():
        sys.exit(f"build_screens: 템플릿 없음 {TEMPLATE}")

    canon = load_canon(args.canon)
    # 렌더를 먼저 한다. 치환 자리가 남으면 여기서 죽고, 그때 출력 디렉터리에 반쪽
    # 빌드(canon.json 만 있고 화면은 없는)가 남지 않는다.
    style = load_style(args.canon)
    html = render(style)
    args.out.mkdir(parents=True, exist_ok=True)

    # 정적 화면 계약을 별 파일로. A3 에서 이 자리가 export JSON 으로 바뀐다.
    (args.out / "canon.json").write_text(
        json.dumps(canon, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8")
    target = args.out / "employer.html"
    target.write_text(html, encoding="utf-8")

    if not args.quiet:
        # `relative_to` 는 out 이 저장소 밖이면 던진다. 그 시점에는 파일을 이미 다 썼고,
        # 성공한 빌드가 진행 보고를 하다 죽는다. 저장소 밖 경로는 그대로 적는다.
        shown = target.relative_to(ROOT) if target.is_relative_to(ROOT) else target
        print(f"build_screens: {shown} + canon.json — "
              f"fetch 값 {len(canon)}개 (min_cell={canon['min_cell']}, "
              f"카드 {len(canon['cards'])}개, scenarios={len(canon['scenarios'])}), "
              f"치환 값 {len(style)}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
