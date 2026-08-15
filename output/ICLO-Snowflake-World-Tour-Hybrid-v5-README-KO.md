# ICLO × Snowflake World Tour Seoul 2026 — Hybrid v5

v4에 대한 정정 패스입니다. 새로운 주장이나 자산은 없습니다.

## v5에서 바뀐 것

**Slide 5 — J-curve 차트 삭제.** v4는 Year 1 정점 뒤 Year 2·Year 3으로 내려가는 4점 꺾은선을 그렸습니다. 제목("No year-one savings promise")은 1년차만 부인하지만 그림은 2-3년차 회수를 약속했고, 같은 슬라이드 본문은 "measurable"(측정 가능)이라고만 해서 그림이 글보다 많이 주장하는 상태였습니다. 공동 검증 제안서는 이 지점을 "Direction unknown / 방향은 고객 데이터로 검증"으로 못박고 있어, 두 자료가 정면으로 어긋났습니다. 차트를 빼고 Year 1 / Years 2-3 / Turnover 세 블록을 3열로 재배치했습니다.

**Slide 6 — 미검증 문구 교체.** "Dental-benefit collaboration validation in progress / 치아보험·임직원 복지 협업 과제 검증 중"은 어느 출처로도 뒷받침되지 않습니다(`proposal-v10/04_QA/Sources-v10.md` 참조). 같은 문장을 v10 한국어 리포트에서 이미 삭제했으므로 부스 덱도 맞춥니다. 대체 문구: "Program selection only — not a completed partnership, integration or outcome. / 선정 사실만 해당하며, 완료된 제휴·연동·성과를 의미하지 않습니다."

**Slide 4 — 대시보드 스크린샷 재촬영.** v4 스크린샷은 오른쪽 끝이 잘려 `completeness 98.4% (synthetic` 에서 닫는 괄호가 없고 "Synthetic data — illustrative only" 표시도 잘렸습니다. 원인은 `index.html`의 `.hrow`/`.ctxrow`/`.frow`가 `padding: <v> 0` 축약형으로 `.wrap`의 좌우 28px 패딩을 덮어쓴 것이었고, 소스에서 `padding-block`으로 고쳤습니다. 이미지가 세로로 길어져 하단 캡션과 겹치므로 원래 아래 경계를 유지한 채 폭을 좁혀 배치했습니다.

## 이전 문서와의 관계

`...Hybrid-v2-README-KO.md`, `...Hybrid-v2-Instruction-Check-KO.md`는 **v2 기준 문서**입니다. 실제 배포 덱은 v3(부스 확장) → v4(로고 락업 수정) → v5로 갔는데 문서는 v2에 머물렀습니다. 특히 v2 README의 "검수 결과: PPTX overflow 0 / template-fidelity 0 / PDF 7페이지 개별 시각 검수 완료"는 **v2에 대한 것이며 v4·v5에서 재검증되지 않았습니다.** v4의 잘린 스크린샷이 그 기간에 통과한 예입니다.

CEO 패널 Talk Track v2는 내용상 v5와 충돌하지 않습니다. "비용 절감 효과가 있습니까?" 답변이 이미 "첫해 절감을 약속하지 않습니다 … 장기 변화를 측정해야 합니다"로 방향을 단정하지 않기 때문입니다. 그대로 사용 가능합니다.

## 파일

- `pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v5.pptx`
- `pdf/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v5.pdf`
- 빌드 스크립트: `tmp/iclo-snowflake-hybrid-v5/build_booth_v5.mjs`

부스 영상·백월 자산은 v4에서 변경 없음.

## 검수 결과 — v5 기준

- 7장, 16:9
- 슬라이드 4·5·6 렌더 개별 확인
- PDF 텍스트 대조: "Program selection only" 존재 / "validation in progress" 부재 / 차트 축 라벨(Baseline·Year 3) 부재 확인
- Slide 4 스크린샷 우측 끝 잘림 해소, 하단 캡션과 겹침 없음
- 1·2·3·7장은 v4에서 변경 없음 — **개별 재검수하지 않았습니다**

## 남은 판단 사항

- **공동 브랜딩.** 전 슬라이드에 `ICLO × snowflake` 락업이 있습니다. 제안서에 로고를 쓰는 건 결정된 사항이지만, 공개 부스는 QA 체크리스트가 유보해둔 "broad external distribution"에 해당합니다.

**QR 대상지 확인 완료 (2026-08-07).** slide 7의 QR을 배포 PDF에서 추출해 디코드한 결과 `https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/`이며, 대상지는 200을 반환합니다. 원본 asset(`tmp/iclo-world-tour-v1/assets/demo-qr.png`)과 제안서 slide 8의 QR도 같은 값입니다. 어느 빌드 스크립트도 이 이미지를 생성하지 않으므로(스크립트의 `DASHBOARD_URL` 상수는 발표자 노트와 `booth-content.json`에만 사용됨) 소스로는 검증할 수 없고, asset을 교체할 때마다 다시 디코드해야 합니다.

청중 정합성(부스 1차 청중과 제안서 PoC 범위의 차이)은 검토에서 제외하기로 했습니다.
