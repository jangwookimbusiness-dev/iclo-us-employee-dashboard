# ICLO 기업용 랜딩페이지 — 카피·디자인·제품 연결 명세

> 2026-09-08 · GitHub #82 · 구현 준비용 초안 / 승인 대기
>
> 대상: 미국 self-funded dental plan 기업의 Benefits/Total Rewards 담당자.
> 영어가 공개 페이지의 기본 언어이며 한국어는 검토·번역 원고다. 두 언어를 한 화면에 병렬로 쌓지 않는다.
> 이 문서는 아직 없는 기능을 출시된 기능으로 표현하지 않는다. `[EN]`/`[KO]` 아래만 공개용 원고이고, 나머지는 내부 구현 지시다.
> 제품 요구는 [PRD.md](PRD.md), 시각 토큰은 루트 [DESIGN.md](../../DESIGN.md).

## 1. 전환 전략과 information architecture

**전환 목표:** 데모를 본 적합한 기업이 “현재 보고서로 답하기 어려운 질문”을 가져와 문제·데이터 검증 대화에 참여하도록 한다. 즉시 구매·가입·사진 촬영을 요구하지 않는다.

독자가 순서대로 풀어야 할 질문과 페이지 구역:

| 순서 / anchor | 독자의 질문 | 전달할 변화 | 표현/행동 |
|---|---|---|---|
| 1 Pain / `#pain` | 우리 팀의 어떤 문제인가? | 참여 이후가 설명되지 않는 문제를 식별 | Hero + 짧은 문제 문장; 합성 데모 CTA |
| 2 Desired outcome / `#outcome` | 무엇을 다르게 판단하나? | 참여 보고 → 확인·미확인·관찰 중을 구분한 평가 | before/after 비교; 실제 성과 수치 없음 |
| 3 Mechanism / `#mechanism` | 그 판단 근거는 어떻게 만드나? | 자격·활동·청구를 같은 사람/기간으로 연결 | 세 단계 과정; 목표 구조라고 표시 |
| 4 Proof / `#proof` | 지금 확인할 수 있는 것은? | 주장을 읽는 것 → 합성 제품 동작 직접 확인 | 실제 Funnel / 작은 셀 예시 링크 |
| 5 Objection / `#questions` | 기존 보고·개인정보·지연 문제는? | 도입 전에 확인해야 할 조건 이해 | 다섯 개의 직접적인 Q&A |
| 6 Pricing / `#pricing` | 무엇에 비용을 지불하나? | 불명확한 구독 약속 → 범위 합의 후 견적 | 비용 항목/책임 범위, 가격 미정 명시 |
| 7 CTA / `#next-step` | 지금 무엇을 하면 되나? | 제품 구경 → 실제 보고 질문으로 적합성 논의 | 준비 상태에 맞는 단일 주 행동 |

Hero는 Pain의 시작이며 별도 기능 소개 섹션을 끼우지 않는다. 헤더에는 ICLO, How it works, Evidence, Questions, Pricing 앵커만 둔다. 반복 CTA는 같은 의미와 목적지를 사용한다. Snowflake 기술 세부 내용은 내부 제안서에 남기며 기업 구매자의 첫 화면을 차지하지 않는다.

## 2. 공개 카피 — 영어 / 한국어

### 2.1 Pain + Hero

[EN]

Eyebrow: **For US employers with self-funded dental plans**

H1: **See what followed the dental check-in.**

Body: Participation tells you who started. ICLO is developing a way to connect program activity with claims-confirmed care actions, so your benefits team can decide what to investigate or support next. Employers see aggregate evidence; individual results belong in a separate, authorized member experience.

Primary CTA: **Explore the synthetic demo**

Secondary link: **How the evidence would work**

Status: **Design-partner preview. No live customer outcomes are presented.**

Problem bridge: **When participation is not the whole answer.**
If your current reporting cannot connect a program check-in with what happened next, it is hard to explain what deserves further attention. That is the gap we want to test with you.

[KO]

Eyebrow: **미국 self-funded 치과 플랜을 운영하는 기업을 위해**

