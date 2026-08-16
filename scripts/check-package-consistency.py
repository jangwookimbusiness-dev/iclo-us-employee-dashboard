#!/usr/bin/env python3
"""제안 패키지 6종이 contracts/proposal-package-v11.yml 과 어긋나는지 검사한다.

CI 가 아니라 빌드 끝단에서 돈다 (비공개 저장소 Actions 한도).
exit 0 = 일치, exit 1 = 불일치.

  python3 scripts/check-package-consistency.py           # 전체
  python3 scripts/check-package-consistency.py --no-pdf  # PDF 건너뛰기 (빠름)
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTRACT = ROOT / "contracts/proposal-package-v11.yml"
fails, warns = [], []


def fail(check, detail):
    fails.append((check, detail))


def warn(check, detail):
    warns.append((check, detail))


def check_contract_parses():
    """정본이 YAML 로서 성립하는지 본다.

    load_contract() 는 정규식이라 파일이 YAML 로 깨져 있어도 통과한다. 실제로
    그랬다 — build_in_90_days 와 does_not_exist 가 시퀀스 뒤에 같은 들여쓰기로
    note: 를 붙이고 있었고, 항목 하나는 따옴표 없는 스칼라 안에 ': ' 를 담고
    있었다. 셋 다 PyYAML 에서 에러다. 검사기는 계속 초록불이었다.

    ponytail: PyYAML 을 필수 의존성으로 만들지 않는다. 있으면 검증하고 없으면
    건너뛴다 — 이 검사가 있어서 무의존성이 깨지면 목적과 수단이 뒤바뀐다.
    """
    try:
        import yaml
    except ImportError:
        warns.append(("contract_yaml", "PyYAML 없음 — 정본 파싱 검증을 건너뜀"))
        return
    try:
        doc = yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        mark = getattr(e, "problem_mark", None)
        where = f" ({mark.line + 1}행 {mark.column + 1}열)" if mark else ""
        fails.append(("contract_yaml",
                      f"정본이 YAML 로 파싱되지 않음{where}: {getattr(e, 'problem', e)}"))
        return

    # 파싱되는 것과 의도대로 파싱되는 것은 다르다. 산문 항목 안의 따옴표 없는
    # ': ' 는 에러가 아니라 그 줄을 통째로 매핑으로 바꾼다 — 조용히, 초록불로.
    # 2026-08-16 에 status.does_not_exist 의 첫 항목이 그 상태였다. "없는 것은
    # 그 뒤의 전부다: 인증·백엔드" 가 키 하나짜리 dict 이 되어 있었고, 목록을
    # 읽는 쪽은 전부 문자열을 기대한다. 위 검사는 통과시켰다.
    def scan(node, path):
        if isinstance(node, dict):
            for k, v in node.items():
                scan(v, f"{path}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                if isinstance(v, dict) and len(v) == 1 and len(str(next(iter(v)))) > 40:
                    fails.append(("contract_yaml",
                                  f"{path}[{i}] 이 문자열이 아니라 매핑으로 파싱됐다 — "
                                  f"따옴표 없는 ': ' 로 보인다: {str(next(iter(v)))[:50]}…"))
                scan(v, f"{path}[{i}]")

    scan(doc, "")


def check_awaiting_decision():
    """결정 대기 목록의 각 항목이 실제로 아직 대기 중인가.

    목록만 두면 그 목록이 낡는다. 이 파일이 방금 그랬다 — SYNC-07·09 가 이미
    고쳐졌는데 몇 달째 "미해결" 로 올라와 있었고, 남은 일을 물었을 때 없는 일이
    섞여 나왔다.

    그래서 항목마다 marker 를 요구한다. marker 는 그 문서가 "나 아직 미결이다"
    라고 말하는 문자열이다. 결정이 나면 문서에서 초안 표시를 지우게 되고, 그러면
    이 검사가 깨지면서 목록도 같이 닫으라고 말한다. 결정이 안 났는데 문서에서
    표시만 사라진 경우도 같은 신호다 — 그쪽이 더 위험하다.

    ponytail: 정규식으로 읽는다. PyYAML 이 있으면 그걸 쓰겠지만 이 파일의 다른
    부분이 이미 무의존성 파서로 돌고 있어 한쪽만 의존성을 늘리지 않는다.
    """
    t = CONTRACT.read_text(encoding="utf-8")
    m = re.search(r"^awaiting_decision:$(.*?)(?=^#|^\w)", t, re.S | re.M)
    if not m:
        return warn("awaiting", "정본에 awaiting_decision 블록이 없음")

    entries = re.findall(
        r"- id:\s*(\S+).*?where:\s*(\S+).*?marker:\s*(.+?)\n", m.group(1), re.S)
    if not entries:
        return fail("awaiting", "awaiting_decision 이 비어 있거나 파싱되지 않음")

    for eid, where, marker in entries:
        marker = marker.strip().strip("'\"")
        f = ROOT / where
        if not f.exists():
            fail("awaiting", f"{eid}: 가리키는 {where} 가 없음")
            continue
        if marker not in f.read_text(encoding="utf-8"):
            fail("awaiting",
                 f'{eid}: {where} 에 "{marker}" 가 없다. 결정이 났다면 '
                 f"awaiting_decision 에서 닫고, 안 났다면 문서의 미결 표시가 사라진 것이다")
    print(f"결정 대기 {len(entries)}건 — 전부 해당 문서에서 미결 상태 확인")


def check_surfaces():
    """정본 surfaces 가 가리키는 파일이 실제로 있는가.

    2026-08-14 에 employee_app 이 추가되면서 정본이 처음으로 실행물 경로를
    이름으로 들게 됐다. 파일을 옮기거나 이름을 바꾸면 정본이 조용히 거짓이
    되고, 그걸 알려줄 것이 여기밖에 없다.
    """
    t = CONTRACT.read_text(encoding="utf-8")
    m = re.search(r"^surfaces:$(.*?)^\w", t, re.S | re.M)
    if not m:
        warns.append(("surfaces", "정본에 surfaces 블록이 없음"))
        return
    for path in re.findall(r"^\s+file:\s*(\S+)", m.group(1), re.M):
        if not (ROOT / path).exists():
            fail("surfaces", f"정본이 가리키는 {path} 가 없음")


def load_contract():
    """PyYAML 없이 도는 최소 파서 — 이 파일이 쓰는 값만 정규식으로 뽑는다.
    ponytail: 의존성 추가 대신 정규식. 계약 구조가 복잡해지면 PyYAML 로 간다."""
    t = CONTRACT.read_text(encoding="utf-8")
    c = {}
    c["min_cell"] = int(re.search(r"min_cell:\s*(\d+)", t).group(1))
    c["dep_ratio"] = float(re.search(r"dep_ratio:\s*([\d.]+)", t).group(1))
    c["lag_days"] = int(re.search(r"lag_days:\s*(\d+)", t).group(1))
    c["completeness"] = float(re.search(r"completeness_pct:\s*([\d.]+)", t).group(1))
    c["coral"] = re.search(r'coral:\s*"(#[0-9A-Fa-f]{6})"', t).group(1)
    c["coral_dark"] = re.search(r'coral_dark_mode:\s*"(#[0-9A-Fa-f]{6})"', t).group(1)
    c["headings"] = re.findall(r"heading:\s*(.+)", t)
    c["kpis"] = [m.strip() for m in re.findall(r"- label:\s*(.+)", t)]
    c["signals"] = [(k, int(v)) for k, v in re.findall(r"\{key:\s*(\w+),\s*share:\s*(\d+)\}", t)]
    c["scenarios"] = [(int(e), float(p)) for e, p in
                      re.findall(r"employees:\s*(\d+),\s*pmpm:\s*([\d.]+)", t)]
    c["fracs"] = dict(zip(
        [m.strip() for m in re.findall(r"const:\s*FRAC\.(\w+)", t)],
        [float(m) for m in re.findall(r"const:\s*FRAC\.\w+\n\s*value:\s*([\d.]+)", t)]))
    c["scoped"] = re.findall(r'- wrong:\s*"([^"]+)"\n\s*right:\s*"([^"]+)"', t)
    c["forbidden"] = re.findall(r'\{wrong:\s*"([^"]+)",\s*right:\s*"([^"]+)"', t)
    c["disease"] = re.search(r"disease_words_banned:.*?\n\s*\[([^\]]+)\]", t, re.S).group(1)
    c["disease"] = [w.strip() for w in c["disease"].split(",")]
    sup = re.search(r"^superseded:$(.*?)(?:^\w|\Z)", t, re.S | re.M)
    c["superseded"] = set(re.findall(r"artifacts:\s*\[([^\]]+)\]", sup.group(1))[0].split(", ")) \
        if sup and re.findall(r"artifacts:\s*\[([^\]]+)\]", sup.group(1)) else set()
    g = re.search(r"^start_gates:$(.*?)^\w", t, re.S | re.M).group(1)
    c["gates_ko"] = [x.strip() for x in re.findall(r"^\s+ko:\s*(.+)$", g, re.M)]
    c["gates_en"] = [x.strip() for x in re.findall(r"^\s+en:\s*(.+)$", g, re.M)]
    return c


# ─────────────────────────── 대시보드 ───────────────────────────
def check_dashboard(c):
    p = ROOT / "index.html"
    if not p.exists():
        return fail("dashboard", "index.html 없음")
    h = p.read_text(encoding="utf-8")

    def const(name, cast=float):
        m = re.search(rf"{name}\s*[:=]\s*([\d.]+)", h)
        return cast(m.group(1)) if m else None

    if const("MIN_CELL", int) != c["min_cell"]:
        fail("min_cell", f"index.html={const('MIN_CELL', int)} 계약={c['min_cell']}")
    if const("DEP_RATIO") != c["dep_ratio"]:
        fail("dep_ratio", f"index.html={const('DEP_RATIO')} 계약={c['dep_ratio']}")
    if const("lagDays", int) != c["lag_days"]:
        fail("lag_days", f"index.html={const('lagDays', int)} 계약={c['lag_days']}")
    if const("completenessPct") != c["completeness"]:
        fail("completeness", f"index.html={const('completenessPct')} 계약={c['completeness']}")

    # 화면 제목 · KPI 라벨
    for hd in c["headings"]:
        if hd not in h:
            fail("heading", f'"{hd}" 가 index.html 에 없음')
    for k in c["kpis"]:
        if k not in h:
            fail("kpi", f'"{k}" 가 index.html 에 없음')

    # 신호 밴드
    for key, share in c["signals"]:
        if not re.search(rf'key:\s*"{key}",\s*share:\s*{share}\b', h):
            fail("signal", f"{key} {share}% 가 index.html 과 다름")


    # 시나리오
    for emp, pmpm in c["scenarios"]:
        if not re.search(rf"employees:\s*{emp}\s*,\s*pmpm:\s*{pmpm}\b", h):
            fail("scenario", f"{emp}명/PMPM {pmpm} 조합이 index.html 에 없음")

    # FRAC
    for name, v in c["fracs"].items():
        if not re.search(rf"{name}\s*:\s*{v}\b", h):
            fail("frac", f"FRAC.{name}={v} 가 index.html 과 다름")

    # coral: 라이트 계열 정의가 전부 같은 값이어야 한다
    lights = [m for m in re.findall(r"--coral\s*:\s*(#[0-9A-Fa-f]{6})", h)
              if m.upper() != c["coral_dark"].upper()]
    if set(x.upper() for x in lights) != {c["coral"].upper()}:
        fail("coral", f"라이트 coral 이 {sorted(set(lights))} — 계약은 {c['coral']} 하나여야 함. "
                      f"테마 토글로 다른 색이 나온다.")

    # 범위 없는 절대 표현
    for wrong, right in c["scoped"]:
        for m in re.finditer(re.escape(wrong), h):
            line = h[:m.start()].count("\n") + 1
            ctx = h[m.start():m.start() + len(right) + 20]
            if not ctx.startswith(right):
                fail("scoped_claim", f'index.html:{line} "{wrong}" → "{right}" 로 범위를 좁혀야 함')

    # 금지어
    for w in c["disease"]:
        if re.search(rf"\b{w}\w*", h, re.I):
            fail("disease_word", f'index.html 에 금지어 "{w}"')

    # 금지 용어 — 문서뿐 아니라 화면에도 건다. 여기에는 2026-08-16 까지
    # "원천 칩은 원천 시스템과 파일 형식을 나란히 적은 것이라 예외" 라는 면제가
    # 적혀 있었다. 검사가 못 본 게 아니라 보고도 넘기라고 쓰여 있었던 것이고,
    # 그 덕에 화면과 제안서 캡처가 금지어를 달고 나갔다. 면제를 지운다.
    # 구두점을 접어서 보는 이유도 같다 — 가운뎃점 하나로 피해갈 수 있으면
    # 그건 검사가 아니라 권고다.
    def squash(s):
        return re.sub(r"[\s·\-–—/|,]+", "", s)

    for path in ("index.html", "app.html"):
        f = ROOT / path
        if not f.exists():
            fail("screen_missing", f"{path} 없음")
            continue
        flat = squash(f.read_text(encoding="utf-8"))
        for wrong, right in c["forbidden"]:
            if squash(wrong) in flat:
                fail("terminology", f'{path}: 금지어 "{wrong}" → "{right}"')

    # 합성 데이터 표시
    if "Synthetic data" not in h:
        fail("synthetic_label", "index.html 에 'Synthetic data' 표시 없음")


# ─────────────────────────── 문서 ───────────────────────────
def doc_text(p: Path, use_pdf: bool):
    if p.suffix == ".md":
        return p.read_text(encoding="utf-8")
    if p.suffix == ".pdf" and use_pdf:
        try:
            import fitz
            d = fitz.open(p)
            return "\n".join(d[i].get_text() for i in range(d.page_count))
        except Exception as e:
            warn("pdf", f"{p.name} 읽기 실패: {e}")
    return None


def check_docs(c, use_pdf):
    base = ROOT / "output/proposal-v10"
    targets = {
        "report_ko": base / "01_KO_Internal/ICLO-Snowflake-Joint-Validation-Report-v10-KO-Internal.pdf",
        "report_en": base / "02_EN_External/ICLO-Snowflake-Joint-Validation-Report-v10-EN-External.pdf",
        "proposal_ko": base / "01_KO_Internal/ICLO-Snowflake-Joint-Validation-Proposal-v10-KO-Internal.pdf",
        "proposal_en": base / "02_EN_External/ICLO-Snowflake-Joint-Validation-Proposal-v10-EN-External-Notes-Stripped.pdf",
        "tech": base / "06_Tech/ICLO-Evidence-Layer-DB-설계-KO.md",
    }
    # v11 초안. BRIEF 8절이 이 검사를 통과 조건으로 걸고 있으므로 대상에 넣는다.
    # 아직 초안 단계라 파일이 없을 수 있고, 그때는 missing 경고만 난다.
    v11 = ROOT / "proposal-v11"
    for label, rel in [
        ("v11_v1_proposal_ko", "v1-claude-main/제안서-본문-KO.md"),
        ("v11_v1_deck_ko",     "v1-claude-main/제안서-데크-KO.md"),
        ("v11_v2_proposal_ko", "v2-codex-main/제안서-본문-KO.md"),
        ("v11_v2_deck_ko",     "v2-codex-main/제안서-데크-KO.md"),
    ]:
        if (v11 / rel).exists():
            targets[label] = v11 / rel

    # v12. 2026-08-16 까지 이 검사는 v10 과 일부 v11 만 봤고, 정작 밖으로 나갈
    # 문서인 v12 를 안 봤다. 그런데 v12 부록이 "자동 검사가 어긋남을 잡는다" 고
    # 썼다 — 자기 자신에 대해 거짓인 문장이었다. 실제로 v12 는 정본이 금지한
    # "HRIS 834" 를 쓰고 있었고 검사는 통과했다.
    v12 = ROOT / "output/proposal-v12/제안서-v12-KO.md"
    if v12.exists():
        targets["proposal_v12_ko"] = v12

    # PRD. 2026-08-16 까지 이 검사는 PRD 를 한 번도 열지 않았고, 그 사이 PRD §2.1 은
    # 임직원이 "자기 점수" 와 "남은 한도" 를 읽는다고 계속 쓰고 있었다. 둘 다 그날
    # 앱에서 빠졌고 빠진 이유가 규제와 사용자 피해다. 스펙이 없어진 제품을 설명하면
    # 그건 스펙이 아니다.
    prd = ROOT / "employer-dashboard-poc/docs/PRD.md"
    if prd.exists():
        targets["prd"] = prd

    checked, skipped = 0, []
    for name, p in targets.items():
        if not p.exists():
            warn("missing", f"{name}: {p.name} 없음")
            continue
        t = doc_text(p, use_pdf)
        if t is None:
            continue
        checked += 1
        # PDF 는 줄바꿈으로 단어가 쪼개지므로 공백을 접어서 검사
        flat = re.sub(r"\s+", "", t)

        # 금지 용어. 다만 **따옴표 안에 든 것은 인용이지 사용이 아니다.**
        # 규칙을 적는 문서는 금지어를 이름으로 불러야 한다 — PRD 의 레드라인 표가
        # `signal label "Review" banned (use "Priority")` 라고 쓰는 것이 그것이고,
        # 정정 노트가 `"read their own score" 라고 썼었다` 고 쓰는 것도 그것이다.
        # 이걸 위반으로 세면 규칙을 문서화할 방법이 없어지고, 그러면 사람들이
        # 검사를 끈다. 실제 사용은 따옴표 없이 문장 안에 놓인다 — v12 가 §5 에서
        # "원천(HRIS 834 · TPA …)" 이라고 쓴 것이 그 형태였다.
        raw = t
        for wrong, right in c["forbidden"]:
            used = False
            for m in re.finditer(re.escape(wrong), raw):
                before = raw[max(0, m.start() - 1):m.start()]
                after = raw[m.end():m.end() + 1]
                if before in ('"', "`", "'") and after in ('"', "`", "'"):
                    continue        # 인용
                used = True
            if used or (re.sub(r"\s+", "", wrong) in flat
                        and not re.search(r'["`\']' + re.escape(wrong) + r'["`\']', raw)):
                fail("terminology", f'{name}: 금지어 "{wrong}" → "{right}"')

        # 발송된 판은 저작 요건 검사에서 뺀다. 이미 상대 손에 있는 문서를 지금
        # 고치면 받은 쪽 사본과 저장소가 달라진다. 다만 조용히 빼지는 않는다 —
        # 몇 건을 왜 건너뛰었는지 매번 출력한다. 경고가 상시로 켜져 있으면
        # 다음에 진짜 경고가 떠도 안 보이고, 조용히 빼면 뺀 사실이 잊힌다.
        if name in c["superseded"]:
            skipped.append(name)
            continue

        # 착수 게이트 노출 (대외 문서에서 빠지면 다 만들어진 제품처럼 읽힌다)
        gates = c["gates_ko"] if name.endswith("_ko") or name == "tech" else c["gates_en"]
        missing = [g for g in gates if re.sub(r"\s+", "", g) not in flat]
        if missing and name not in ("tech", "prd"):   # 둘 다 대내 문서다
            sev = fail if name.startswith("report") else warn
            sev("start_gates", f"{name}: 착수 게이트 미노출 — {', '.join(missing)}")

        # 상태 고지 (무엇이 아직 없는가)
        if name.startswith("report"):
            marker = "아직없는것" if name.endswith("_ko") else "Doesnotexist"
            if marker not in flat:
                fail("status", f"{name}: '현재 상태' 표가 없음")

        # 대시보드 화면 이름 대응
        if name.startswith(("report", "proposal")):
            if not any(re.sub(r"\s+", "", hd) in flat for hd in c["headings"]):
                warn("screen_names", f"{name}: 대시보드 화면 이름이 하나도 안 나옴 (SYNC-06)")

    # 한 건도 못 읽었으면 "위반 없음" 이 아니라 검사가 안 돈 것이다. 이 저장소가
    # 조용히 죽은 검사를 세 번 겪은 이유가 정확히 이 구별을 안 한 것이었다.
    if checked == 0:
        fail("no_docs", "문서를 한 건도 읽지 못했다 — 경로가 바뀌었거나 pdftotext 가 없다")
    else:
        note = f" · 발송분 {len(skipped)}건 건너뜀 ({', '.join(skipped)})" if skipped else ""
        print(f"문서 {checked}건 검사{note}")

    # Report 와 Proposal 의 머리글이 같으면 받는 쪽이 구분할 수 없다
    b = ROOT / "tmp/iclo-snowflake-proposal-v10/build_reports_v10.py"
    if b.exists() and 'else "JOINT VALIDATION PROPOSAL"' in b.read_text(encoding="utf-8"):
        fail("header", "build_reports_v10.py: Report 의 머리글이 'JOINT VALIDATION PROPOSAL' — "
                       "Proposal 덱과 구분되지 않는다")


def main():
    use_pdf = "--no-pdf" not in sys.argv
    if not CONTRACT.exists():
        print(f"정본 없음: {CONTRACT}")
        return 1
    check_contract_parses()
    check_surfaces()
    check_awaiting_decision()
    c = load_contract()
    check_dashboard(c)
    check_docs(c, use_pdf)

    for label, items, mark in (("불일치", fails, "✗"), ("경고", warns, "!")):
        if items:
            print(f"\n{label} {len(items)}건")
            for chk, d in items:
                print(f"  {mark} [{chk}] {d}")
    if not fails and not warns:
        print("일치 — 6종이 정본과 어긋나지 않음")
    elif not fails:
        print(f"\n불일치 없음 (경고 {len(warns)}건)")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
