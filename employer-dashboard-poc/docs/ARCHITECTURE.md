# 서비스 아키텍처

현재 실행 구조 기준: 2026-09-06 · `PROJECT_PHASE=demo`.
값과 규칙의 정본은 `contracts/proposal-package-v11.yml`, 제품 요구는 `PRD.md`,
재구축 결정은 루트 `REBUILD-CHARTER.md`다. 이 문서는 현재와 목표의 실행 경계를 설명한다.

## 현재 실행되는 경로

```text
contracts/proposal-package-v11.yml + screens/*.html.in
                       │
              scripts/build_screens.py
                       │
                       ├─ build/employer.html + canon.json
                       └─ build/member.html + member-canon.json + member.json
                                                                    ↑
                                                        data/member-demo.json
                       │
                 로컬 HTTP 서버 → 브라우저 fetch
```

Python 3.14/PyYAML 빌더가 정본을 읽고 허용된 필드만 JSON으로 내보낸다.
HTML 제목과 CSS 색은 빌드 시 치환하고, 화면 값은 같은 디렉터리의 JSON을 읽는다.
`--canon`과 `--out`으로 같은 빌드 경계를 임시 입력에도 적용한다. 생성물은 손으로 고치지 않는다.
프론트엔드 프레임워크, 앱 백엔드, 실제 인증, Snowflake 연결은 없다.

기업 화면에는 Overview·Signals·Funnel 탭과 부서 필터가 있다. `?tab=`·`?dept=`를 지원하며,
브라우저에서는 기본 시나리오 A를 표시한다. A/B/C 합성 시나리오는 정본과 생성기·검사에 있다.
시나리오 전환·분모 렌즈·원천 칩은 A3 export 배선에서 복귀한다.
부서 값은 전사 비율을 적용한 합성 예시이며 화면에 그 한계를 표시한다.
참여 퍼널은 자격자→참여자→유효 촬영자다. 현재 미완료 조치와 성숙 코호트 완료는 별도 수치이며 완료율이 아니다.

임직원 화면은 합성 프로필, 본인의 밴드·방향, 동의 상태와 예약 단계의 예시다.
브라우저의 동의 판정은 데모 동작이며 운영 보안 경계가 아니다.
양쪽 화면의 합성 고지, 밴드 표시, 최소 셀 억제와 외부 문자열 이스케이프를 유지한다.

`make serve`는 화면을 빌드하고 `http://localhost:8000/employer.html`과
`http://localhost:8000/member.html`을 제공한다. JSON fetch 때문에 `file://`로 열지 않는다.

## 공개 배포 경로

```text
pages-root-redirect.html → scripts/build_pages_site.py → _site/index.html
                                                        │
                              GitHub Pages → grin-mauve.vercel.app
```

공개 산출물은 QR 코드의 목적지를 보존하는 리다이렉트 하나다. 화면과 개인 합성 JSON은 공개하지 않는다.
`.github/workflows/gates.yml`의 검사가 통과한 main만 Pages를 배포한다.
`test_pages_root.py`가 산출물 allowlist와 실제 리다이렉트를 확인한다.
제안서 PNG 12장은 동결 자산이며 현행 화면의 최신 캡처가 아니다.

## A3 목표: 합성 데이터를 거버넌스 경계까지 통과시키기

```text
합성 생성기 → RAW → STAGED → CANONICAL
                                │
          사람·기업·월별 MART / 사람·기업·보고월별 신호
                                │
             행 접근 + 집계 정책(고유 인물) + 마스킹
                                │
                   기업별 역할로 내보내기
                                │
          employer-a/b/c.json + 부서 카탈로그 → 회차 검증 → 집계 화면
```

생성기와 로컬 검사는 있지만 Snowflake에서 이 경로를 실행한 증거는 아직 없다.
실행은 #2/#5/#7/#8/#10 범위다. SQL 정본은 기술문서에 있으며 로컬 관계 연산 검증은
Snowflake DDL·역할·정책 실행을 대신하지 않는다.

금액은 자격 span과 청구를 각각 사람·기업·월로 접은 뒤 결합한다.
신호는 기업 맥락 안에서 최신 유효 촬영을 선택하고, 롤링 창은 보고월 포함 `[M-11, M+1)`이다.
기업에 개인 PHI를 전달하지 않으며, DB 정책은 서로 다른 사람을 세어 최소 셀을 강제해야 한다.
인접 억제는 위험한 쌍의 양 끝에 적용한다. 큰 기업도 연속 월 인원 차이가 작으면 억제되므로
기업 규모만으로 보고 가능성을 보장하지 않는다.

export의 grain은 기업×월×부서다. 연속된 36개 월을 내보내며 행 수는 부서 수에 따라 달라진다.
회차·스키마·스냅샷, 값의 유효성, 키 유일성, 카탈로그 대응을 검증하고 부분 릴리스를 거부한다.
측정값·신선도는 export 소유로 옮기고 정적 화면 계약은 정본에서 계속 빌드한다.
합성 고지는 phase가 아니라 각 export의 `synthetic` 필드를 따른다.
현재 Pages allowlist는 이 작업만으로 확대하지 않는다. 전달 경로와 원자적 발행은 A3 구현 범위다.

## A2 목표: 운영 권한과 개인 처리 경계

1차 범위는 임직원 본인, 자격 매칭과 관리형 IdP의 OTP다 (`AUTH-APPROACH`).
IdP 제품 선정은 #66에 남아 있다. 가족 대리접근은 2차다.
앱 백엔드가 매 요청의 신원·권한·목적별 동의와 세션을 판정하고 통제 사진 저장소와 Core AI를 연결한다.
개인 처리 결과는 분석 계층으로 적재되지만 기업 전달은 인증된 비공개 집계 경로만 사용한다.
사진·점수·청구 라인이 내부에 존재한다는 사실과 기업에 집계만 보인다는 약속은 별개다.
실데이터는 정본의 착수 게이트가 충족된 뒤에만 적재한다.

## 검증 범위

`make check`는 CI와 같은 11개 명령을 실행한다. 목록은 Makefile과 CI가 소유한다.
`test_build_reads_canon.py`는 정본 변조→빌드→DOM과 억제를 확인한다.
`test_tech_sql.py`는 선언된 컬럼 참조와 source SELECT의 관계 연산 반례를 확인한다.
`test_export_contract.py`는 demo에서 export 부재를 명시적으로 SKIP하고 A3/A2에서는 실패시킨다.
`test_export_contract_cases.py`는 임시 릴리스로 실패 경로를 검증한다.
`make docs`는 등록된 PDF만 재생성하며 `test_doc_freshness.py`가 원본·PDF 해시를 대조한다.