H1: **치과 복지 참여 이후를, 청구 근거로 확인하세요.**

Body: 참여 집계는 누가 시작했는지 알려줍니다. ICLO는 프로그램 활동과 청구로 확인한 조치를 연결하는 서비스를 개발하고 있습니다. 복리후생 담당자가 다음에 무엇을 확인하고 어디에 지원할지 판단하도록, 기업에는 집계 근거를 제공하고 개인 결과는 권한 있는 별도의 임직원 경험에서 다룹니다.

Primary CTA: **합성 데모 살펴보기**

Secondary link: **근거를 연결하는 방식**

Status: **설계 파트너 검토용입니다. 실제 고객 성과를 제시하지 않습니다.**

Problem bridge: **참여 숫자만으로 답하기 어려운 질문이 있다면.**
현재 보고서로 프로그램 참여와 그 이후를 연결하기 어렵다면, 어디를 더 살펴봐야 할지 설명하기도 어렵습니다. ICLO가 함께 확인하려는 문제입니다.

구현 지시: who=eyebrow, problem=첫 본문 문장/bridge, outcome=다음 판단, differentiator=참여와 적격 청구의 연결 + 기업 집계 경계. 네 요소를 이미지나 스크롤 이후 문장에만 맡기지 않는다. 첫 화면의 제품 이미지는 현재 빌드에서 가져온 합성 화면이며 고지와 프레임을 함께 보여 준다.

### 2.2 Desired outcome — before / after

[EN]

H2: **Move from a participation count to a clearer next decision.**

Before: **“People took part. What happened after that?”**
Program participation and care evidence may sit in separate reports.

After: **“Here is what is confirmed—and what we cannot judge yet.”**
The proposed evidence view separates participation, open care actions, and claims-confirmed actions from mature cohorts. Recent actions need time before they can be assessed.

Outcome: Bring a more specific question to your next benefits discussion: do we need more time, better data, or a different kind of support?

Note: This is the intended decision workflow, not a measured improvement in cost or health.

[KO]

H2: **참여 집계에서, 다음 판단의 근거로.**

Before: **“참여는 했는데, 그다음은 어떻게 됐을까요?”**
프로그램 참여와 진료 근거를 서로 다른 보고서에서 확인하고 있을 수 있습니다.

After: **“확인된 것과 아직 판단할 수 없는 것을 나눠 봅시다.”**
목표로 하는 근거 화면은 참여, 미완료 조치, 충분한 관찰 기간을 거쳐 청구로 확인한 조치를 구분합니다. 최근 조치는 판단할 시간이 더 필요합니다.

Outcome: 다음 복지 논의에서는 더 구체적인 질문을 다룹니다. 시간이 더 필요한지, 데이터가 부족한지, 다른 지원이 필요한지 확인합니다.

Note: 목표로 하는 판단 과정이며 비용이나 건강이 개선됐다는 측정 결과는 아닙니다.

구현 지시: 비교 항목은 서로 대응하는 두 열이며 모바일에서는 Before → After 순서다. “현재 기업의 성적표”처럼 보이는 가짜 수치·상승 화살표·성과 배지는 넣지 않는다. 관찰 중 상태는 목표 설명이며 현재 데모에 별도 미성숙 코호트 집계가 구현됐다고 표시하지 않는다.

### 2.3 Mechanism

[EN]

H2: **Connect the person, the period, and the evidence.**

Intro: The proposed workflow connects three sources under agreed data rights and access controls.

1. **Establish who is eligible.** Use eligibility records to define the covered population and reporting period.
2. **Connect participation with care evidence.** Match program activity and qualifying dental claims for the same person and employer, within the defined time windows.
3. **Show what the evidence supports.** Report permitted aggregates with source dates and small-group suppression. Keep open actions separate from claims-confirmed actions in mature cohorts.

Boundary: A matching claim can confirm a qualifying care action. It does not, by itself, show that the program caused it.

[KO]

H2: **같은 사람, 같은 기간, 확인 가능한 근거를 연결합니다.**

Intro: 합의된 데이터 권리와 접근 통제 아래 세 원천을 연결하는 구조를 제안합니다.

