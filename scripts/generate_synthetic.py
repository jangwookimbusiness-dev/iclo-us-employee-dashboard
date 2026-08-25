#!/usr/bin/env python3
"""3사 합성 데이터 생성기 — 기술문서 §14 사양.

왜 이 파일이 있는가. 데모 화면은 비율 상수로 숫자를 만들기 때문에 억제·매칭·지연을
진짜로 보여줄 수 없다 (§14.1). 개인 레벨 36개월을 만들어 `RAW_*` 에 넣고 실제
파이프라인을 태우면 데모가 화면 흉내가 아니라 시스템의 축소판이 된다.

무엇을 정본에서 읽는가. 시나리오 규모·DEP_RATIO·최소 셀·참여율·신호 분포는 전부
`contracts/proposal-package-v11.yml` 에서 읽는다. 이 파일은 그 값을 다시 적지 않는다.
두 곳에 적으면 한 곳만 고치는 날이 온다.

무엇을 이 파일이 정하는가. §14 가 산문으로만 준 것들 — 이직률 범위, 청구 지연 분포,
매칭 실패율, 부서 가중치, 촬영 품질 통과율. 전부 아래 SPEC 한 곳에 모여 있고
`params.json` 으로 출력돼 재현 기록이 된다 (§14.6).

**이 생성기는 정합성 게이트가 아니다.** 생성기를 정본 상수에 맞춰 보정하면 잘못된
SQL 을 생성기 조정으로 상쇄할 수 있다 — 변환이 분모를 두 배로 부풀려도 생성기
파라미터를 반으로 줄이면 최종 숫자는 맞는다. 파이프라인 정합성은 `fixtures/01~07.yml`
의 손 계산 기대값이 잡고 `test_fixtures.py` 가 입력에서 재계산한다. 이 생성기가
맞추는 것은 스크린샷용 규모감뿐이다.

그래서 창발 지표를 두 등급으로 나눠 검사한다. 직접 배정하는 activated·repeat 는
어긋나면 실패다 (§14.3 이 화면 상수에서 역산한 값이므로). 파이프라인을 타고 나오는
valid·gap·closed 는 어긋나면 경고이고 델타를 찍는다 — 여기서 조용히 맞추면 위의
함정에 그대로 빠진다.

사용법:
  python3 scripts/generate_synthetic.py              # 3사 36개월 · 약 297만 행
  python3 scripts/generate_synthetic.py --months 3   # 빠른 확인
  python3 scripts/generate_synthetic.py --check      # 생성 없이 자체 검사만
"""
import argparse
import csv
import hashlib
import json
import math
import random
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTRACT = ROOT / "contracts/proposal-package-v11.yml"
OUTDIR = ROOT / ".synthetic"                       # .gitignore — 약 450MB
MANIFEST = ROOT / "scripts/synthetic-manifest.json"  # git — 재현 증거는 작다

