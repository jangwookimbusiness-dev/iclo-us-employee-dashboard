#!/usr/bin/env python3
"""제안 패키지와 저장소 산출물이 정본·운영 규칙과 어긋나는지 검사한다.

CI 와 로컬 ``make check`` 양쪽에서 실행한다.
exit 0 = 일치, exit 1 = 불일치.

  python3 scripts/check-package-consistency.py           # 전체
  python3 scripts/check-package-consistency.py --no-pdf  # PDF 건너뛰기 (빠름)
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTRACT = ROOT / "contracts/proposal-package-v11.yml"
MAX_TRACKED_FILE_BYTES = 15 * 1024 * 1024
fails, warns = [], []


def fail(check, detail):
    fails.append((check, detail))


def warn(check, detail):
    warns.append((check, detail))


def check_repository_artifacts():
    """Keep a single generated file from silently becoming repository history.

    Historical PDFs and handoff archives already account for most of this
    repository's size. Rewriting published history is a separate, coordinated
    operation; this forward guard prevents the problem from getting worse.
    """
    try:
        tracked = subprocess.check_output(
            ["git", "ls-files", "-z"], cwd=ROOT
        ).decode("utf-8").split("\0")
    except (OSError, subprocess.CalledProcessError, UnicodeDecodeError) as exc:
        fail("artifact_size", f"tracked file 목록을 읽지 못함: {exc}")
        return

    oversized = []
    for relative in tracked:
        if not relative:
            continue
        path = ROOT / relative
        if path.is_file() and path.stat().st_size > MAX_TRACKED_FILE_BYTES:
            oversized.append((relative, path.stat().st_size))

    for relative, size in oversized:
        fail(
            "artifact_size",
            f"{relative} = {size / 1024 / 1024:.1f} MiB; 15 MiB 초과 파일은 "
            "ARTIFACTS.md 정책에 따라 Release 또는 승인된 저장소로 옮겨야 함",
        )


def check_pages_publish_boundary():
    """Refuse to make the repository root a public Pages artifact.

    The workflow text check protects the deployment boundary, while executing
    the builder here makes PR checks exercise the same staging path that the
    post-merge deploy job uses.
    """
    workflow_path = ROOT / ".github/workflows/gates.yml"
    builder_path = ROOT / "scripts/build_pages_site.py"
    if not workflow_path.exists() or not builder_path.exists():
        fail("pages_boundary", "Pages workflow 또는 allowlist builder 가 없음")
        return

    workflow = workflow_path.read_text(encoding="utf-8")
    if re.search(r"^\s*path:\s*\.\s*$", workflow, re.M):
        fail("pages_boundary", "Pages artifact 가 저장소 전체(path: .)를 공개함")
    for required in ("python3 scripts/build_pages_site.py", "path: _site"):
        if required not in workflow:
            fail("pages_boundary", f"workflow 에 {required!r} 없음")

    builder = builder_path.read_text(encoding="utf-8")
    # 2026-08-26 부터 공개 표면은 리다이렉트 하나다. 이전에는 여기서 index.html·
    # app.html·member-demo.json 이 allowlist 에 **있는지**를 봤는데, 그건 데모가
    # 공개돼 있어야 한다는 단언이었다. 지금은 반대를 본다.
    if 'Path("pages-root-redirect.html")' not in builder:
        fail("pages_boundary", "공개 allowlist 에 리다이렉트가 없음")
    for demo_file in ("app.html", "data/member-demo.json"):
        if f'(Path("{demo_file}")' in builder:
            fail("pages_boundary",
                 f"{demo_file} 이 공개 allowlist 에 돌아왔다 — 폐기된 데모는 "
                 f"인터넷에 있을 이유가 없다")

    result = subprocess.run(
        [sys.executable, str(builder_path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        detail = (result.stdout + result.stderr).strip() or "출력 없음"
        fail("pages_boundary", f"Pages artifact staging 실패: {detail}")


def check_status_headers():
    """현황 문서가 자기 헤더에 적은 커밋과 날짜가 실제로 맞는지 본다.

    doc-manifest 와 .docstamps.json 은 **PDF 가 md 와 같은지**를 증명한다. md 가
    저장소와 같은지는 증명하지 않는다. 그 틈에 실제로 뭐가 빠졌는지가 이 검사의
    이유다 — `STATUS-2026-08-16.md` 가 헤더에 `2026-08-16 · 커밋 dc7bb5e` 라 적고
    있었는데 `dc7bb5e` 는 2026-08-15 커밋이고, 그 사이 하루에 커밋 31개가 들어와
    문서가 "없다" 고 쓴 것들을 만들었다. 해시 스탬프는 전부 초록불이었다.

    ponytail: 문서 내용 전체를 저장소와 대조하지 않는다. 그건 불가능하다. 기계가
    확인할 수 있는 주장 하나 — "이 문서는 커밋 X 시점이고 X 는 날짜 D 다" — 만 본다.
    """
    status_dir = ROOT / "output/status"
    if not status_dir.is_dir():
        return
    docs = sorted(status_dir.glob("*.md"))
    if not docs:
        return

    seen = 0
    for doc in docs:
        head = doc.read_text(encoding="utf-8")[:4000]
        m = re.search(r"\*\*(\d{4}-\d{2}-\d{2})\s*·\s*커밋\s*`([0-9a-f]{7,40})`\*\*", head)
        if not m:
            warn("status_header",
                 f"{doc.name}: '**날짜 · 커밋 `해시`**' 헤더가 없어 대조할 수 없다")
            continue
        declared_date, sha = m.groups()
        seen += 1
        try:
            # %cd (커밋 날짜), %ad 아님. "이 문서는 커밋 X 시점" 이 뜻하는 것은 그
            # 커밋이 **언제 나무에 올라왔는지**다. %ad 는 작성 시각이라 cherry-pick
            # 이나 rebase 로 나중에 올라온 커밋이 옛 날짜로 통과한다 (codex 재검토).
            actual, author_date = subprocess.check_output(
                ["git", "log", "-1", "--format=%cd|%ad", "--date=short", sha],
                cwd=ROOT, stderr=subprocess.DEVNULL).decode().strip().split("|")
        except (OSError, subprocess.CalledProcessError):
            # 커밋을 못 찾는 데는 두 가지 이유가 있고 심각도가 다르다. 얕은 클론이면
            # 히스토리가 없는 것이고 (CI 의 actions/checkout 기본값이 fetch-depth 1
            # 이다 — 이 검사의 첫 CI 실행이 그래서 죽었다), 그게 아니면 문서가 없는
            # 해시를 가리키는 것이다. 둘을 같은 실패로 묶으면 CI 를 초록불로 만들려고
            # 검사를 경고로 낮추게 되고, 그게 이 저장소에서 검사 셋이 죽은 방식이다.
            # gates.yml 은 fetch-depth: 0 을 쓰므로 CI 에서도 이 갈래로 안 온다.
            shallow = subprocess.run(
                ["git", "rev-parse", "--is-shallow-repository"], cwd=ROOT,
                capture_output=True, text=True).stdout.strip() == "true"
            if shallow:
                warn("status_header",
                     f"{doc.name}: 얕은 클론이라 커밋 {sha} 를 확인할 수 없다 — "
                     f"검사하려면 fetch-depth: 0")
            else:
                fail("status_header", f"{doc.name}: 헤더의 커밋 {sha} 가 저장소에 없다")
            continue
        if actual != declared_date:
            fail("status_header",
                 f"{doc.name}: 헤더는 {declared_date} 라 쓰는데 커밋 {sha} 의 "
                 f"커밋 날짜는 {actual} 이다. 그 사이 커밋이 문서를 낡게 만들었을 수 있다")
        elif author_date != actual:
            warn("status_header",
                 f"{doc.name}: 커밋 {sha} 의 작성일({author_date})과 커밋일({actual})이 "
                 f"다르다 — rebase 나 cherry-pick 을 거쳤다는 뜻이고, 문서가 기준으로 "
                 f"삼는 시점은 커밋일 쪽이다")

    if seen:
        print(f"현황 문서 {seen}건 — 헤더의 커밋과 날짜가 실재")


def check_local_matches_ci():
    """`make check` 과 gates.yml 이 같은 검사를 돌리는지 본다.

    왜 필요한가. 같은 숫자가 네 곳에서 달랐다. 이슈 #1 본문은 nine gates,
    Makefile 과 AGENTS.md 는 ten, CI 는 실제로 twelve 였다. 그리고 개수만 어긋난
    것이 아니라 **`make check` 이 새 게이트 둘을 아예 안 돌리고 있었다** — 즉
    로컬에서 통과시키고 PR 에서 처음 실패하는 상태였다. #1 의 수락기준이
    "make check runs the same gates as CI" 인데 그것이 거짓이었다.

    사람이 세는 방식으로는 다시 어긋난다. 개수가 아니라 **집합**을 비교한다.
    """
    wf_path = ROOT / ".github/workflows/gates.yml"
    mk_path = ROOT / "Makefile"
    if not wf_path.exists() or not mk_path.exists():
        fail("local_vs_ci", "gates.yml 또는 Makefile 이 없음")
        return
    try:
        import yaml
    except ImportError:
        fail("local_vs_ci", "PyYAML 없음 — 'make setup' 후 다시 실행")
        return

    def norm(line):
        m = re.search(r"(?:python3?|bash|\$\(PYTHON\))\s+(\S+\.(?:py|sh))(.*)", line)
        if not m or "pip install" in line:
            return None
        return m.group(1) + (" --check" if "--check" in m.group(2) else "")

    wf = yaml.safe_load(wf_path.read_text(encoding="utf-8"))
    steps = wf["jobs"]["gates"]["steps"]

    # 스텝이 **실제로 강제되는지**까지 본다. 첫 판은 run: 줄만 걷어서, `if: false` 나
    # `continue-on-error: true` 를 붙여 게이트를 무력화해도 집합이 그대로라 통과했다
    # (codex 재검토, 2026-08-25). 목록에 있는 것과 병합을 막는 것은 다르다.
    for st in steps:
        run = str(st.get("run", ""))
        if not any(norm(l) for l in run.splitlines()):
            continue
        label = st.get("name") or (norm(run.splitlines()[0]) or "?")
        if st.get("continue-on-error"):
            fail("local_vs_ci",
                 f"CI 스텝 '{label}' 에 continue-on-error 가 붙어 실패해도 병합을 "
                 f"막지 못한다 — 게이트로 세면 안 된다")
        if "if" in st:
            fail("local_vs_ci",
                 f"CI 스텝 '{label}' 에 조건 `if: {st['if']}` 가 붙어 항상 돌지 "
                 f"않는다 — 조건부 스텝은 필수 게이트가 아니다")

    ci = {norm(l) for st in steps
          for l in str(st.get("run", "")).splitlines()} - {None}

    text = mk_path.read_text(encoding="utf-8")
    # check 는 check-fast 를 부르므로 두 타깃을 합쳐 본다. 다음 타깃 전까지 자른다.
    local = set()
    for target in ("check:", "check-fast:"):
        i = text.find(f"\n{target}")
        if i < 0:
            fail("local_vs_ci", f"Makefile 에 {target} 타깃이 없음")
            return
        body = text[i + 1:]
        end = re.search(r"\n(?=\S+:)", body)
        local |= {norm(l) for l in (body[:end.start()] if end else body).splitlines()} - {None}

    only_ci, only_local = sorted(ci - local), sorted(local - ci)
    if only_ci:
        fail("local_vs_ci",
             f"CI 만 돌리는 검사 — 로컬에서 통과시키고 PR 에서 처음 깨진다: {only_ci}")
    if only_local:
        fail("local_vs_ci",
             f"make 만 돌리는 검사 — CI 가 안 지키므로 병합을 막지 못한다: {only_local}")

    # 문서가 말하는 개수도 같이 잡는다. 세 곳이 서로 달랐던 것이 이 검사의 출발점이다.
    n = len(ci)
    words = {9: "nine", 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen",
             14: "fourteen", 15: "fifteen"}
    word = words.get(n)
    for doc in ("Makefile", "AGENTS.md"):
        p = ROOT / doc
        if not p.exists():
            continue
        t = p.read_text(encoding="utf-8")
        # 단위를 문구에 박는다. 전에는 "the same N gates as CI" 를 찾았고, `gates` 가
        # CI 명령과 검증 단위 둘을 뜻해서 헌장이 21이라 하고 여기가 13이라 하는 상태를
        # 만들었다 (R2). 그리고 문구를 못 찾으면 **조용히 건너뛰었다** — 문구를 고치는
        # 순간 검사가 사라진다. 둘 다 고친다.
        m = re.search(r"the same (\w+) CI commands as CI", t)
        if not m:
            fail("local_vs_ci",
                 f"{doc} 에 'the same N CI commands as CI' 문구가 없다 — 개수 대조를 "
                 f"할 수 없다. 문구를 바꾸려면 이 검사도 같이 바꾼다")
            continue
        if word and m.group(1) != word:
            fail("local_vs_ci",
                 f"{doc} 는 '{m.group(1)} CI commands' 라 쓰는데 실제 {n}개다 "
                 f"('{word}')")

    print(f"make check 와 CI 가 같은 검사 {n}개를 돌린다")


def check_contract_parses():
    """정본이 YAML 로서 성립하는지 본다.

    load_contract() 는 정규식이라 파일이 YAML 로 깨져 있어도 통과한다. 실제로
    그랬다 — build_in_90_days 와 does_not_exist 가 시퀀스 뒤에 같은 들여쓰기로
    note: 를 붙이고 있었고, 항목 하나는 따옴표 없는 스칼라 안에 ': ' 를 담고
    있었다. 셋 다 PyYAML 에서 에러다. 검사기는 계속 초록불이었다.

    PyYAML 은 requirements-dev.txt 의 필수 개발 의존성이다. 정본을 실제 YAML 로
    읽지 못한 검사는 성공할 수 없다.
    """
    try:
        import yaml
    except ImportError:
        fails.append(("contract_yaml", "PyYAML 없음 — 'make setup' 후 다시 실행"))
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

    # 결정된 항목의 대칭 검사. 대기 항목은 문서에 "미결" 표시가 있어야 하고,
    # 결정된 항목은 문서에 결정 기록이 있어야 한다. 이게 없으면 어제 같은 일이
    # 반복된다 — 레지스터 5·7번이 자기 주제가 결정된 것을 모른 채 발견될 때까지
    # 낡아 있었다. 이제 결정 기록을 문서에서 지우면 여기서 걸린다.
    dm = re.search(r"^decided:$(.*?)(?=^#|^\w)", t, re.S | re.M)
    dentries = re.findall(
        r"- id:\s*(\S+).*?marker:\s*(.+?)\n.*?where:\s*(\S+)",
        dm.group(1), re.S) if dm else []
    for eid, marker, where in dentries:
        marker = marker.strip().strip("'\"")
        f = ROOT / where
        if not f.exists():
            fail("decided", f"{eid}: 가리키는 {where} 가 없음")
            continue
        if marker not in f.read_text(encoding="utf-8"):
            fail("decided",
                 f'{eid}: {where} 에 결정 기록 "{marker}" 가 없다. 결정이 뒤집혔다면 '
                 f"decided 에서 빼고, 아니라면 문서가 결정을 잃어버린 것이다")

    print(f"결정 대기 {len(entries)}건 · 결정 기록 {len(dentries)}건 — 전부 해당 문서에서 확인")


TECH_DOC = ROOT / "output/proposal-v10/06_Tech/ICLO-Evidence-Layer-DB-설계-KO.md"


def check_start_gates():
    """정본 start_gates 와 기술문서 §16 법무 레지스터가 서로를 안 배신하는지 본다.

    왜 이 검사가 있는가. 2026-08-25 까지 두 문서가 **서로 다른 넷**을 세고 있었다.
    정본은 HIPAA 역할·데이터 권리·기준선 적재·공통 식별키를 들었고, §17.1 은
    2026-08-15 에 "요약이 BAA·리전을 넷에 넣고 있었는데 그건 §16 번호 항목이 아니라
    §9 가정 A5" 라고 바로잡았다. 그런데 그때 정본 쪽에 항목을 안 넣어서 총계가
    4 대 5 로 어긋난 채 남았다. 문서 한쪽만 고치면 다음 사람이 반대쪽을 읽는다.

    그리고 §16 본문 요약이 `12~21 · 10개 항목` 이라 쓰면서 §16.1 은 11개를
    열거하고 있었다. 빠진 것은 SSN 수집·보관 근거였다. 같은 숫자가 세 곳에서
    달랐고 아무도 안 세어봤다.

    ponytail: 항목 내용까지 대조하지 않는다. 번호 체계와 개수, 그리고 각 게이트의
    출처가 실재하는지만 본다. 그 셋이 어긋난 것이 실제로 일어난 사고였다.
    """
    try:
        import yaml
    except ImportError:
        warn("start_gates", "PyYAML 없음 — 착수 게이트 대조를 건너뜀")
        return
    if not TECH_DOC.exists():
        fail("start_gates", f"기술문서 없음: {TECH_DOC}")
        return

    doc = yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))
    gates = doc.get("start_gates") or []
    text = TECH_DOC.read_text(encoding="utf-8")

    # §16.1 이 실제로 몇 개를 열거하는가. "### 16.1" 부터 다음 `---` 까지의 `N. ` 줄.
    m = re.search(r"^### 16\.1.*?$(.*?)^---", text, re.S | re.M)
    if not m:
        fail("start_gates", "기술문서에서 §16.1 구간을 못 찾았다")
        return
    enumerated = len(re.findall(r"^\d+\. ", m.group(1), re.M))

    # §16 본문 요약이 선언하는 범위와 개수.
    m2 = re.search(r"^(\d+)~(\d+)\. \*\*계정·가족·이탈 관련 (\d+)개 항목\*\*", text, re.M)
    if not m2:
        fail("start_gates", "§16 본문의 '계정·가족·이탈 관련 N개 항목' 요약 줄을 못 찾았다")
        return
    lo, hi, claimed = (int(x) for x in m2.groups())

    if hi - lo + 1 != claimed:
        fail("start_gates",
             f"§16 본문 요약의 범위와 개수가 안 맞는다: {lo}~{hi} 는 {hi - lo + 1}개인데 "
             f"{claimed}개라고 쓴다")
    if claimed != enumerated:
        fail("start_gates",
             f"§16 본문 요약은 {claimed}개라 쓰고 §16.1 은 {enumerated}개를 열거한다")

    # §16 본문의 번호 항목 수 + §16.1 열거 수 = 레지스터 총계. 문서가 그 숫자를 말하는가.
    body = text[text.index("## 16. "):text.index("### 16.1")]
    body_items = len(re.findall(r"^\d+\. (?:~~)?\*\*", body, re.M))
    total = body_items + enumerated
    if not re.search(rf"유일한 법무 게이트 레지스터이고 {total}개 항목", text):
        fail("start_gates",
             f"레지스터 총계는 본문 {body_items} + §16.1 {enumerated} = {total}개인데 "
             f"기술문서가 그 숫자를 선언하지 않는다")

    # 각 게이트의 출처가 실재하는지. §16-N 을 가리키면 그 번호가 본문에 있어야 한다.
    for g in gates:
        src = str(g.get("source", ""))
        n = re.search(r"§16-(\d+)|16절 (\d+)번", src)
        if n:
            idx = int(n.group(1) or n.group(2))
            if not re.search(rf"^{idx}\. \*\*", body, re.M):
                fail("start_gates", f"게이트 {g['id']} 가 §16-{idx} 를 가리키는데 그 항목이 없다")
        elif "§9" not in src and "§17" not in src and "기술문서에 게이트로는 없음" not in src:
            fail("start_gates", f"게이트 {g['id']} 의 출처가 해석 불가: {src!r}")
        if not g.get("kind") and not n:
            warn("start_gates",
                 f"게이트 {g['id']} 는 §16 번호 항목이 아니므로 kind 로 성질을 밝혀야 한다")

    # 정본 자신이 게이트 수를 말하는 자리도 본다. 2026-08-25 에 다섯 번째를 넣고
    # 기술문서만 고쳤더니 정본의 주석·산문 세 곳이 "넷" 으로 남았고, 이 검사가
    # 기술문서만 스캔해서 못 봤다 (codex 헌장 검토, 2026-08-26). **한 문서만 보는
    # 검사는 두 문서가 어긋나는 것을 정의상 못 잡는다.**
    canon_text = CONTRACT.read_text(encoding="utf-8")
    canon_wrong = re.findall(
        r"start_gates\s*(하나|둘|셋|넷|다섯|여섯|일곱)|"
        r"게이트 — [^\n]*?하는 (하나|둘|셋|넷|다섯|여섯|일곱)", canon_text)
    canon_words = {w for pair in canon_wrong for w in pair if w}

    # 기술문서가 정본 게이트 수를 말하는 모든 자리를 찾아 **전부** 같은지 본다.
    #
    # 이 검사의 첫 판은 `그것이 드는 (다섯|N개|넷)` 이었다. **정답과 오답을 같은
    # 정규식에 나열했으므로 아무것도 검증하지 않았다.** 그리고 그 상태로 실제
    # 모순을 통과시켰다 — 같은 커밋이 §16 에 "그것이 드는 다섯" 을 넣으면서 §17.1
    # 의 "드는 넷" 을 그대로 뒀고, 검사는 초록불이었다 (codex 재검토, 2026-08-25).
    #
    # 그래서 대안(alternation)을 쓰지 않는다. 숫자를 말하는 자리를 전부 걷어와
    # 기대값 하나와 대조하고, 자리가 0개면 그것도 실패다.
    want_word = {1: "하나", 2: "둘", 3: "셋", 4: "넷", 5: "다섯",
                 6: "여섯", 7: "일곱"}.get(len(gates))
    stated = re.findall(r"드는\s+(하나|둘|셋|넷|다섯|여섯|일곱|\d+개)", text)
    if not stated:
        fail("start_gates",
             f"기술문서가 정본 게이트 수({len(gates)})를 어디서도 말하지 않는다")
    else:
        expected = {want_word, f"{len(gates)}개"} - {None}
        canon_bad = sorted(canon_words - expected)
        if canon_bad:
            fail("start_gates",
                 f"정본이 자기 게이트 수를 {canon_bad} 로 말한다 — 실제 {len(gates)}건. "
                 f"기술문서만 고치고 정본을 두면 이 검사가 잡는다")
        wrong = sorted(set(stated) - expected)
        if wrong:
            fail("start_gates",
                 f"기술문서가 정본 게이트 수를 {sorted(set(stated))} 로 말한다 — "
                 f"실제 {len(gates)}건이므로 {sorted(expected)} 여야 한다. "
                 f"한 절만 고치고 다른 절을 두면 이 검사가 그것을 잡는다")

    print(f"착수 게이트 {len(gates)}건 · 법무 레지스터 {total}개 "
          f"(본문 {body_items} + §16.1 {enumerated}) · "
          f"수를 말하는 자리 기술문서 {len(stated)}곳 + 정본 {len(canon_words)}곳 "
          f"전부 일치 — 출처 전부 실재")


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
    # `disclose: 대내` 게이트는 대외 노출 검사에서 뺀다. 지금 해당하는 것은
    # baa_and_region 하나이고, 이유는 그 항목의 고유 내용이 **우리 Snowflake 계정의
    # 에디션·리전**이기 때문이다. 고객이 알아야 할 BAA 체인 자체는 §16-1
    # (hipaa_roles) 이 이미 대외로 들고 있으므로 중복이 아니라 분업이다.
    # 이 필드가 없으면 정본에 게이트를 하나 넣는 순간 발송된 제안서 다섯이
    # 전부 경고를 뿜고, 그 경고를 끄려고 대외 문서에 우리 계정 사정을 적게 된다.
    blocks = re.split(r"^  - id:", g, flags=re.M)[1:]
    c["gates_ko"], c["gates_en"] = [], []
    for b in blocks:
        if re.search(r"^\s+disclose:\s*대내", b, re.M):
            continue
        for key, dest in (("ko", c["gates_ko"]), ("en", c["gates_en"])):
            m = re.search(rf"^\s+{key}:\s*(.+)$", b, re.M)
            if m:
                dest.append(m.group(1).strip())
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
            import pymupdf
            d = pymupdf.open(p)
            return "\n".join(d[i].get_text() for i in range(d.page_count))
        except Exception as e:
            fail("pdf", f"{p.name} 읽기 실패: {e}")
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
    b = ROOT / "scripts/build/iclo-snowflake-proposal-v10/build_reports_v10.py"
    if b.exists() and 'else "JOINT VALIDATION PROPOSAL"' in b.read_text(encoding="utf-8"):
        fail("header", "build_reports_v10.py: Report 의 머리글이 'JOINT VALIDATION PROPOSAL' — "
                       "Proposal 덱과 구분되지 않는다")


def main():
    use_pdf = "--no-pdf" not in sys.argv
    if not CONTRACT.exists():
        print(f"정본 없음: {CONTRACT}")
        return 1
    check_repository_artifacts()
    check_pages_publish_boundary()
    check_contract_parses()
    check_status_headers()
    check_local_matches_ci()
    check_start_gates()
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
        print("일치 — 정본·문서·저장소 규칙과 어긋나지 않음")
    return 1 if fails or warns else 0


if __name__ == "__main__":
    sys.exit(main())