1. **누가 대상인지 정합니다.** 자격 자료로 대상 인원과 보고 기간을 정합니다.
2. **참여와 진료 근거를 연결합니다.** 같은 사람과 기업의 프로그램 활동·적격 치과 청구를 정해진 시간 범위에서 연결합니다.
3. **근거가 뒷받침하는 만큼 보여 줍니다.** 허용된 집계에 원천 기준일과 작은 집단 억제를 적용합니다. 미완료 조치와 성숙 코호트에서 청구로 확인한 조치를 분리합니다.

Boundary: 일치하는 청구는 적격 조치를 확인하는 근거입니다. 그것만으로 프로그램이 그 행동을 일으켰다고 증명하지는 못합니다.

구현 지시: 데스크톱 가로/모바일 세로의 세 단계 목록. 방향선과 텍스트로 연결을 보여 주되 “실시간 작동 중” 애니메이션이나 데이터가 실제 흐르는 상태 표시를 쓰지 않는다. 단계별 아이콘 카드 세 개로 기능을 나열하지 않는다.

### 2.4 Proof — 지금 직접 확인할 수 있는 것

[EN]

H2: **Inspect the evidence view before discussing a rollout.**

Intro: The local synthetic demo lets you inspect how the employer view presents participation, separates care-action counts, and withholds small-group values.

Proof link 1: **Inspect participation and care actions**
Caption: The people funnel and the care-action counts are separate. Open and completed actions are not a completion rate.

Proof link 2: **See a small-group example**
Caption: Values, shares and bars below the minimum group size are withheld with an explanation.

Evidence label: **Synthetic data — illustrative only**

Limit: These examples demonstrate interface behavior. They are not customer results or proof of a live Snowflake pipeline. Department examples use company-wide ratios, not measured department outcomes.

[KO]

H2: **도입을 논의하기 전에, 근거 화면부터 확인하세요.**

Intro: 로컬 합성 데모에서 기업 화면이 참여를 어떻게 보여 주고, 조치 수를 어떻게 구분하며, 작은 집단의 값을 어떻게 가리는지 확인할 수 있습니다.

Proof link 1: **참여와 조치 집계 확인하기**
Caption: 사람 기준 퍼널과 조치 수는 별개입니다. 미완료 수와 완료 수로 완료율을 계산하지 않습니다.

Proof link 2: **작은 집단의 표시 방식 보기**
Caption: 최소 집단 기준 미만의 값·비율·막대는 설명과 함께 가립니다.

Evidence label: **Synthetic data — illustrative only**

Limit: 이 예시는 화면 동작을 보여 줍니다. 고객 성과나 가동 중인 Snowflake 파이프라인의 증거가 아닙니다. 부서 예시는 전사 비율을 사용하며 부서별 실측 결과가 아닙니다.

구현 지시: 본문이 “local”인 것은 현재 상태를 반영한다. 승인된 공개 합성 데모를 실제 검증한 후에만 “local”을 빼는 카피 변경을 한다. 과거 proposal PNG·가짜 고객 로고·미검증 인증 배지를 사용하지 않는다. 실제 빌드에서 생성한 이미지에는 생성 원본/일자를 내부 기록하고 숫자를 다시 그리지 않는다.

### 2.5 Objection — 질문에 먼저 답한다

[EN]

H2: **Questions to settle before a pilot.**

**We already receive reports from our TPA. Why add this?**
You may not need to. The question is whether your existing reports connect program participation with qualifying care actions well enough for the decisions you need to make. Start there.

**Would our team see individual health results?**
The employer view is aggregate-only. Individual results belong in a separate, authorized member experience. Real-data access controls require implementation and verification before use.

**What if the claims arrive late?**
Recent actions need an observation window and claims run-out. The proposed reporting distinguishes mature cohorts from actions that are too recent to assess. Source dates matter.

**Will this prove savings or better health?**
Not by itself. Connecting activity and claims is not a controlled evaluation. Any cost or health-outcome claim needs its own agreed method and evidence.

**Can we connect live data today?**
The current artifact is a synthetic demo. Data rights, identity matching, legal requirements, security and delivery arrangements must be resolved before real data is loaded.