# 기술문서 §14 가 산문으로 준 값들. 정본에 없는 것만 여기 있다.
SPEC = {
    "seed": 20260825,
    "months": 36,                       # §14.2
    "first_month": "2023-08",           # 36개월이 정본 eligibility_thru 2026-07 에서 끝나도록
    "annual_turnover": {"A": 0.18, "B": 0.28, "C": 0.12},   # §14.2 연 12~28%, 기업별로 다름
    "dependents_weights": [0.34, 0.30, 0.22, 0.10, 0.04],   # 0~4명, 평균 1.20 → DEP_RATIO 2.2
    "department_weights": {             # §14 에 없다. index.html DEPTS 에서 옮겼다
        "Operations": 0.42,
        "Sales": 0.26,
        "Engineering": 0.19,
        "Finance": 0.08,
    },
    # 절대값이고 의도적으로 최소 셀 미만이다. 이 부서의 존재 이유가 그것 하나다 —
    # 생성기가 모르면 억제가 조용히 안 걸리고 데모 당일에 안다 (결정 5).
    "tiny_department": {"name": "Facilities (pilot site)", "n": {"A": 14, "B": 8, "C": 16}},
    "sporadic_regular_ratio": (13, 10),  # §14.3 의 13% : 10%
    "family_participation_factor": 0.55, # §14.3 "가족 참여율이 임직원보다 낮다"
    "regular_interval_days": (90, 30),   # §14.3 평균 90일 · 표준편차 30일
    "sporadic_per_year": (1, 2),         # §14.3 연 1~2회
    # 첫 촬영과 그 이후를 다르게 둔다. §14 에는 없고 정본이 말없이 요구한다 —
    # 화면 퍼널 10,000 → 3,800 활성 → 2,800 유효촬영은 활성 중 1,000명이 쓸 만한
    # 사진을 한 장도 못 만든다는 뜻이다. 2회 이상이 2,318명이므로 정확히 1회는
    # 482명이고, ONE_SHOT 이 1,482명이니 첫 시도 통과율은 482/1482 = 0.325 여야
    # FRAC.valid 0.28 · FRAC.activated 0.38 · FRAC.repeat 0.61 이 동시에 성립한다.
    # 하나를 임의로 잡은 것이 아니라 세 상수가 이 값을 지목한다.
    "first_capture_quality_pass": 0.325,
    "repeat_capture_quality_pass": 0.93,
    "claim_lag_median_days": 45,         # §14.4 중앙값 45일
    "claim_lag_sigma": 0.62,             # 롱테일이 180일에 닿도록
    "claim_lag_cap_days": 180,           # §14.4 롱테일 180일까지
    "baseline_preventive_annual": 0.42,  # 참여 여부와 무관한 기저 예방진료 이용률
    "participant_uplift": 0.08,          # §14.4 "효과 크기를 크게 잡지 않는다"
    "cdt_mix": [("D1110", 0.58), ("D0120", 0.17), ("D2391", 0.14), ("D4341", 0.11)],
    "claim_rewrite_rate": 0.04,          # §14.4 REVERSED / ADJUSTED 체인
    "match_defect_rate": 0.04,           # §14.5 3~5%
}

BANDS = ("Low", "Moderate", "Priority")
MATCH_DEFECTS = ("DOB_TYPO", "RELATIONSHIP_MISMATCH", "SUBSCRIBER_ID_FORMAT")


# ── 정본 읽기 ───────────────────────────────────────────────────────────────

def load_contract():
    """정본에서 생성기가 쓰는 값만 꺼낸다. 없으면 조용히 기본값을 쓰지 않고 죽는다."""
    import yaml
    doc = yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))
    dash = doc["dashboard"]
    kpi = {k["const"]: k["value"] for k in dash["kpis"] if k.get("const")}
    return {
        "scenarios": {s["key"]: s for s in dash["scenarios"]},
        "dep_ratio": dash["constants"]["dep_ratio"],
        "min_cell": dash["constants"]["min_cell"],
        "activated": kpi["FRAC.activated"],
        "valid": kpi["FRAC.valid"],
        "gap": kpi["FRAC.gap"],
        "closed": kpi["FRAC.closed"],
        "repeat": dash["repeat_participation"]["value"],
        "signals": {s["key"]: s["share"] for s in dash["signals"]},
    }


def participation_mix(activated, repeat):
    """§14.3 의 네 유형을 정본 두 값에서 역산한다.

    §14.3: "두 지표가 세 비율을 함께 결정하므로 하나만 바꾸면 다른 하나가 깨진다.
    생성기에서도 NEVER = 1 - FRAC.activated 로 계산해 대시보드 상수와 한 곳에 묶는다."

    Activated  = ONE_SHOT + SPORADIC + REGULAR       (가입 + 첫 문진 / 자격자)
    Repeat     = (SPORADIC + REGULAR) / Activated    (2회 이상 / 활성)
    """
    repeaters = activated * repeat
    a, b = SPEC["sporadic_regular_ratio"]
    return {
        "NEVER": 1.0 - activated,
        "ONE_SHOT": activated - repeaters,
        "SPORADIC": repeaters * a / (a + b),
        "REGULAR": repeaters * b / (a + b),
    }


# ── 부서 100% 분할 ──────────────────────────────────────────────────────────

