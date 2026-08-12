# 기존 파트너십 덱에 끼울 두 장

대상: `iclo-investor-relations/decks/iclo-snowflake-partnership-2026-08-v1.pptx` (11장)
빌더: `iclo-investor-relations/tmp/ir-us-2026-08/build-snowflake.mjs`

**덱을 다시 만들지 않습니다.** 원문이 이미 좋고, 베끼면 나빠집니다. 빠진 것만 채웁니다.

## 왜 이 두 장인가

`contracts/proposal-package-v11.yml`의 `required_disclosure`가 대외 제안 문서에 `status`와 `start_gates`를 반드시 노출하라고 규정합니다. 근거는 같은 파일의 주석입니다.

> 대외 문서에서 빠지면 다 만들어진 제품처럼 읽힌다.

현재 덱은 07 THE DATA FLOW에서 "Proposed architecture, not an existing deployment"를 각주로 달고, 08 TIMELINE에서 "Phase dates are planning assumptions"를 답니다. 방향은 맞지만 **각주 크기**입니다. 07이 그리는 관리형 평면과 05·06이 그리는 앱 기능 중 무엇이 오늘 존재하는지는 어디에도 없습니다.

특히 05 THE PRODUCT의 임직원 화면 네 줄 중 두 줄이 존재하지 않는 기능입니다.

- "Their plan coverage and what is left of the annual maximum" → 급여 게이트웨이 `X12 270/271`. 정본 `status.does_not_exist`
- "In-network dentists and AI-assisted booking" → 설계 전

각주 "U.S. app coverage and booking integrations are not live yet"가 이를 덮고 있지만, 슬라이드 본문은 네 줄을 동등하게 나열합니다.

## 삽입 위치

07 THE DATA FLOW **뒤**, 08 TIMELINE **앞**. 관리형 평면을 보여준 직후에 "그중 무엇이 오늘 있는가"와 "무엇이 먼저 닫혀야 하는가"가 오는 순서가 자연스럽습니다.

번호는 07a·07b로 두거나 08·09로 밀고 이후를 재번호합니다.

---

## 삽입 1 — 07a · WHAT EXISTS TODAY

**Kicker**
The previous two slides are what we are asking to build. This is what runs.

**Table — 5 rows**

| | |
|---|---|
| Running today | One employer-dashboard demo. Synthetic figures computed in the browser. No live data, no Snowflake connection. |
| Designed | Evidence-layer data model, identity resolution rules, policy and quality contracts, employer onboarding, inference API contract. |
| Built in the first 90 days | Named counterparts and validation scope, evidence-layer architecture, security-posture alignment, owners named for each start gate. |
| Does not exist | Employee web app, Core AI call path, benefits gateway (X12 270/271). Separate track, outside the 90 days. |
| Not decided | What the predictive model predicts, cohort assignment, the full guardian-permission flow. |

**Footnote**
Two of the four employee-app lines on slide 05 sit behind the benefits gateway, which is in the "does not exist" row. The Korean product is live; the U.S. app is not.

---

## 삽입 2 — 07b · WHAT MUST CLOSE BEFORE LIVE DATA

**Kicker**
All four are open. Each needs a written conclusion and a named owner before any PHI lands.

**Table — 4 rows**

| Gate | If it stays open |
|---|---|
| HIPAA role determination | No legal basis to load PHI. The BAA chain is built on this determination. |
| Data rights | The data arrives and cannot be used. Most of the delay in this business starts here. |
| Baseline load before consent | Baseline loading precedes consent. Processing non-consenting members' PHI without a basis is structural, not an exception. |
| Common identity key | Claims and app activity cannot be joined, so "claims-confirmed" does not hold. |

**Footnote**
We are not asking Snowflake to decide these. HIPAA roles, data rights and regulatory determinations belong to ICLO and the customer. A platform tier does not close them. We would rather say they are open than let the deck imply otherwise.

---

## 빌더에 넣는 형태

`build-snowflake.mjs`가 `page()` · `txt()` · `box()` · `rule()` · `footer()` · `notes()` 헬퍼를 쓰므로 같은 형식을 따릅니다. 아래는 골격이며, 표 렌더링은 그 파일에 이미 있는 표 헬퍼를 그대로 씁니다.

```js
// 07 THE DATA FLOW 다음, 08 TIMELINE 앞에 삽입
{
  const s = presentation.slides.add();
  page(s, {
    step: "07a · WHAT EXISTS TODAY",
    title: "The previous two slides are what we are asking to build.\nThis is what runs.",
    titleSize: 30,
  });
  // 5행 표 — 좌측 라벨 열, 우측 내용 열
  // rows: Running today / Designed / Built in the first 90 days /
  //       Does not exist / Not decided
  footer(s, pageLabel());
  notes(s,
    "정본 contracts/proposal-package-v11.yml 의 status 다섯 갈래를 그대로 옮긴 장. " +
    "05 의 임직원 화면 네 줄 중 둘이 does_not_exist 에 걸린다는 점을 반드시 말한다.",
    ["contracts/proposal-package-v11.yml · status",
     "required_disclosure.proposal_en = [status, start_gates]"]);
}

{
  const s = presentation.slides.add();
  page(s, {
    step: "07b · WHAT MUST CLOSE BEFORE LIVE DATA",
    title: "All four are open.",
    kicker: "Each needs a written conclusion and a named owner before any PHI lands.",
  });
  // 4행 표 — Gate / If it stays open
  footer(s, pageLabel());
  notes(s,
    "Snowflake 에 판단을 요청하지 않는다는 점을 분명히 한다. " +
    "플랫폼 티어로 닫히는 게이트가 아니다.",
    ["contracts/proposal-package-v11.yml · start_gates"]);
}
```

## 알아두실 것

**빌더가 gitignore된 `tmp/` 안에 있습니다.** 이번 세션에 원페이저 빌드 스크립트가 저장소에 없어서 다이어그램 오타를 못 고친 일이 있었습니다. `build-snowflake.mjs`도 같은 자리이므로, 지워지면 이 덱을 다시 만들 수 없습니다. `scripts/build/` 같은 추적되는 위치로 옮기는 것을 권합니다.

**이 두 장은 팔기 좋은 장이 아닙니다.** 없는 것을 없다고 적는 장이라 분량이 늘고 기세가 꺾입니다. 그래도 넣는 이유는 실사에서 드러나는 편이 훨씬 비싸기 때문이고, 정본이 대외 문서에 요구하는 항목이기 때문입니다.