[KO]

H2: **파일럿 전에 확인할 질문들.**

**TPA 보고서를 이미 받는데, 왜 필요하죠?**
추가 도구가 필요하지 않을 수도 있습니다. 기존 보고서가 프로그램 참여와 적격 조치를 충분히 연결해 필요한 판단을 돕는지부터 확인합니다.

**기업 담당자가 개인의 건강 결과를 보나요?**
기업 화면은 집계만 보여 줍니다. 개인 결과는 권한 있는 별도 임직원 경험에서 다룹니다. 실데이터 접근 통제는 사용 전에 구현하고 검증해야 합니다.

**청구가 늦게 들어오면 어떻게 하나요?**
최근 조치에는 관찰 기간과 청구가 도착할 시간이 필요합니다. 목표 보고 구조는 충분히 관찰한 코호트와 아직 판단하기 이른 조치를 구분합니다. 원천 기준일을 함께 읽어야 합니다.

**비용 절감이나 건강 개선을 증명하나요?**
이 연결만으로 증명하지는 못합니다. 활동과 청구를 연결하는 것과 비교 조건을 갖춰 효과를 평가하는 것은 다릅니다. 비용·건강 성과 주장에는 합의된 방법과 별도 근거가 필요합니다.

**지금 실데이터를 연결할 수 있나요?**
현재 산출물은 합성 데모입니다. 실데이터를 적재하기 전에 데이터 권리, 식별키 연결, 법적 요건, 보안, 전달 방식을 확정해야 합니다.

구현 지시: 다섯 답변을 기본 펼침 상태로 제공한다. 모바일에서도 핵심 한계를 접힌 내용에 숨기지 않는다. 복잡한 custom accordion은 필요 없다.

### 2.6 Pricing — 범위를 알아야 가격을 정한다

[EN]

H2: **Agree on the scope. Then price the work.**

Body: ICLO has not published a standard price for this work. A proposal would follow a review of the population, data access, required reporting and operating responsibilities.

A scoped proposal should separate:

- **Setup:** source access, mapping and validation work.
- **Ongoing delivery:** refresh cadence, reporting scope and support.
- **Third-party costs:** any TPA extraction fees, cloud use and other provider charges, with responsibility stated.

Close: Confirm what is included, what is excluded, who owns each cost, and the evaluation criteria before proceeding.

Microcopy: No published subscription price. No payment is requested from this preview.

[KO]

H2: **먼저 범위를 맞추고, 그다음 비용을 정합니다.**

Body: 이 작업의 표준 가격은 아직 공개하지 않았습니다. 대상 인원, 데이터 접근, 필요한 보고, 운영 책임을 검토한 뒤 제안 범위와 견적을 논의합니다.

견적에서는 다음 항목을 구분해야 합니다.

- **초기 연결:** 원천 접근, 매핑, 검증 작업.
- **지속 운영:** 갱신 주기, 보고 범위, 지원.
- **외부 비용:** TPA 추출 비용, 클라우드 사용료, 다른 제공자의 비용과 부담 주체.

Close: 포함·제외 범위, 비용별 책임자, 평가 기준을 확인한 뒤 진행 여부를 결정합니다.

Microcopy: 공개된 구독 요금은 없습니다. 이 미리보기에서 결제를 요청하지 않습니다.

구현 지시: 하나의 범위 설명 영역만 사용한다. Starter/Pro/Enterprise, 임의 PEPM, 무료 파일럿, 취소 조건, 확정 응답 기한, ROI 계산기는 승인된 상업 조건 없이 만들지 않는다. 위 비용 구분은 견적 논의 틀이며 확정 청구 모델이나 유료 계약을 뜻하지 않는다.

### 2.7 CTA — 다음 대화의 질문을 가져오게 한다

[EN]

H2: **Bring one question your current report cannot answer.**

Body: The next conversation should establish the decision you need to make, the population involved, and who can discuss data access. Then decide whether a scoped evaluation is worth pursuing.

**When inquiry routing is verified**
Primary CTA: **Discuss a design-partner fit**
Microcopy: For employer benefits teams and their advisers. Do not send employee health information.

