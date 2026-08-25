# 바이너리 인벤토리 — 이슈 #23 수락기준 1

생성: `scripts/docs_build.py` 결정화 커밋 시점 · `.git` 183M · HEAD `1fa8739`

이 문서는 **인벤토리만** 담는다. Release 발행·미러·`git filter-repo` 는 #23 의
수락기준 2~5 이고, 되돌리기 어렵거나 밖으로 나가는 일이라 별도 승인 전에 하지 않는다.

## 요약

1MiB 초과 blob **58개**, 합계 **201.1 MiB**.

| 구분 | 경로 | 판본 | MiB | 비중 |
|---|---:|---:|---:|---:|
| 관리 산출물 — 유지 | 2 | 34 | 110.0 | 55% |
| 추적 중, 비관리 — #23 대상 | 16 | 16 | 53.2 | 26% |
| 삭제됨 — 히스토리 무게만 | 8 | 8 | 37.9 | 19% |

## 이슈 #23 의 전제가 틀렸다

이슈는 *"가장 큰 히스토리 blob 은 11.9MiB 배송 ZIP 이고, PDF 몇 개가 여러 판을 갖는다"* 라
적었다. 인벤토리는 **비중이 반대**라고 말한다.

지배 항목은 배송 번들이 아니라 **관리 산출물 PDF 두 개의 재빌드 이력**이다.
그 둘은 Release 로 옮길 수 없다 — `test_doc_freshness.py` 가 해시를 대조해야 하고
`ARTIFACTS.md` 가 "소스와 함께 검토돼야 하는 현재 PDF" 를 git 에 두라고 정했다.

| 경로 | 판본 | MiB |
|---|---:|---:|
| `output/proposal-v10/06_Tech/ICLO-Evidence-Layer-DB-설계-KO.pdf` | 13 | 58.8 |
| `output/proposal-v12/ICLO-Snowflake-제안서-v12-KO.pdf` | 21 | 51.2 |
| `output/ICLO-Snowflake-Joint-Validation-Proposal-Package-v10.zip` | 1 | 11.4 |
| `output/pptx/ICLO-Snowflake-World-Tour-BPrime-US-Access-Loop-v1.pptx` | 1 | 7.6 |
| `proposal-v11/pdf/ICLO-Snowflake-제안서-v11-본문-KO.pdf` | 1 | 7.5 |
| `output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v5.pptx` | 1 | 5.4 |

## 그래서 먼저 한 것 — 재빌드를 결정적으로

원인은 판본 수가 아니라 **같은 내용을 다시 빌드해도 바이트가 달라지는 것**이었다.
측정: 같은 소스로 두 번 빌드하면 크기는 동일하고 다른 바이트가 4개, 전부
`/CreationDate`·`/ModDate`. 날짜를 고정한 뒤에도 59바이트가 남았고 그것은
트레일러의 `/ID [<..><..>]` — PDF 작성기가 저장마다 난수로 만드는 값이다.

`scripts/docs_build.py` 의 `normalize_pdf_dates()` 가 셋을 다 처리한다.
날짜는 소스 digest 에서 유도하고(내용이 같으면 같고 다르면 다르다), XMP 를 비우고,
`/ID` 를 같은 길이의 결정적 값으로 바꾼다. 검증: PDF 4종 전체 재빌드를 두 번
연달아 해도 합산 해시가 동일 — **히스토리 증가 0**.

이것이 `ARTIFACTS.md` 가 우선이라 말한 *"문제가 더 커지지 않게 하는 forward guard"* 다.
과거 110.0 MiB 는 그대로 남지만 앞으로는 안 늘어난다.

## #23 이 실제로 겨냥해야 하는 것

`추적 중, 비관리 — #23 대상` 16개 / 53.2 MiB.
전부 폐기된 트랙의 산물이다 — World Tour 부스 PPTX·PNG, HLS 제안 번들,
v10/v11 배송본. 부스는 2026-08-13 에 폐기됐다(정본 `superseded` 와 CEO 계획 §5 참조).

| 경로 | MiB | 성질 |
|---|---:|---|
| `output/ICLO-Snowflake-Joint-Validation-Proposal-Package-v10.zip` | 11.4 | 배송 번들 |
| `output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v5.pptx` | 5.4 | 부스 (폐기) |
| `output/ICLO-Snowflake-HLS-Proposal-Package-v2.zip` | 5.2 | 배송 번들 |
| `output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Backwall-850x300mm-Bilingual-v3.png` | 4.7 | 부스 (폐기) |
| `output/pptx/ICLO-Snowflake-HLS-Proposal-External-Briefing-v2.pptx` | 4.1 | 기타 |
| `output/proposal-v10/01_KO_Internal/ICLO-Snowflake-Joint-Validation-Proposal-v10-KO-Internal.pptx` | 3.7 | 발송된 덱 |
| `output/proposal-v10/02_EN_External/ICLO-Snowflake-Joint-Validation-Proposal-v10-EN-External-Notes-Stripped.pptx` | 3.7 | 발송된 덱 |
| `proposal-v11/images/us-dental-back-office.png` | 2.0 | 기타 |
| `output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Backwall-850x300mm-Bilingual-v3.pptx` | 2.0 | 부스 (폐기) |
| `proposal-v11/images/us-dental-reception.png` | 1.8 | 기타 |
| `output/pdf/ICLO-Snowflake-Briefing-Meeting-Pack-v1.pdf` | 1.8 | 기타 |
| `output/imagegen/ICLO-World-Tour-Photoreal-Collaboration-v1.png` | 1.8 | 부스 (폐기) |
| `output/imagegen/ICLO-World-Tour-Photoreal-Hero-v1.png` | 1.7 | 부스 (폐기) |
| `output/pdf/ICLO-Snowflake-HLS-Proposal-External-Briefing-v2.pdf` | 1.5 | 기타 |
| `output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Booth-Loop-Bilingual-v4.mp4` | 1.3 | 부스 (폐기) |
| `output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Backwall-850x300mm-Bilingual-v3.pdf` | 1.1 | 부스 (폐기) |

`삭제됨 — 히스토리 무게만` 8개 / 37.9 MiB — 이미 트리에 없고
히스토리에만 있다. 이 몫은 Release 로 옮길 대상이 아니라 `filter-repo` 로만 회수된다.

**회수 가능 상한: 91.1 MiB** (관리 산출물 제외).
`.git` 183M 기준으로 절반 정도다.

## 남은 수락기준과 그 순서

2~5 는 되돌리기 어렵다. `ARTIFACTS.md` 가 정한 순서를 그대로 따른다 —
미러 확보 → Release 링크·체크섬 목록 → 전환 공지 → 롤백 시험 → 그 다음에야
`filter-repo`. 강제 푸시는 그 넷이 다 서기 전에는 안 한다.

**결정이 필요한 것 하나.** 위 16개 중 폐기 트랙 산물은
Release 로 **보존할 가치가 있는지부터** 정해야 한다. 부스 자산은 2026-08-13 에
폐기된 트랙의 것이고, 보존한다면 그 이유가 기록돼야 하며, 안 한다면 `filter-repo`
한 번으로 55.9 MiB 가
정리된다. 그 판단은 사람이 한다.
