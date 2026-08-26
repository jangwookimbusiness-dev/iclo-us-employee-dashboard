#!/usr/bin/env python3
"""정본을 변조하고 빌더를 돌려, 새 값이 산출물에 도달하고 옛 값이 없는지 본다.

헌장 §4.2 의 둘째 요구다. 첫 판 헌장은 빌드 시점 정본 읽기가 `test_single_source` 를
불필요하게 만든다고 썼고, **codex 가 뒤집었으며 맞다.** 그 검사는 정본↔소스 일치를 보는
것이 아니라 리터럴을 **변조하고 렌더해서** 값이 화면에 도달했는지 본다. 빌드 시점 읽기는
손으로 옮기는 단계만 없앤다 — 템플릿·라벨·다른 컴포넌트가 옛 값을 품는 것은 그대로
가능하다.

그래서 검사를 없애지 않고 **경계를 옮겼다.** 헌 검사는 `index.html` 의 리터럴을 고치고
Chrome 을 띄웠다. 이 검사는 정본을 고치고 빌더를 돌린다. 브라우저가 필요 없다 —
정본에서 산출물까지가 검사 대상이고 그 구간에 렌더링이 없다.

무엇을 못 잡는가. 산출물이 값을 **담고 있다**는 것까지만 본다. 그 값이 화면에 실제로
그려지는지는 안 본다. 그건 렌더 검사의 일이고 화면이 실물이 되면 그때 붙인다. 지금
없는 것을 있는 척하지 않는다.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BUILDER = ROOT / "scripts/build_screens.py"
CANON = ROOT / "contracts/proposal-package-v11.yml"

# (정본 안의 정규식, 바꿀 값, 원래 값). 화면이 실제로 읽는 값만 고른다 —
# 읽지 않는 값을 변조하면 "산출물에 없다" 가 당연해서 아무것도 확인하지 않는다.
# 정본 행은 끝에 주석을 달고 있다 (`min_cell: 20   # 기업 화면 최소 셀 ...`), 그래서
# `$` 로 앵커하면 안 맞는다. 키와 값만 잡고 그 뒤는 건드리지 않는다.
CASES = [
    ("min_cell",  r"^(\s*min_cell:\s+)20\b",   r"\g<1>37",   "20",   "37"),
    ("dep_ratio", r"^(\s*dep_ratio:\s+)2\.2\b", r"\g<1>4.9",  "2.2",  "4.9"),
    ("activated", r"^(\s*value:\s+)0\.38\b",    r"\g<1>0.77", "0.38", "0.77"),
]


def build(canon_path, out_dir):
    r = subprocess.run(
        [sys.executable, str(BUILDER), "--canon", str(canon_path),
         "--out", str(out_dir), "--quiet"],
        capture_output=True, text=True, cwd=ROOT)
    return r


def canon_values(html):
    """산출물의 CANON 블록을 다시 파싱한다. 문자열 검색이 아니라 구조로 본다."""
    m = re.search(r'<script id="canon" type="application/json">(.*?)</script>',
                  html, re.S)
    if not m:
        return None
    return json.loads(m.group(1).replace("\\u003c", "<"))


def main():
    for path, label in ((BUILDER, "빌더"), (CANON, "정본")):
        if not path.is_file():
            print(f"FAIL — {label} 없음: {path}")
            return 1

    original = CANON.read_text(encoding="utf-8")
    checked = 0
    fails = []

    with tempfile.TemporaryDirectory(prefix="build-canon-") as tmp:
        tmp = Path(tmp)

        # 기준선. 변조 전에 빌드가 되는지부터.
        base = build(CANON, tmp / "base")
        if base.returncode != 0:
            print(f"FAIL — 변조 없이도 빌드가 실패한다\n{base.stdout}{base.stderr}")
            return 1
        base_html = (tmp / "base/employer.html").read_text(encoding="utf-8")
        if canon_values(base_html) is None:
            print("FAIL — 산출물에 CANON 블록이 없거나 JSON 이 아니다")
            return 1
        checked += 1

        for name, pattern, repl, old, new in CASES:
            mutated, n = re.subn(pattern, repl, original, count=1, flags=re.M)
            if n != 1:
                fails.append(f"{name}: 정본에서 변조 지점을 못 찾았다 ({pattern!r}) — "
                             f"정본 구조가 바뀌었고 이 검사가 낡았다")
                continue

            mcanon = tmp / f"canon-{name}.yml"
            mcanon.write_text(mutated, encoding="utf-8")
            r = build(mcanon, tmp / name)
            if r.returncode != 0:
                fails.append(f"{name}: 변조한 정본으로 빌드가 실패했다: "
                             f"{(r.stdout + r.stderr).strip()[:200]}")
                continue

            out = (tmp / name / "employer.html").read_text(encoding="utf-8")
            vals = canon_values(out)
            if vals is None:
                fails.append(f"{name}: 산출물의 CANON 블록을 파싱할 수 없다")
                continue

            # 새 값이 도달했는가. 구조에서 꺼내 비교한다 — 문자열 검색이면
            # 우연히 다른 자리에 있는 같은 숫자를 세게 된다.
            got = vals.get(name if name != "activated" else "activated")
            if str(got) != new:
                fails.append(f"{name}: 정본을 {old} → {new} 로 고쳤는데 산출물이 "
                             f"{got!r} 이다. 빌드가 정본을 안 읽는다")
            checked += 1

            # 옛 값이 남지 않았는가. 여기서만 문자열을 본다 — 템플릿이나 라벨이
            # 옛 값을 품고 있으면 위 구조 검사는 통과하고 이것이 잡는다.
            #
            # 경계를 문자까지 넓힌다. 첫 판은 `(?<![\d.])20(?![\d.])` 였고 CSS 의
            # `font-size:20px` 를 옛 값으로 셌다. **언제나 실패하는 검사는 곧 꺼지므로**
            # 오탐이 미탐보다 위험하다. 앞뒤에 문자·숫자·점이 붙으면 그 값이 아니다 —
            # 20px 도, 2026-07 의 20 도, 31.40 의 일부도 걸러진다.
            stale = re.findall(rf"(?<![\w.]){re.escape(old)}(?![\w.])", out)
            if stale:
                fails.append(f"{name}: 정본을 {new} 로 고쳤는데 산출물에 옛 값 "
                             f"{old} 이 {len(stale)}번 남아 있다 — 템플릿이나 "
                             f"라벨이 손으로 적힌 값을 품고 있다")
            checked += 1

    CANON.write_text(original, encoding="utf-8")   # 변조는 임시 파일에만 했지만 방어

    if not checked:
        print("FAIL — 아무것도 검사하지 않았다")
        return 1
    if fails:
        print(f"FAIL — 검사 {checked}건 중 {len(fails)}건 실패")
        for f in fails:
            print(f"  ✗ {f}")
        return 1
    print(f"PASS — 검사 {checked}건. 정본 값 {len(CASES)}개를 변조했을 때 산출물이 "
          f"따라 움직이고 옛 값이 남지 않는다")
    return 0


if __name__ == "__main__":
    sys.exit(main())