**Until inquiry routing is verified**
Status: **Inquiry intake is not open in this preview.**
Primary CTA: **Explore the synthetic demo**
Microcopy: No request is submitted from this page.

[KO]

H2: **현재 보고서로 답하기 어려운 질문 하나를 가져오세요.**

Body: 어떤 결정을 내려야 하는지, 누구를 대상으로 하는지, 누가 데이터 접근을 논의할 수 있는지부터 확인합니다. 그다음 범위를 정한 검증을 진행할 가치가 있는지 판단합니다.

**문의 경로를 검증한 뒤**
Primary CTA: **설계 파트너 적합성 논의하기**
Microcopy: 기업 복리후생 담당자와 자문사를 위한 대화입니다. 임직원 건강정보는 보내지 마세요.

**문의 경로를 검증하기 전**
Status: **이 미리보기에서는 아직 문의를 받지 않습니다.**
Primary CTA: **합성 데모 살펴보기**
Microcopy: 이 페이지에서는 요청이 접수되지 않습니다.

구현 지시: 두 상태를 동시에 노출하지 않는다. 현재 기본값은 미접수 상태다. 주 CTA는 처음에는 데모로 부담을 낮추고, 마지막에는 준비가 된 경우에만 적합성 대화로 바뀐다.

## 3. 반응형 화면 설계

데스크톱 / 모바일의 같은 독서 순서:

```text
DESKTOP ≥ 960px                         MOBILE 320–599px
┌───────────────────────────────────┐  ┌───────────────────┐
│ ICLO    Mechanism Proof FAQ Price │  │ ICLO    데모 보기  │
├───────────────────┬───────────────┤  ├───────────────────┤
│ WHO / H1          │ 실제 빌드의  │  │ WHO / H1          │
│ 문제·결과·차별점 │ 합성 화면   │  │ 문제·결과·차별점 │
│ CTA + 상태 고지  │ 고지 포함   │  │ CTA + 상태 고지  │
├───────────────────┴───────────────┤  │ 데모 미리보기    │
│ Pain → Before  │ After           │  ├───────────────────┤
│ Mechanism  1 → 2 → 3              │  │ Pain              │
│ Proof: 실제 화면 + 두 증거 링크  │  │ Before → After    │
│ Questions: 질문 / 펼친 답        │  │ Mechanism 1·2·3   │
│ Pricing: 범위와 책임             │  │ Proof + 데모 링크 │
│ Final CTA: 보고 질문 하나        │  │ Questions         │
│ Footer: 상태·고지                │  │ Pricing → CTA     │
└───────────────────────────────────┘  └───────────────────┘
```

- Hero는 데스크톱 7:5 분할, 왼쪽 정렬. 강제로 한 화면 높이를 채우지 않는다. 1440×900에서 네 메시지 요소와 CTA/상태가 첫 화면에 들어오는지 확인한다.
- 390×844 모바일에서 이미지보다 who/H1/본문/CTA/상태를 먼저 보여 준다. 320px·확대 환경에서는 무리한 첫 화면 강제보다 전체 내용 접근성을 우선한다.
- 600–959px는 Hero 단일 열, before/after 두 열을 내용이 허용할 때만 유지한다. 작은 화면에서 비교는 세로로 쌓는다.
- 제품 이미지를 휴대폰 크기의 작동 불가능한 iframe으로 축소하지 않는다. 정적 미리보기와 명확한 전체 데모 링크를 사용한다. UI 이미지는 lazy-load, 크기를 예약한다.
- 배경 전체 장식 대신 얇은 구획선·여백·문장 크기로 위계를 만든다. 기본은 흰 바탕이며 최종 CTA만 Navy 강조 영역을 제안한다.
- 각 섹션은 제목 하나, 핵심 문단 하나, 필요한 근거만 둔다. 모바일 sticky CTA·자동 재생·carousel·팝업·애니메이션 수치는 사용하지 않는다.

## 4. 실제 제품과의 연결 계약