def department_split(headcount, tiny_n):
    """부서 인원을 headcount 에 **정확히** 맞춰 나눈다.

    왜 이 함수가 필요한가. `index.html` 의 가중치 합이 0.42+0.26+0.19+0.08 = 0.95 라
    5% 가 미할당이었고 (codex 7), Facilities 는 비율이 아니라 절대값이라 그냥 더하면
    부서 합이 전사와 안 맞는다 (결정 13). 나머지를 큰 순서로 한 명씩 배분하는
    최대잉여법을 쓰면 합이 정확히 headcount 가 된다.

    Facilities 는 최소 셀 미만으로 남는다. 억제는 값을 가리는 것이지 부서의 존재를
    숨기는 것이 아니므로, 이 부서는 카탈로그에 그대로 실린다.
    """
    weights = SPEC["department_weights"]
    total_w = sum(weights.values())
    rest = headcount - tiny_n
    if rest <= 0:
        raise ValueError(f"headcount {headcount} 가 tiny {tiny_n} 보다 작다")

    exact = {name: rest * w / total_w for name, w in weights.items()}
    alloc = {name: int(v) for name, v in exact.items()}
    short = rest - sum(alloc.values())
    # 잔여를 소수부 큰 순서로 한 명씩. 동률은 이름순 — 시드와 무관하게 결정적이어야 한다.
    for name in sorted(exact, key=lambda n: (-(exact[n] - alloc[n]), n))[:short]:
        alloc[name] += 1

    alloc[SPEC["tiny_department"]["name"]] = tiny_n
    assert sum(alloc.values()) == headcount, (alloc, headcount)
    return alloc


# ── 달 표기 ─────────────────────────────────────────────────────────────────

def month_seq(first, n):
    y, m = (int(x) for x in first.split("-"))
    out = []
    for _ in range(n):
        out.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            y, m = y + 1, 1
    return out


def month_days(ym):
    y, m = (int(x) for x in ym.split("-"))
    nxt = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)
    return (nxt - date(y, m, 1)).days


def day_in_month(rng, ym):
    y, m = (int(x) for x in ym.split("-"))
    return date(y, m, rng.randint(1, month_days(ym))).isoformat()


def add_days(iso, n):
    from datetime import timedelta
    return (date.fromisoformat(iso) + timedelta(days=n)).isoformat()


# ── 한 기업 생성 ────────────────────────────────────────────────────────────

