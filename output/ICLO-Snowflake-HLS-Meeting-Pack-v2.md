# ICLO × Snowflake HLS Meeting Pack

External proposal companion · discussion material

## 90-second opening statement

ICLO is building an employee dental-benefit navigation and claims-verified evidence layer.

In the front, we help employees understand eligibility, plan rules and network context; prepare for care; and request provider search or appointment support. Oral-image capture is optional, and early model outputs remain in shadow mode. They do not automatically determine urgency, provider choice or treatment pathways.

In the back, we connect that employee journey to eligibility and dental claims so an employer can see aggregate, claims-confirmed evidence - not individual health information. We separate allowed, plan-paid and employee out-of-pocket amounts, and we are deliberately not promising year-one savings. Utilization and plan-paid claims may rise before any longer-term treatment-mix change becomes measurable.

We believe Snowflake could be the governed evidence and collaboration plane behind this workflow: structured eligibility, plan context, app events and claims in Snowflake; raw oral images in separate controlled U.S. storage; and aggregate employer views governed by purpose and role.

Today we are asking for three things: agreement on the most natural HLS sales play, a sponsored technical working session, and an account-by-account path to determine whether a payer or TPA actually holds dental eligibility or claim-line data in Snowflake. We are not asking for generic customer introductions. We want to learn what ICLO must prove before an account team or partner program would support us.

## 45-minute meeting agenda

| Time | Topic | Intended outcome |
|---|---|---|
| 0-5 min | Opening and desired decisions | Confirm the three meeting outcomes and participant roles. |
| 5-12 min | Business fit | Place ICLO in the most natural HLS sales play; test application vs evidence-layer framing. |
| 12-20 min | Account ecosystem | Separate employer, carrier-ASO and TPA roles; define account evidence before introductions. |
| 20-32 min | Architecture | Review ingestion, image boundary, canonical model, aggregate output and platform prerequisites. |
| 32-40 min | Partnership path | Compare startup, partner, Powered by Snowflake and potential Native App routes. |
| 40-45 min | Next actions | Assign named owners and due dates; confirm workshop and one account-team validation candidate. |

## Action register — Immediate

| Action | Snowflake owner | ICLO owner | Due date | Required output |
|---|---|---|---|---|
| Confirm HLS sales play and named internal stakeholders | HLS GTM specialist | Jangwoo Kim / Strategy | D+2 business days | Written sales-play recommendation and stakeholder map |
| Schedule technical architecture working session | Named HLS architect + solution engineer | ICLO Product / Data lead | D+5 business days | Calendar invite, attendee list and input checklist |
| Confirm U.S. account, region, Business Critical, BAA and credit/support path | SE + security/compliance + startup lead | ICLO Operations / Security | D+10 business days | Written decision path, dependencies and support scope |
| Run 2.5K / 10K / 25K employee workload sizing | Solution engineer | ICLO Data lead | D+15 business days | Assumptions, architecture, credit range and post-credit unit economics |
| Recommend tenancy, security and data-transfer decision pattern | HLS architect + security/compliance owner | ICLO Product / Security | D+15 business days | Reference architecture; same-region share versus controlled SFTP/API decision tree |

<div style="break-before: page"></div>

## Action register — Next / Conditional

| Action | Snowflake owner | ICLO owner | Due date | Required output |
|---|---|---|---|---|
| Build named-account matrix v1 | HLS GTM + relevant account owners | ICLO GTM lead | D+20 business days | Account-level data/workload evidence and readiness status |
| Select one payer or TPA account-team validation | HLS GTM specialist | Jangwoo Kim / Strategy | D+30 business days | Technical/use-case validation readout; no introduction commitment required |
| Provide partner-path and co-sell readiness criteria | Startup / Partner / ISV lead | ICLO Strategy + Product | D+30 business days | Checklist for startup, SPN, Powered by Snowflake and Native App options |
| Decide whether Snowflake employee benefits merits design-partner diligence | HLS GTM + relevant benefits stakeholder | ICLO Strategy | Conditional after architecture review | Fit / no-fit memo based on funding structure and data-rights verification |

## Optional design-partner question

Would Snowflake's own employee-benefits organization be relevant as a design-partner candidate, subject to funding structure and data-rights verification? This is an optional diligence question, not an assumption about fit.

<div style="break-before: page"></div>

## Internal review notes / 내부 검토 메모

- 외부 대화에서는 Snowflake에 법률·FDA·HIPAA 최종 판단을 요구하지 않는다.
- Business Critical과 적절한 BAA는 Snowflake 내 PHI 처리의 플랫폼 전제이며 ICLO 전체의 HIPAA 준수를 자동 완성하지 않는다.
- 고객 소개보다 sales-play fit, architecture decision support, named-account evidence와 readiness criteria를 먼저 남긴다.
- Native App, Clean Room, federated learning은 현재 employer pilot의 필수 조건이 아니다.

<div style="break-before: page"></div>

## Self-review

| Result | Check |
|---|---|
| Yes | ICLO does not appear as another teledentistry app. |
| Yes | Snowflake's role is more specific than database hosting. |
| Yes | Employer, TPA, carrier and employee roles are separated. |
| Yes | No first-year savings promise is made. |
| Yes | Turnover and the J-curve connect to a Snowflake analytics use case. |
| Yes | Raw images and structured claims are separated. |
| Yes | Business Critical is not presented as automatic HIPAA compliance. |
| Yes | Federated learning is a conditional future option. |
| Yes | Delta Dental and Blue are not treated as single accounts. |
| Yes | Incumbent presence and whitespace diligence remain separate. |
| Yes | Snowflake GTM asks are feasible sponsor, coordination, evidence and path questions. |
| Yes | Named owners and required outputs are designed into the close. |