아래 경로는 **현재 로컬 HTTP에서 검증할 경로**다. 공개 사이트의 작동 URL이라고 주장하지 않는다. 다음 랜딩은 로컬 `landing.html`로 빌드하는 안이며 아직 존재하지 않는다.

| 요소 | 로컬 상대 목적지 | 성공 기준 |
|---|---|---|
| Hero / 미접수 상태의 주 CTA | `employer.html?tab=funnel` | 실제 Funnel 활성, 참여/조치 구분·합성 고지 확인 |
| Mechanism 보조 링크 | `#mechanism` | 제목이 가려지지 않고 해당 구역으로 이동 |
| Proof: 참여/조치 | `employer.html?tab=funnel` | 위와 동일; 별도 가짜 dashboard 없음 |
| Proof: 작은 집단 | `employer.html?tab=signals&dept=Facilities%20%28pilot%20site%29` | 해당 부서·Signals 선택, 억제 설명/값 비노출 |
| 최종 문의 CTA | 미정 — 공개 전 차단 조건 | 승인된 수신자/URL, 실제 전달과 실패 동작 확인 |

현재 부서명과 탭 key는 정본/템플릿에서 확인했다. 구현자는 변경된 정본에서도 대상이 유효한지 검사해야 한다. 해당 부서가 없어져 전체 기업 값으로 조용히 fallback하면 증거 링크 인수 실패다.

**최소 구현안:** 기존 빌더에 랜딩 템플릿 한 개를 추가하고 정적 카피/상대 링크를 렌더한다. 데이터 위젯을 재구현하지 않는다. 현재 화면 이미지를 추가한다면 같은 빌드의 생성물만 사용한다. 프레임워크·새 패키지·CMS·백엔드는 이 단계에 필요하지 않다. 영어 한 페이지부터 구현하고 한국어 공개가 승인되면 같은 구조에 번역 페이지를 추가한다.

**공개 연결:** 현행 Pages/QR 리다이렉트를 덮어쓰지 않는다. 별도 호스팅/목적지가 승인되면 허용 파일만 배포하고, 배포된 데모 URL을 실제 열어 위 성공 기준을 재확인한다. 공개 데모가 준비되지 않았으면 localhost 링크를 외부 사용자에게 제공하지 말고 출시에 앞서 해결한다. 외부 기존 사이트를 검사 없이 제품 endpoint로 간주하지 않는다.

**임직원 표면:** 랜딩의 주 여정은 기업 화면이다. 임직원 예시는 기업 집계의 개인 드릴다운으로 연결하지 않는다. 설명이 필요하면 별도 승인된 합성 시연에서만 보여 준다. 실운영 A2는 본인 인증·동의·비공개 전달을 별도로 충족한다.

## 5. 상태, 입력과 측정

### 5.1 준비/실패 상태

| 상태 | 사용자에게 보여 줄 것 | 금지 |
|---|---|---|
| 데모 준비됨 | 합성 상태와 유효한 데모 링크 | 고객 성과처럼 포장 |
| 데모 실패/누락 | 읽기 실패 설명, 재시도/원페이지 복귀 | 빈 값을 0으로 표시, 다른 tenant 데이터 fallback |
| 문의 목적지 미정 | 미접수 상태 + 데모 CTA | 빈 href, 테스트 이메일, 가짜 예약 폼 |
| 외부 문의 경로 승인됨 | 외부 이동임을 알리는 링크와 개인정보 안내 | 클릭 즉시 “접수 완료” |
| 추후 폼을 실제 도입함 | 전송 중·수락·실패 상태를 실제 응답과 연결 | 전송 전에 성공 화면, 재시도 중 중복 접수 |

현재 단계는 문의 폼 없이 진행한다. 이후 폼이 필요하면 업무 이메일·조직·역할·플랜 적합성 등 최소 항목부터 별도 승인한다. 건강정보 자유 입력·사진·claim ID·보험 식별자·파일 업로드는 받지 않는다. 입력/로그/보존/삭제/수신 책임을 함께 검토하고 단순 email 정규식만으로 보안을 주장하지 않는다.

### 5.2 전환 이벤트 명세 — 미설치

