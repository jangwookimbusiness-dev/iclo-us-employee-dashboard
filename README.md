# ICLO Employer Dashboard

US self-funded employers를 위한 구강 건강 프로그램 집계 데모입니다.
참여와 진료 권고를 동일인의 청구 확인 결과에 연결하는 제품을 검토합니다.

> **Synthetic data — illustrative only.** 모든 값은 합성 예시이며 고객 성과 증거가 아닙니다.

공개 GitHub Pages는 인쇄된 QR의 목적지를 보존하는 리다이렉트 하나만 제공합니다.
[Pages](https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/)는
[외부 사이트](https://grin-mauve.vercel.app/)로 이동합니다. 데모 화면은 로컬에서 실행합니다.

## 실행

```bash
make setup
make check
make serve
```

Python 3.14.7과 Chrome/Chromium이 필요합니다.
기업 화면은 `http://localhost:8000/employer.html`, 임직원 화면은 `http://localhost:8000/member.html`입니다.
상세 환경 설정은 [SETUP.md](employer-dashboard-poc/SETUP.md)를 참고하세요.

Python/PyYAML 빌더가 `screens/*.html.in`과 정본을 읽어 `build/`에 HTML과 JSON을 생성합니다.
프레임워크나 npm 애플리케이션은 없습니다. JSON fetch를 사용하므로 `file://`로 열지 않습니다.

## 현재 화면

기업 화면은 Overview·Signals·Funnel 탭과 부서 필터를 제공합니다 (`?tab=`, `?dept=`).
기본 시나리오 A를 표시하며, A/B/C 시나리오는 정본·합성 생성기·검사에 있습니다.
시나리오 전환, 분모 렌즈, 원천 칩은 A3 export 연결 단계에 남아 있습니다.
참여 퍼널과 조치 잔량·완료 수를 구분합니다. 완료 수는 완료율이 아닙니다.

- 기업 열람은 집계만 허용합니다. 개인 PHI와 개인 점수는 표시하지 않습니다.
- 최소 셀 미만 값은 수치·비율·막대와 함께 억제하고 이유를 표시합니다.
- 신호 라벨은 Low·Moderate·Priority이며 양쪽 화면 모두 숫자 점수 대신 밴드를 표시합니다.
- 값과 규칙은 `contracts/proposal-package-v11.yml`에서 읽습니다.

## 개발과 검토

Snowflake 협업 제안 v14는 [한국어](output/proposal-v14/proposal-KO.md)와
[영어](output/proposal-v14/proposal-EN.md)로 제공합니다. 본문에는 소프트웨어·데이터 구조 개요를,
[한국어 기술 부록](output/proposal-v14/architecture-KO.md)과
[영어 기술 부록](output/proposal-v14/architecture-EN.md)에는 상세 설계를 담았습니다.
[문서 안내](output/proposal-v14/README.md)에서 PDF와 작성 기준을 확인할 수 있습니다.

`make check`는 CI와 같은 11개 명령을 실행합니다. `make docs`는 관리 대상 PDF를 재생성합니다.
제안서 PNG는 동결 자산입니다. `scripts/build/`의 과거 생성기는 현행 빌드 경로가 아닙니다.

- [현재 구조와 A3/A2 목표](employer-dashboard-poc/docs/ARCHITECTURE.md)
- [제품 요구](employer-dashboard-poc/docs/PRD.md)
- [랜딩페이지 한·영 카피와 구현 명세](employer-dashboard-poc/docs/LANDING-PAGE.md) · [디자인 제안](DESIGN.md) — #82 승인 대기; 페이지 미구현
- [재구축 헌장](REBUILD-CHARTER.md)
- [공유 이슈](https://github.com/jangwookimbusiness-dev/iclo-us-employee-dashboard/issues) · [백로그 정책](BACKLOG.md)
- [기여 절차](CONTRIBUTING.md) · [산출물 정책](ARTIFACTS.md)

작업은 이슈와 feature branch에서 시작하고, 다른 모델의 검토 후 Jangwoo Kim이 병합을 결정합니다.
Pages 산출물은 `scripts/build_pages_site.py`가 허용한 `_site/index.html` 하나입니다.
