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
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANON = ROOT / "contracts/proposal-package-v11.yml"
OUT = ROOT / "build"
TEMPLATE = ROOT / "screens/employer.html.in"


def load_canon(path):
    """정본에서 화면이 쓰는 값만 꺼낸다.

    없으면 조용히 기본값을 쓰지 않고 죽는다. 기본값은 정본이 거짓이 되는 경로다.
    """
    import yaml
    doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    dash = doc["dashboard"]
    kpi = {k["const"]: k["value"] for k in dash["kpis"] if k.get("const")}
    # 화면이 **읽는 것만** 넣는다. 첫 판은 14개를 스테이징했고 화면은 7개만 그렸다 —
    # 나머지 일곱(valid·gap·closed·signals)은 Signals·Funnel 탭 것이고 그 탭이 없다.
    # 안 쓰는 값을 계약에 두면 썩는다: 정본이 바뀌어도 아무도 모르고, 검사도 그 값이
    # 화면에 도달했는지 확인할 방법이 없다. 탭이 서면 그때 같이 넣는다.
    #
    # 신선도 넷은 남긴다. 결정 기록이 `PROJECT_PHASE=demo` 동안 신선도를 정본 소유로
    # 명시했고, 아래 컨텍스트 바가 그 넷을 그린다.
    return {
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
    }


def render():
    """템플릿을 그대로 낸다. 값은 여기 안 들어간다.

    첫 판은 정본 JSON 을 `<script type="application/json">` 블록으로 HTML 안에
    박았다. **결정 기록(#37, 정본 `decided.REBUILD-FRAMEWORK`)이 다른 모양을
    지정한다** — `canon.json` 을 같은 출력 디렉터리에 **별 파일**로 놓고 화면이
    그것을 읽는다.

    그 모양이 나은 이유는 A3 다. 전환하면 측정값이 기업별 export JSON 으로 가고
    화면은 같은 자리에서 다른 파일을 읽는다. 값이 HTML 안에 박혀 있으면 그때
    템플릿을 다시 손봐야 한다.

    대가는 하나. 화면이 `fetch` 를 쓰므로 `file://` 로 못 열고 HTTP 가 필요하다.
    `app.html` 이 이미 그랬고 `scripts/serve.sh` 가 있다.
    """
    return TEMPLATE.read_text(encoding="utf-8")


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
    args.out.mkdir(parents=True, exist_ok=True)

    # 정적 화면 계약을 별 파일로. A3 에서 이 자리가 export JSON 으로 바뀐다.
    (args.out / "canon.json").write_text(
        json.dumps(canon, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8")
    target = args.out / "employer.html"
    target.write_text(render(), encoding="utf-8")

    if not args.quiet:
        print(f"build_screens: {target.relative_to(ROOT)} + canon.json — "
              f"정본 값 {len(canon)}개 (min_cell={canon['min_cell']}, "
              f"scenarios={len(canon['scenarios'])})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