def generate_behaviour(key, contract, months, rng, writers, roster, stats):
    """앱 이벤트·구강 신호·청구를 사람 단위로 만든다 (§14.3 · §14.4 · §14.5).

    roster 는 (sk, ptype, dept, hire_month, term_month, is_employee) 튜플 목록이다.
    참여 유형이 이벤트 유무와 주기를 정하고, 청구는 참여와 **부분적으로만** 상관된다 —
    참여자가 전부 진료를 받고 미참여자가 아무도 안 받으면 인과가 조작된 데이터가 되고
    "청구로 확인된 완료" 로직을 시험할 수 없다 (§14.4).
    """
    # 정본 dashboard.metric_time_contracts 의 창을 그대로 쓴다. Activated 는 보고월
    # 분모, Repeat 은 롤링 12개월, valid 는 "그 창 안에 1건 이상". 생애 전체를 분모로
    # 쓰면 36개월간 들어오고 나간 사람이 섞여 지표가 희석되고, 그건 화면이 보여주는
    # 값이 아니다 — 첫 구현이 정확히 그렇게 틀렸다.
    window = set(months[-12:])
    final_month = months[-1]

    band_keys = list(contract["signals"])
    band_weights = [contract["signals"][b] for b in band_keys]
    cdt_codes = [c for c, _ in SPEC["cdt_mix"]]
    cdt_weights = [w for _, w in SPEC["cdt_mix"]]

    for sk, ptype, dept, hire, term, is_employee in roster:
        span = [m for m in months if m >= hire and (term is None or m <= term)]
        if not span:
            continue

        # ── 앱 이벤트 (§14.3)
        capture_months = []
        if ptype != "NEVER":
            writers["app_event"].writerow([sk, key, day_in_month(rng, span[0]), "REGISTER"])
            writers["app_event"].writerow([sk, key, day_in_month(rng, span[0]),
                                           "QUESTIONNAIRE_COMPLETE"])
            if ptype == "ONE_SHOT":
                # 한 장 찍고 이탈한다. §14.3 은 "가입 + 첫 문진까지" 라고만 쓰지만
                # 정본 FRAC.valid 는 이 사람들의 촬영을 세고 있다 — 위 SPEC 주석 참조.
                capture_months = [span[0]]
            elif ptype == "SPORADIC":
                lo, hi = SPEC["sporadic_per_year"]
                n = max(1, round(rng.uniform(lo, hi) * len(span) / 12))
                capture_months = rng.sample(span, min(n, len(span)))
            elif ptype == "REGULAR":
                mean, sd = SPEC["regular_interval_days"]
                cur = 0.0
                while True:
                    cur += max(20.0, rng.gauss(mean, sd))
                    idx = int(cur // 30.4)
                    if idx >= len(span):
                        break
                    capture_months.append(span[idx])

        # ── 구강 신호 (§14.3 품질 게이트, §4.6 같은 날 여러 건은 정상)
        #
        # repeat 을 배정하지 않고 **센다.** 정본은 FRAC.repeat 을 "2회 이상 유효
        # 촬영한 사람 / 활성" 으로 정의하므로, 유형이 아니라 품질 게이트를 통과한
        # 촬영 수가 그 지표를 만든다. 배정해버리면 품질 게이트를 잘못 걸어도
        # repeat 이 그대로 맞게 나와 지표가 아무것도 안 지킨다.
        valid_in_window = 0
        for i, ym in enumerate(sorted(set(capture_months))):
            when = day_in_month(rng, ym)
            gate = SPEC["first_capture_quality_pass"] if i == 0 \
                else SPEC["repeat_capture_quality_pass"]
            passed = rng.random() < gate
            band = rng.choices(band_keys, weights=band_weights, k=1)[0]
            writers["oral_signal"].writerow(
                [sk, key, when, band, "PASS" if passed else "QUALITY_REJECT", "v1.4.0"])
            writers["app_event"].writerow([sk, key, when, "CAPTURE"])
            if passed and ym in window:
                valid_in_window += 1

        # 보고월에 자격이 있는 임직원만 센다 — 정본이 정한 분모다.
        if is_employee and final_month in span:
            stats["eligible_final"] += 1
            if ptype != "NEVER":
                stats["activated"] += 1          # 누적 분자 / 보고월 분모
            if valid_in_window >= 1:
                stats["valid_people"] += 1
            if valid_in_window >= 2:
                stats["repeaters"] += 1          # 롤링 12개월 2건 이상

        # ── 청구 (§14.4) — 기저 이용률 + 참여자 소폭 상향
        rate = SPEC["baseline_preventive_annual"]
        if ptype != "NEVER":
            rate += SPEC["participant_uplift"]
        n_claims = 0
        for ym in span:
            if rng.random() < rate / 12.0:
                n_claims += 1
                service = day_in_month(rng, ym)
                lag = min(SPEC["claim_lag_cap_days"],
                          int(rng.lognormvariate(math.log(SPEC["claim_lag_median_days"]),
                                                 SPEC["claim_lag_sigma"])))
                cdt = rng.choices(cdt_codes, weights=cdt_weights, k=1)[0]
                amount = round(rng.uniform(48, 520), 2)
                status = "PAID"
                if rng.random() < SPEC["claim_rewrite_rate"]:
                    status = rng.choice(("REVERSED", "ADJUSTED"))
                    stats["rewrites"] += 1
                # §14.5 일부러 붙지 않는 레코드. 전부 깨끗하면 매칭률 100% 가 나오고
                # 실데이터에서 처음으로 문제를 만난다.
                defect = ""
                join_key = sk
                if rng.random() < SPEC["match_defect_rate"]:
                    defect = rng.choice(MATCH_DEFECTS)
                    join_key = sk + "~" + defect[:3]
                    stats["match_defects"] += 1
                writers["claim_line"].writerow(
                    [key, join_key, service, add_days(service, lag), lag,
                     cdt, f"{amount:.2f}", status, defect])
        stats["claims"] += n_claims


# ── 출력 ────────────────────────────────────────────────────────────────────

TABLES = {
    "party": ["party_sk", "employer_id", "party_role", "relationship",
              "participation_type", "department"],
    "party_department": ["party_sk", "employer_id", "department"],
    "eligibility_span": ["party_sk", "employer_id", "span_from", "span_to"],
    "member_month": ["employer_id", "month_start", "party_sk", "department",
                     "relationship", "covered_days"],
    "app_event": ["party_sk", "employer_id", "event_date", "event_type"],
    "oral_signal": ["party_sk", "employer_id", "captured_at", "band",
                    "quality_gate", "model_version"],
    "claim_line": ["employer_id", "join_key", "service_date", "received_date",
                   "lag_days", "cdt_code", "allowed_amount", "status", "match_defect"],
    "department": ["employer_id", "department", "employees", "below_min_cell"],
}


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--months", type=int, default=SPEC["months"])
    ap.add_argument("--seed", type=int, default=SPEC["seed"])
    ap.add_argument("--outdir", type=Path, default=OUTDIR)
    ap.add_argument("--check", action="store_true", help="생성 없이 순수 함수만 검사")
    args = ap.parse_args()

    if args.check:
        return self_check()

    contract = load_contract()
    months = month_seq(SPEC["first_month"], args.months)
    args.outdir.mkdir(parents=True, exist_ok=True)

    handles, writers = {}, {}
    for name, header in TABLES.items():
        fh = (args.outdir / f"{name}.csv").open("w", newline="", encoding="utf-8")
        handles[name] = fh
        writers[name] = csv.writer(fh)
        writers[name].writerow(header)

    totals = {k: 0 for k in ("employees", "parties", "member_months", "eligible_final",
                             "activated", "repeaters", "valid_people", "claims",
                             "match_defects", "rewrites")}
    per_employer = {}

    for key in sorted(contract["scenarios"]):
        rng = random.Random(f"{args.seed}:{key}")     # 기업별 독립 시드 — 하나를 바꿔도 나머지가 안 움직인다
        print(f"  {key} · 자격자 {contract['scenarios'][key]['employees']:,} · "
              f"{args.months}개월 …", flush=True)
        roster = []
        stats, depts = generate_employer(key, contract, months, rng, writers, roster)
        generate_behaviour(key, contract, months, rng, writers, roster, stats)
        for name, n in depts.items():
            writers["department"].writerow(
                [key, name, n, "true" if n < contract["min_cell"] else "false"])
        per_employer[key] = dict(stats, departments=depts)
        for k in totals:
            totals[k] += stats[k]

    for fh in handles.values():
        fh.close()

    files = {}
    for name in TABLES:
        p = args.outdir / f"{name}.csv"
        files[name] = {"rows": sum(1 for _ in p.open(encoding="utf-8")) - 1,
                       "bytes": p.stat().st_size, "sha256": sha256(p)}

    params = {"seed": args.seed, "months": args.months, "spec": SPEC,
              "from_contract": contract}
    (args.outdir / "params.json").write_text(
        json.dumps(params, ensure_ascii=False, indent=2), encoding="utf-8")

    emergent = report(contract, totals, per_employer, args.months)
    manifest = {"seed": args.seed, "months": args.months, "files": files,
                "totals": totals, "emergent": emergent,
                "per_employer": {k: v["departments"] for k, v in per_employer.items()}}
    blob = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (args.outdir / "MANIFEST.json").write_text(blob, encoding="utf-8")

    # 커밋되는 재현 기록은 정본 실행만 쓴다. --months 3 짧은 확인이 36개월 해시를
    # 덮어쓰면 그 파일이 증거이기를 그만둔다.
    canonical = args.outdir == OUTDIR and args.months == SPEC["months"] \
        and args.seed == SPEC["seed"]
    if canonical:
        MANIFEST.write_text(blob, encoding="utf-8")
        print(f"\n{args.outdir} · 재현 기록 {MANIFEST.relative_to(ROOT)}")
    else:
        print(f"\n{args.outdir} · 비정본 실행이라 {MANIFEST.relative_to(ROOT)} 는 안 건드렸다")
    return 0 if emergent["ok"] else 1


def generate_employer(key, contract, months, rng, writers, roster):
    """한 기업의 사람·자격·member_month 를 만들고 roster 를 behaviour 단계로 넘긴다.

    월별 자격자 수를 목표치에 붙여 두고 이직으로 span 을 끊는다. 그래야 member_month
    행 수가 employees × DEP_RATIO × months 에서 저절로 나오고, §14.2 가 요구한 중도
    입·퇴사가 실제로 발생해 부분 월 처리가 시험된다.
    """
    scen = contract["scenarios"][key]
    target = scen["employees"]
    tiny_n = SPEC["tiny_department"]["n"][key]
    depts = department_split(target, tiny_n)
    mix = participation_mix(contract["activated"], contract["repeat"])
    monthly_leave = SPEC["annual_turnover"][key] / 12.0

    dept_slots = [d for d, n in depts.items() for _ in range(n)]
    rng.shuffle(dept_slots)
    types = list(mix)
    weights = [mix[t] for t in types]

    pid = 0
    stats = {k: 0 for k in ("employees", "parties", "member_months", "eligible_final",
                            "activated", "repeaters", "valid_people", "claims",
                            "match_defects", "rewrites")}

    def new_employee(dept, hire_month):
        nonlocal pid
        pid += 1
        sk = f"{key}-E{pid:06d}"
        ptype = rng.choices(types, weights=weights, k=1)[0]
        n_dep = rng.choices(range(5), weights=SPEC["dependents_weights"], k=1)[0]
        family = []
        for d in range(n_dep):
            if rng.random() < SPEC["family_participation_factor"]:
                dtype = rng.choices(types, weights=weights, k=1)[0]
            else:
                dtype = "NEVER"
            family.append({"sk": f"{sk}-D{d + 1}", "ptype": dtype,
                           "rel": "SPOUSE" if d == 0 else "CHILD"})
        return {"sk": sk, "dept": dept, "ptype": ptype, "family": family,
                "hire": hire_month, "term": None}

    active = [new_employee(d, months[0]) for d in dept_slots]

    def close_out(emp):
        term = emp["term"]
        writers["party"].writerow([emp["sk"], key, "EMPLOYEE", "SELF",
                                   emp["ptype"], emp["dept"]])
        writers["party_department"].writerow([emp["sk"], key, emp["dept"]])
        writers["eligibility_span"].writerow([emp["sk"], key, emp["hire"], term or ""])
        roster.append((emp["sk"], emp["ptype"], emp["dept"], emp["hire"], term, True))
        for f in emp["family"]:
            writers["party"].writerow([f["sk"], key, "DEPENDENT", f["rel"],
                                       f["ptype"], emp["dept"]])
            writers["party_department"].writerow([f["sk"], key, emp["dept"]])
            writers["eligibility_span"].writerow([f["sk"], key, emp["hire"], term or ""])
            roster.append((f["sk"], f["ptype"], emp["dept"], emp["hire"], term, False))
        stats["employees"] += 1
        stats["parties"] += 1 + len(emp["family"])

    mm = writers["member_month"]
    for mi, ym in enumerate(months):
        days = month_days(ym)
        for emp in active:
            mm.writerow([key, ym, emp["sk"], emp["dept"], "SELF", days])
            stats["member_months"] += 1
            for f in emp["family"]:
                mm.writerow([key, ym, f["sk"], emp["dept"], f["rel"], days])
                stats["member_months"] += 1
        if mi == len(months) - 1:
            break
        for emp in [e for e in active if rng.random() < monthly_leave]:
            emp["term"] = ym
            close_out(emp)
            active.remove(emp)
            active.append(new_employee(emp["dept"], months[mi + 1]))

    for emp in active:
        close_out(emp)
    return stats, depts


def report(contract, totals, per_employer, months):
    """창발 지표를 정본과 대조한다. 등급이 둘이다 — 위 docstring 참조."""
    eligible = sum(contract["scenarios"][k]["employees"] for k in per_employer)
    expected_mm = round(eligible * contract["dep_ratio"] * months)
    # 분모가 셋 다 다르다. activated·valid 는 보고월 자격자, repeat 은 그 활성 사용자,
    # dep_ratio 는 생애 전체 사람/임직원. 섞으면 조용히 틀린다.
    activated = totals["activated"] / totals["eligible_final"]
    valid = totals["valid_people"] / totals["eligible_final"]
    # Repeat 의 분모는 활성 사용자가 아니라 **창 안에 유효 촬영이 1회 이상인 사람**
    # 이다 (정본 metric_time_contracts, T14). 첫 구현은 활성으로 나눠 0.3629 를 얻고
    # 사양이 양립 불가라고 결론냈는데, 그건 정본이 같은 지표를 두 분모로 정의하고
    # 있었고 그중 낡은 쪽을 쓴 결과였다. 품질 게이트를 통과 못한 사람은 분자에서
    # 빠지는 동시에 분모에서도 빠져야 지표가 촬영 품질에 따라 흔들리지 않는다.
    repeat = (totals["repeaters"] / totals["valid_people"]
              if totals["valid_people"] else 0.0)
    dep_ratio = totals["parties"] / totals["employees"]

    # activated 와 dep_ratio 는 배정에서 나온다. 어긋나면 생성기가 틀린 것이다.
    hard = [
        ("activated", activated, contract["activated"], 0.01),
        ("dep_ratio", dep_ratio, contract["dep_ratio"], 0.05),
    ]
    # repeat·valid 는 품질 게이트를 통과한 촬영을 12개월 창에서 세어 나온다. 정본
    # 분모로 재면 repeat 은 성립 범위 안이고, valid 는 촬영 품질 파라미터가 정하므로
    # 여기서 정본에 맞춰 돌리지 않는다 — §14 가 경고한 상쇄를 내 손으로 하는 짓이다.
    # gap·closed 는 care_action 이 있어야 나오고 그 테이블은 #7 이 만든다.
    soft = [
        ("repeat", repeat, contract["repeat"], 0.08),
        ("valid", valid, contract["valid"], 0.02),
    ]

    print(f"\n  member_month {totals['member_months']:,} 행 "
          f"(목표 {expected_mm:,} · {totals['member_months'] / expected_mm - 1:+.1%})")
    print(f"  사람 {totals['parties']:,} · 임직원(생애) {totals['employees']:,} · "
          f"보고월 자격자 {totals['eligible_final']:,}")
    print(f"  청구 {totals['claims']:,} · 매칭결함 {totals['match_defects']:,} · "
          f"재작성 {totals['rewrites']:,}")

    ok = True
    for name, got, want, tol in hard:
        bad = abs(got - want) > tol
        ok = ok and not bad
        print(f"  {'FAIL' if bad else 'ok  '} {name:<10} {got:.4f} vs 정본 {want} "
              f"(허용 ±{tol})")
    for name, got, want, tol in soft:
        flag = "warn" if abs(got - want) > tol else "ok  "
        print(f"  {flag} {name:<10} {got:.4f} vs 정본 {want} "
              f"(창발값 — 여기서 보정하지 않는다)")

    if abs(totals["member_months"] / expected_mm - 1) > 0.03:
        print(f"  FAIL member_month 가 목표의 ±3% 를 벗어났다")
        ok = False

    for key, v in per_employer.items():
        total = sum(v["departments"].values())
        want = contract["scenarios"][key]["employees"]
        below = [d for d, n in v["departments"].items() if n < contract["min_cell"]]
        bad = total != want or not below
        ok = ok and not bad
        print(f"  {'FAIL' if bad else 'ok  '} {key} 부서합 {total:,} = 자격자 {want:,} · "
              f"최소셀 미만 {below or '없음 — 억제 시연 불가'}")

    conflict = spec_conflict(contract)
    print(f"\n  해소된 사양 결함 1건 ({conflict['resolved']}) — {conflict['title']}")
    print(f"    이전: {conflict['was']}")
    print(f"    현재: {conflict['now']}")
    print(f"    교훈: {conflict['lesson']}")

    return {"ok": ok, "member_months": totals["member_months"],
            "member_months_target": expected_mm, "activated": round(activated, 4),
            "repeat": round(repeat, 4), "dep_ratio": round(dep_ratio, 4),
            "valid": round(valid, 4), "spec_conflict": conflict}


def spec_conflict(c):
    """정본이 Repeat 을 두 분모로 정의하고 있었고, 61% 는 그 어느 쪽도 아니었다.

    2026-08-25 에 이 함수가 하는 일이 바뀌었다. 원래는 "§14.3 의 SPORADIC 연 1~2회와
    FRAC.repeat 이 양립 불가" 라는 결론을 담고 있었는데, **그 결론은 틀렸다.** 활성
    사용자를 분모로 쓴 결과였고, 정본은 같은 지표를 두 번 정의하고 있었다.

      definition_ko (낡음)             2회 이상 유효 촬영 / **활성 사용자**   → 0.3629
      metric_time_contracts (T14)     2회 이상 유효 / **유효 1회 이상**      → 0.6830

    T14 분모로 재면 성립 범위 안이다. 그리고 61% 자체는 §14.3 이 `23 / 38` 로
    유도했는데 그 계산에 **품질 게이트가 없다** — 재참여하는 *유형*의 비율이지 유효
    2건을 *달성한* 사람의 비율이 아니다. 셋 다 2026-08-25 에 정정했다.

    남기는 이유. 정본과 화면과 기술문서가 한 지표를 세 가지로 말하고 있었고 그것을
    아무 검사도 못 잡았다. 여기 적어두면 다음에 지표를 추가할 때 분모를 두 곳에
    쓰지 않는다.
    """
    return {
        "resolved": "2026-08-25",
        "title": "정본이 Repeat 을 두 분모로 정의하고 있었고 §14.3 유도에는 품질 게이트가 없었다",
        "was": "활성 사용자 분모로 재서 0.3629 를 얻고 사양이 양립 불가라고 결론냈다",
        "now": "T14 분모(창 안 유효 1회 이상)로 재면 정본 0.61 대비 성립 범위 안이다",
        "fixed": [
            "정본 repeat_participation.definition_ko 를 metric_time_contracts 와 일치",
            "index.html Repeat 카드의 분모를 valid 기준으로, 라벨도 함께",
            "기술문서 §3 지표표와 §14.3 의 23/38 유도 철회",
            "이 생성기의 repeat 분모",
        ],
        "lesson": "품질 게이트는 분자와 분모 양쪽에 같이 걸려야 한다. 분자에만 걸면 "
                  "촬영 품질이 흔들릴 때 참여 지표가 따라 흔들린다.",
    }


# ── 자체 검사 ───────────────────────────────────────────────────────────────

def self_check():
    """순수 함수만 본다. 전체 생성은 몇 분이 걸리므로 pre-commit 에 못 넣는다."""
    c = load_contract()

    mix = participation_mix(c["activated"], c["repeat"])
    assert abs(sum(mix.values()) - 1.0) < 1e-9, mix
    assert abs(mix["NEVER"] - (1 - c["activated"])) < 1e-9
    got_repeat = (mix["SPORADIC"] + mix["REGULAR"]) / c["activated"]
    assert abs(got_repeat - c["repeat"]) < 1e-9, got_repeat
    # §14.3 이 산문으로 준 62/15/13/10 을 정본에서 역산해도 같은지
    assert abs(mix["NEVER"] - 0.62) < 0.005, mix["NEVER"]
    assert abs(mix["ONE_SHOT"] - 0.148) < 0.005, mix["ONE_SHOT"]
    assert abs(mix["SPORADIC"] - 0.131) < 0.005, mix["SPORADIC"]
    assert abs(mix["REGULAR"] - 0.101) < 0.005, mix["REGULAR"]

    for key, scen in c["scenarios"].items():
        emp = scen["employees"]
        tiny = SPEC["tiny_department"]["n"][key]
        d = department_split(emp, tiny)
        assert sum(d.values()) == emp, (key, d)
        assert d[SPEC["tiny_department"]["name"]] == tiny
        assert tiny < c["min_cell"], f"{key} tiny {tiny} 가 최소셀 미만이 아니다"
        assert all(n > 0 for n in d.values()), d
    # 반올림이 합을 깨는 홀수 규모에서도 성립하는지
    for odd in (1001, 4999, 7, 21):
        d = department_split(odd, 3)
        assert sum(d.values()) == odd, (odd, d)

    ms = month_seq("2023-08", 36)
    assert len(ms) == 36 and ms[0] == "2023-08" and ms[-1] == "2026-07", (ms[0], ms[-1])
    assert month_days("2024-02") == 29 and month_days("2023-02") == 28
    assert month_days("2024-01") == 31 and month_days("2024-04") == 30
    assert add_days("2024-02-28", 2) == "2024-03-01"

    expected = round(sum(s["employees"] for s in c["scenarios"].values())
                     * c["dep_ratio"] * 36)
    assert expected == 2_970_000, expected

    print(f"PASS — 참여 혼합 {' · '.join(f'{k} {v:.3f}' for k, v in mix.items())}")
    print(f"       부서 분할 3사 전부 100% · 최소셀 미만 부서 유지")
    print(f"       member_month 목표 {expected:,} 행 = 자격자 "
          f"{sum(s['employees'] for s in c['scenarios'].values()):,} × "
          f"{c['dep_ratio']} × 36")
    return 0


if __name__ == "__main__":
    sys.exit(main())
