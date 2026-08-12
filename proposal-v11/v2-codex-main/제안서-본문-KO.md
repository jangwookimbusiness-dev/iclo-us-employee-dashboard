# ICLO 미국 임직원 치아 플랜 근거 설계 협업 제안

## Snowflake Korea에 요청드리는 일

이 제안서가 요청드리는 일은 하나입니다. 현재 ICLO를 지원하는 Snowflake Korea 스타트업 담당자가 미국 HLS GTM 담당자와 아키텍처 담당자를 지정하고 ICLO와 연결해 주시는 것입니다. 이것이 Step 0의 전부입니다.

이 문서는 투자 제안이 아닙니다. 제품 구매, 구축 승인, 실데이터 적재도 요청드리지 않습니다. 먼저 미국 기업 치아 플랜의 구조와 ICLO가 확인하려는 범위를 같은 언어로 검토할 상대가 필요합니다. 연결 이후에도 실데이터는 아래 착수 게이트가 모두 서면으로 닫히고 90일 관계·설계 검증이 끝난 뒤의 별도 단계에서만 다룹니다.

## 한국의 보험 경험만으로는 미국 기업 치아 플랜을 읽기 어렵습니다

한국 독자는 국민건강보험을 공통 기반으로 두고 회사 복리후생을 더하는 그림에 익숙합니다. 미국의 기업 제공 치아 플랜은 출발점이 다릅니다. 기업이 임직원에게 제공할 플랜의 자격과 조건을 정하고, 플랜의 재원을 마련하는 방식도 선택합니다. 미국 노동부는 고용 기반 그룹 건강플랜의 재원 방식을 나눠 보고합니다. 이 문서의 비교 단위는 fully insured와 self-funded / ASO / stop-loss입니다. [미국 노동부, Self-Insured Group Health Plans 2025](https://www.dol.gov/sites/dolgov/files/EBSA/researchers/statistics/retirement-bulletins/annual-report-on-self-insured-group-health-plans-2025.pdf) 치아 보장과 플랜 설계의 기본 형태는 HealthCare.gov와 미국치과의사협회의 안내에서 확인할 수 있습니다. [HealthCare.gov, Dental coverage](https://www.healthcare.gov/coverage/dental-coverage/), [미국치과의사협회, 치아 플랜 설계](https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs)

한국의 실손보험과 닮은 점은 진료 뒤 청구와 본인부담이 생긴다는 점입니다. 그러나 미국 기업 치아 플랜에서는 고용 자격, 기업이 고른 플랜 조건, 네트워크, 허용액과 연간 한도 등이 처리 결과에 함께 작용합니다. 따라서 임직원의 앱 사용 기록만 봐서는 플랜 이용이 실제 치과 청구로 이어졌는지 알 수 없습니다. 치아 플랜의 설계가 서로 다르다는 점은 미국치과의사협회의 플랜 설계 안내에서도 확인할 수 있습니다. [미국치과의사협회, 치아 플랜 설계](https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs)

### fully insured와 self-funded / ASO / stop-loss

fully insured 방식에서는 기업이 보험 상품을 구매하고 carrier가 계약된 위험을 맡습니다. 반면 self-funded / ASO / stop-loss 구조에서는 비용 부담 주체와 운영 주체를 나눠 봐야 합니다.

- 기업이 지원하는 플랜은 비용 부담 주체인 payer입니다.
- TPA(third-party administrator, 제3자 관리기관)는 ASO(administrative services only) 계약에 따라 자격 관리, 청구 처리 같은 관리 업무를 맡을 수 있습니다.
- stop-loss는 예외적으로 큰 부담에 대비하는 별도 보호 장치입니다.
- carrier는 보험 상품 제공자입니다. payer와 같은 뜻이 아닙니다.

따라서 self-funded / ASO / stop-loss 구조를 보험 상품을 구매한 경우와 같은 돈의 흐름으로 설명하면 책임 주체를 잘못 짚게 됩니다. 미국 노동부도 두 재원 방식의 차이를 구분해 보고합니다. [미국 노동부, Self-Insured Group Health Plans 2025](https://www.dol.gov/sites/dolgov/files/EBSA/researchers/statistics/retirement-bulletins/annual-report-on-self-insured-group-health-plans-2025.pdf)

## 한 사람의 치과 이용이 데이터가 되는 과정

미국 기업 치아 플랜의 기본 흐름은 다음과 같습니다.

1. 기업 또는 benefits administrator가 누가 플랜 대상인지 정리한 자격 파일을 제공합니다. 널리 쓰이는 형식이 X12 834입니다.
2. 대상 임직원은 플랜의 네트워크와 조건을 확인하고 치과를 이용합니다.
3. 치과는 제공한 서비스의 청구 정보를 보냅니다. 치과 청구에 쓰이는 형식이 X12 837D입니다.
4. 플랜의 처리 주체는 플랜 규칙을 적용해 허용액, 본인부담, 플랜 지급액을 나눠 계산합니다. 이 세 값은 서로 합치지 않습니다.
5. 임직원은 누가 얼마를 부담하도록 처리되었는지 보험 급여 처리 명세서인 EOB(Explanation of Benefits)에서 확인합니다. 지급과 정산의 응답에는 X12 835가 쓰일 수 있습니다.

이 흐름에서 서로 다른 원천은 같은 사람을 가리켜야 합니다.

```text
기업 또는 benefits administrator의 자격 파일
                  ↓
        ICLO 이용·동의·촬영 이벤트
                  ↓
          TPA의 치과 청구 결과
                  ↓
       기업별 집계 지표와 확인 가능한 근거
```

공통 식별키가 없으면 자격자, 앱 이용자, 청구 완료자를 연결할 수 없습니다. 참여와 완료를 한 숫자로 이어 붙이려면 공통 식별키뿐 아니라 서로 다른 기준 시점도 함께 기록해야 합니다.

청구 데이터는 진료가 일어난 달에 모두 확정되는 월별 장부가 아닙니다. 진료 뒤 청구가 제출되고 처리되는 동안 같은 진료월의 기록이 뒤늦게 추가되거나 상태가 달라질 수 있습니다. 따라서 이번 달 화면의 청구 숫자는 아직 완성되지 않은 숫자입니다. 자격 파일에서 퇴사로 자격이 끝난 사람도 재직 중 받은 진료의 청구가 나중에 들어올 수 있습니다. 퇴사자를 곧바로 계산에서 지우면 이런 run-out 청구가 빠져 완료와 비용의 추세를 잘못 읽을 수 있습니다.

그래서 진료 발생 시점, 청구 처리 시점, 자격 기준 시점을 분리하고 어느 시점까지 들어온 청구를 집계했는지 함께 밝혀야 합니다. 이 조건을 빼면 기업 화면은 그럴듯해 보여도 근거를 재현할 수 없습니다. 합성 데모의 청구 지연은 화면 동작을 설명하는 표시값일 뿐이며, 실데이터에서는 실제 지연 분포의 출처와 기준 시점을 따로 정해야 합니다.

## ICLO가 확인하려는 것은 성과 약속이 아니라 근거의 연결입니다

ICLO의 제안은 기업이 다음 질문에 같은 기준으로 답할 수 있는 근거를 만드는 것입니다.

- 기준 시점에 플랜 자격이 있는 임직원은 누구인가.
- 그중 가입과 첫 문진을 마친 비율은 얼마인가.
- 촬영 품질 게이트를 통과한 참여는 얼마인가.
- 조치가 발생한 뒤 어떤 완료가 치과 청구로 확인되었는가.
- 기업별 집계를 만들 때 개인 노출과 작은 셀을 어떻게 막는가.

이 질문들은 비용 절감을 보장하지 않습니다. 첫해 절감도 약속하지 않습니다. 예측 모델의 대상과 실험군 배정도 아직 정하지 않았습니다. 실험군 배정은 법무와 프로토콜 승인이 있기 전에는 범위에 넣지 않습니다. 완료는 청구로 확인되고 confidence가 HIGH인 경우에만 `Completed actions`로 센다는 것이 현재 설계입니다.

## 오늘 확인할 수 있는 것은 합성 대시보드뿐입니다

현재 실행되는 유일한 산출물은 브라우저에서 합성 숫자를 계산하는 임직원 대시보드 데모입니다. 실데이터와 Snowflake 연결은 없습니다. 데모는 화면과 지표의 뜻을 맞추기 위한 대화 도구이지, 고객 결과나 시장 기준치가 아닙니다.

데모의 화면 이름은 다음과 같습니다.

| 탭 | 화면 제목 | 질문 |
|---|---|---|
| `Overview` | `Program overview` | 자격, 참여, 조치의 전체 흐름은 어떤가 |
| `Signals` | `Oral-health signal distribution` | 집계 신호 분포는 어떤가 |
| `Funnel` | `Intervention funnel` | 참여가 조치와 청구 확인 완료로 어떻게 이어지는가 |

시나리오와 모든 표시값에는 다음 라벨을 적용합니다.

| 구분 | 표시 |
|---|---|
| A / B / C | `Synthetic data — illustrative only` |

합성 데모의 핵심 값은 아래와 같습니다. 이 값들은 예시 계산을 보여줄 뿐, 실제 기업의 성과를 주장하지 않습니다.

| 화면 라벨 | 합성 데모 값 | 뜻 |
|---|---:|---|
| `Eligible employees` | 선택한 시나리오의 자격자 수 | 기준 시점에 플랜 자격이 있는 임직원 |
| `Activated (registered + first questionnaire)` | 38% | 가입과 첫 문진 완료 / 자격자 |
| `Valid capture (passed photo-quality gate)` | 28% | 품질 게이트를 통과한 촬영 |
| `Open care actions` | 9.5% | 발생한 조치 |
| `Completed actions` | 4.2% | 청구로 확인된 완료 |
| `Repeat participation` | 61% | 유효 촬영을 두 번 이상 한 사람 / 활성 사용자 |

`Signals`의 합성 분포는 Low 52%, Moderate 33%, Priority 15%입니다. A는 자격자 10,000명과 PMPM 31.4, B는 자격자 2,500명과 PMPM 32.8, C는 자격자 25,000명과 PMPM 30.9를 사용합니다. PMPM(per member per month)은 가입자 한 명당 월 비용 표시입니다. 데이터 완전성 98.4%, 청구 지연 60일도 합성 데모 표시값입니다.

기업 화면은 집계 전용으로 설계합니다. 최소 셀은 행 수가 아니라 고유 인물 기준 `n ≥ 20`이며 기업별로 격리합니다. 기업 화면에는 개인 단위 PHI를 두지 않습니다. 다만 가입자-월, 청구 항목, 앱 이벤트를 계산하는 관리형 처리 레이어에는 개인 수준 레코드가 존재합니다. 통제 대상은 데이터가 존재하는지 여부가 아니라 누가 읽을 수 있는지입니다.

## 왜 Snowflake인가

이 제안에서 Snowflake의 역할은 결과를 보장하는 것이 아니라, 기업별 근거를 같은 통제 기준 아래에서 다룰 수 있는지 설계로 확인하는 데 있습니다. 다음 세 통제는 Snowflake가 제공할 수 있는 범위와 그 통제에서 기대하는 효과를 구분해서 봐야 합니다.

| 설계 과제 | Snowflake에서 정렬할 통제 범위 | 기대 효과 | 보장하지 않는 것 |
|---|---|---|---|
| 기업 간 격리 | 행 접근 정책을 기업 식별자와 승인된 역할에 연결해 테이블·뷰의 쿼리 결과에 포함할 행을 통제합니다. | 같은 근거 레이어를 사용하더라도 기업 화면 사이의 노출 경계를 일관되게 적용할 수 있습니다. | 잘못된 기업 식별자 매핑이나 과도한 권한 부여까지 자동으로 바로잡지는 않습니다. |
| 고유 인물 기준 최소 셀 | 엔터티 키가 지정된 집계 정책에 `n ≥ 20`을 두어, 화면이 아니라 데이터베이스 쿼리 계층에서 최소 셀을 강제하는 설계를 검토합니다. | 대시보드와 후속 소비자가 같은 최소 셀 규칙을 따르게 할 수 있습니다. | 엔터티 키가 사람을 정확히 가리킨다는 점이나 승인된 예외 역할의 적절성은 별도로 검증해야 합니다. |
| 데이터 권리 경계 | Secure Data Sharing으로 제공자가 허용한 객체를 복사 없이 읽기 전용으로 공유하는 방식을 데이터 제공 경로의 후보로 검토합니다. | 원본 복사본의 확산을 줄이고 제공자와 소비자의 접근 경계를 계약 조항에 맞춰 설계할 수 있습니다. | 공유 기능 자체가 기업과 TPA 사이의 데이터 권리를 만들거나 HIPAA 역할을 결정하지는 않습니다. |

행 접근 정책은 쿼리 결과의 행을 통제하고, 엔터티 키를 둔 집계 정책은 고유 인물 기준의 최소 그룹을 강제할 수 있습니다. Secure Data Sharing은 선택한 객체를 복사 없이 읽기 전용으로 공유합니다. [Snowflake, Row access policies](https://docs.snowflake.com/en/user-guide/security-row-using), [Snowflake, Entity-level privacy with aggregation policies](https://docs.snowflake.com/en/user-guide/aggregation-policies-entity-privacy), [Snowflake, About Secure Data Sharing](https://docs.snowflake.com/en/user-guide/data-sharing-intro)

기대 효과가 실제로 성립하려면 기업 식별자와 공통 식별키의 품질, 역할 매핑, 예외 권한, 집계 정책, 공유 객체를 함께 검증해야 합니다. 데이터 권리와 HIPAA 역할은 플랫폼 설정이 아니라 서면 합의가 먼저입니다.

## 현재 상태(status)

설계 문서와 실행 중인 제품을 구분해야 합니다. 현재 상태는 다음과 같습니다.

| 구분 | 현재 상태 |
|---|---|
| 오늘 실행 중 | 임직원 대시보드 데모 하나. 합성 숫자를 브라우저 안에서 계산하며 실데이터와 Snowflake 연결은 없음 |
| 설계됨 | 근거 레이어 데이터 모델, 신원 해석 규칙, 정책·품질 계약, 기업 온보딩 절차, 추론 API 계약 |
| 90일 구축 대상 | 미국 HLS GTM·아키텍처 담당자와의 연결 및 검증 상대 확정, 근거 레이어 아키텍처 설계와 Snowflake 보안 기준 정렬, 네 start_gates의 책임자 지정과 종결 경로 합의 |
| 존재하지 않음 | 임직원 웹앱, Core AI 호출 경로, 급여 게이트웨이(X12 270/271) |
| 결정되지 않음 | 예측 모델의 예측 대상, 실험군 배정, 가족·보호자 권한의 전체 흐름 |

이 90일은 Snowflake 관계와 설계가 성립하는지 확인하는 기간입니다. 치아 PoC 자체를 검증하거나 실데이터를 적재하는 기간이 아닙니다. 존재하지 않는 세 항목도 별도 트랙이며 90일 계획에 포함되지 않습니다. 이 구분을 유지해야 향후 설계를 오늘의 운영 상태처럼 오해하지 않습니다.

## 실데이터 전에 닫아야 할 착수 게이트(start_gates)

아래 네 게이트는 모두 열려 있습니다. 실데이터를 적재하기 전에 각각의 결론과 책임자를 서면으로 확정해야 합니다.

| 착수 게이트 | 서면으로 정할 내용 | 열린 채로 진행할 때의 문제 |
|---|---|---|
| HIPAA 역할 규정 | ICLO, 기업, 기업 건강플랜, TPA, Snowflake가 각각 covered entity, business associate, subcontractor 중 무엇인지 판정합니다. BAA 체인은 이 판정 위에 세웁니다. | PHI를 적재할 법적 근거가 없습니다. |
| 데이터 권리 | 기업과 TPA 계약에서 원천별, 필드별, 목적별로 무엇을 받고 무엇에 쓸 수 있는지 정합니다. | 데이터를 받고도 쓸 수 없습니다. |
| 동의 이전 기준선 적재 | 기준선이 동의보다 먼저 필요한 구조를 검토합니다. 집계 전용 기준선을 택하거나 별도 법적 근거를 서면으로 정합니다. | 비동의자의 PHI를 근거 없이 처리하게 됩니다. |
| 공통 식별키 | 인사 쪽과 TPA 쪽에 같은 사람을 안정적으로 연결할 키가 있는지 정합니다. | 청구와 앱 이용을 연결할 수 없어 청구로 확인된 완료라는 주장 자체가 성립하지 않습니다. |

플랫폼 설정만으로 이 게이트들이 닫히지는 않습니다. 먼저 역할, 계약, 동의 기준, 식별 책임을 정한 뒤 그 결정을 구현해야 합니다.

## 연결 이후의 범위

Step 0이 완료되면 ICLO와 지정된 미국 HLS GTM·아키텍처 담당자는 90일 동안 관계와 설계가 성립하는지 확인합니다. 이 기간의 산출 범위는 다음 세 가지입니다.

- 미국 HLS GTM·아키텍처 담당자와의 연결 및 검증 상대 확정
- 근거 레이어 아키텍처 설계와 Snowflake 보안 기준 정렬
- 네 start_gates의 책임자 지정과 종결 경로 합의

실데이터 적재는 이 90일에 포함되지 않습니다. 네 착수 게이트가 모두 서면으로 닫힌 뒤에 시작하는 별도 단계입니다. 90일 안에는 합성 데모를 사용해 지표 정의, 기업 집계 경계, 필요한 입력 필드, Snowflake 통제 설계를 검토합니다. 검토 결과가 나오기 전에는 절감, 장기 성과, 특정 기업군에 대한 적합성을 단정하지 않습니다.

## Step 0 완료 정의

Snowflake Korea의 현재 스타트업 담당자가 다음 두 역할을 지정해 ICLO와 연결하면 Step 0이 완료됩니다.

- 미국 HLS GTM 담당자
- 미국 HLS 아키텍처 담당자

이 연결에는 투자, 구매, 실데이터 제공, 90일 구축 승인이 포함되지 않습니다. 다음 대화에서 확인할 것은 검증 상대, 착수 게이트의 책임자, 미국 기업 치아 플랜에 맞는 설계 범위입니다.

## 근거와 사실 경계

- self-funded / ASO / stop-loss와 fully insured의 구분: [미국 노동부, 2025 연례 보고서](https://www.dol.gov/sites/dolgov/files/EBSA/researchers/statistics/retirement-bulletins/annual-report-on-self-insured-group-health-plans-2025.pdf)
- 치아 보장과 플랜 설계: [HealthCare.gov, Dental coverage](https://www.healthcare.gov/coverage/dental-coverage/), [미국치과의사협회, Benefit plan designs](https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs)
- 한국의 공적 건강보험 비교 기준: [국민건강보험공단, National Health Insurance Benefits](https://www.nhis.or.kr/english/wbheaa02600m01.do)
- Snowflake 통제 범위: [행 접근 정책](https://docs.snowflake.com/en/user-guide/security-row-using), [엔터티 키를 둔 집계 정책](https://docs.snowflake.com/en/user-guide/aggregation-policies-entity-privacy), [Secure Data Sharing](https://docs.snowflake.com/en/user-guide/data-sharing-intro)
- 합성 데모: [ICLO HomeDen Employer Analytics](https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/)

외부 출처는 미국 플랜의 기본 구조와 Snowflake 기능의 통제 범위를 뒷받침합니다. ICLO 대시보드의 수치는 모두 합성 데모 값이며 외부 연구 결과가 아닙니다. 출처가 확인되지 않은 장기 성과 시점, 이직률에 따른 기업 적합성, 시장 보편성을 이 제안서의 사실로 사용하지 않았습니다.