| 이벤트 | 발생 사실 | 허용 속성 | 의미하지 않는 것 |
|---|---|---|---|
| `demo_open` | 유효 데모 링크를 선택 | 위치(hero/proof/footer), 카피 버전, 언어 | 실제 읽기/수요/구매 |
| `inquiry_open` | 승인된 문의 경로를 선택 | 위치, 버전, 언어 | 접수·예약 완료 |
| `inquiry_received` | 수신 시스템에서 고유 요청 수락 확인 | 비식별 집계용 상태/버전 | 유효 대화 |
| `qualified_conversation` | 실제 대화에서 PRD 적합성 충족 | 내부 집계만 | 유료 계약·효과 입증 |

기본은 자동 추적 없음. 도입 시 동의/고지와 운영 결정을 먼저 검토하고, 전체 URL·쿼리·이메일·건강정보를 이벤트 속성으로 보내지 않는다. 외부 예약 서비스가 수락 증거를 제공하지 않으면 `inquiry_received`를 추정 생성하지 않는다. 기존 meeting-log로 대화 증거를 수동 기록해도 충분하다. 클릭률보다 실제 질문·데이터 협의·다음 행동을 우선한다.

## 6. 구현 인수 및 출시 판정

- 문서/카피: PRD LP-01–07과 §2 공개 카피 대조. Before/After가 허구 성과로 읽히지 않는지 ICP 검토.
- 실제 연결: 두 제품 링크의 DOM 상태·합성 고지·억제를 확인. 없는 부서, 잘못된 tab, 누락 JSON도 시험.
- 반응형: 320·390·768·1440 CSS px, 200% 텍스트 확대, 1280px에서 400% zoom. 가로 넘침·작아진 버튼·잘린 고지·고정 영역 가림 없음.
- 접근성: DESIGN.md의 대비·포커스·키보드·의미 구조 기준. 화면 그림은 보조 증거이며 텍스트로도 핵심 이해 가능.
- 성능: 초기 로딩은 텍스트/CTA가 우선. autoplay·외부 추적 script·iframe 없음. 이미지 크기/폰트 파일/네트워크 요청을 기록하고 성능 예산은 첫 구현 측정 후 승인.
- 검색/공유: 제목 제안 `ICLO | Dental program evidence for self-funded employers`. 설명에 개발/합성 상태 포함. 승인 전 preview는 검색 유입 대상으로 운영하지 않으며 noindex만을 접근 통제로 간주하지 않음.
- 공개 판정: 데모 호스팅, 문의 목적지, 고지·책임자, 견적 원칙, 공개 파일 allowlist, 교차 모델 검토가 모두 확인되기 전 공개 출시 완료로 보고하지 않음.

## 7. 근거 대장과 남은 결정

| 카피 근거 | 확인 위치 | 쓸 수 있는 주장 / 한계 |
|---|---|---|
| 실제 기업 화면과 deep link | `screens/employer.html.in`, `scripts/build_screens.py` | 로컬 합성 UI 동작 / 실운영 아님 |
| 억제·정본 전파 | `test_build_reads_canon.py`, 정본 | 검사가 다루는 로컬 동작 / 인증·DB 법적 승인 아님 |
| 완료·성숙·시점 | 정본 `dashboard.metric_time_contracts`, ARCHITECTURE.md | 목표 지표 의미 / 인과·완료율 오표현 금지 |
| 고용주 수요와 파트너 반응 | `meeting-log.md` | 기록된 범위만 / 공식 보증·고객 후기 아님 |
| 비용 논의 | v14 제안서, 비용 분석 문서 | 범위/부담 주체 논의 / 확정 가격 없음 |
| 현재 공개 경계 | `scripts/build_pages_site.py`, `test_pages_root.py` | 리다이렉트 하나 / 공개 데모 존재 주장 금지 |

승인 필요: ICP와 Hero 약속, 디자인 방향, 로컬 구현 착수 범위, 공개 목적지, 문의 수신/고지, 견적 원칙. 기존 `intent.md`의 승인 여부는 별도다. 이 명세는 구현 가능한 경로를 정하지만 승인되지 않은 상업·법무·배포 결정을 대신하지 않는다.
