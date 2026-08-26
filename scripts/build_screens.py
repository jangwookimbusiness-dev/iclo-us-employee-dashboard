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
import html
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
    return {
        "min_cell": dash["constants"]["min_cell"],
        "dep_ratio": dash["constants"]["dep_ratio"],
        "eligibility_thru": dash["constants"]["eligibility_thru"],
        "claims_thru": dash["constants"]["claims_thru"],
        "lag_days": dash["constants"]["lag_days"],
        "completeness_pct": dash["constants"]["completeness_pct"],
        "activated": kpi["FRAC.activated"],
        "valid": kpi["FRAC.valid"],
        "gap": kpi["FRAC.gap"],
        "closed": kpi["FRAC.closed"],
        "repeat": dash["repeat_participation"]["value"],
        "repeat_denominator": dash["metric_time_contracts"]["repeat_participation"]["denominator"],
        "scenarios": [
            {"key": s["key"], "label": s["label"],
             "employees": s["employees"], "pmpm": s["pmpm"]}
            for s in dash["scenarios"]
        ],
        "signals": [{"key": s["key"], "share": s["share"]} for s in dash["signals"]],
    }


def render(canon):
    """정본 값을 하나의 JSON 블록으로 만들어 템플릿에 넣는다.

    값을 HTML 본문에 문자열로 흩뿌리지 않는다. 한 블록으로 주면 화면 코드가 그것을
    읽고, 변조 검사가 산출물에서 값을 찾을 자리도 한 곳이다. 그리고 정본 문자열이
    HTML 문맥에 들어가므로 `json.dumps` 로 직렬화한 뒤 `<` 를 이스케이프한다 —
    `</script>` 가 정본 산문에 들어오면 스크립트가 끊긴다.
    """
    blob = json.dumps(canon, ensure_ascii=False, indent=2, sort_keys=True)
    blob = blob.replace("<", "\\u003c")          # </script> 차단
    tpl = TEMPLATE.read_text(encoding="utf-8")
    if "{{CANON}}" not in tpl:
        sys.exit(f"build_screens: {TEMPLATE} 에 {{{{CANON}}}} 자리가 없다")
    out = tpl.replace("{{CANON}}", blob)
    # 사람이 읽는 자리 하나. 억제 임계는 규제 문구이므로 화면 산문에도 나와야 하고,
    # 그것도 정본에서 온다.
    return out.replace("{{MIN_CELL}}", html.escape(str(canon["min_cell"])))


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
    target = args.out / "employer.html"
    target.write_text(render(canon), encoding="utf-8")

    if not args.quiet:
        print(f"build_screens: {target.relative_to(ROOT)} — 정본 값 "
              f"{len(canon)}개 (min_cell={canon['min_cell']}, "
              f"scenarios={len(canon['scenarios'])})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
