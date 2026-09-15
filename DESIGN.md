# ICLO Landing — design system proposal

> 2026-09-08 · #82 · 승인 대기. 적용 후보는 새 기업용 랜딩페이지다.
> 기존 기업/임직원 앱, 신호 색 의미, AGENTS 지침을 일괄 변경하지 않는다.
> 카피/배치는 [LANDING-PAGE.md](employer-dashboard-poc/docs/LANDING-PAGE.md), 제품 경계는 [PRD.md](employer-dashboard-poc/docs/PRD.md).

## 방향: 근거를 읽게 하는 편집형 페이지

큰 문제 문장, 대응되는 before/after, 실제 제품 화면을 연결한다. 스톡 사진·추상 AI 이미지보다 독자가 확인할 수 있는 화면이 중심이다. 차분하고 직접적이며 “즉시 완성된 서비스”보다 “검토할 근거가 있는 개발 중 제품”의 인상을 준다.

안전한 선택 두 가지: 기존 Navy/Coral/Teal 유지, 왼쪽 정렬의 텍스트 우선 구조.
차별화할 선택 두 가지: Hero 옆 실제 합성 화면, 성과 숫자 대신 판단의 before/after를 크게 보여 주는 비교 구획.
전자는 장식적 화려함을 줄이지만 제품 정체성을 바로 보여 준다. 후자는 숫자 배지보다 읽을 내용이 늘지만 아직 없는 실적을 약속하지 않는다.

## 시각 토큰 — 제안값과 기존 정본의 구분

| 역할 | 값/규칙 | 소유/주의 |
|---|---|---|
| 주요 텍스트 | Navy `#1B2A4A` | 기존 브랜드 |
| 주 행동 | Coral `#C2333A`, 흰 글자 | Coral 정본과 일치 유지; 신호 Priority 의미를 다른 밴드로 바꾸지 않음 |
| 보조 링크/강조 | Teal `#007A87` | 링크는 밑줄로도 구분 |
| 기본 표면 | White `#FFFFFF` | 기존 브랜드 |
| 보조 구획 | `#F7F8FA` | 제안 표면; 차트 track은 반드시 정본 사용 |
| 보조 텍스트 | `#46536B` | 새 제안; 실제 조합 대비 확인 |
| 장식 구획선 | `#D8DEE8` | 정보/상태의 유일한 구분으로 사용하지 않음 |
| 폰트 | EN: Source Sans 3; KO: Noto Sans KR | 제안. 사용 시 라이선스 확인·필요 굵기만 self-host. 글꼴 없이도 레이아웃 유지 |
| 대체 글꼴 | EN sans-serif; KO Apple SD Gothic Neo/Malgun Gothic/sans-serif | 로딩 실패 fallback; 외부 font CDN 필수 아님 |
| 제목 | H1 `clamp(2rem, 4.5vw, 4rem)`, line-height 1.12; H2 28–40px/1.2 | EN 과도한 대문자/강제 줄바꿈 없음; KO 내용 길이 별도 확인 |
| 본문 | 18px/1.6, 작은 보조문 16px/1.5 | 합성/미구현 고지를 작은 회색 각주로 밀지 않음 |
| 본문 폭 | 60–68ch 이내 | Hero 본문 52ch 내외 |
| 컨테이너 | 최대 1200px, 좌우 여백 20px mobile / 32px desktop | 320px에서도 내용과 조작부 넘침 금지 |
| 간격 | 8·16·24·32·48·64·96px | 섹션 간격 mobile 64 / desktop 96; 내용 따라 조정 |
| 모서리 | 버튼 4px, 제품 프레임 8px | pill CTA·모든 항목 카드화 금지 |
| 조작부 | 최소 44×44 CSS px, CTA 권장 높이 48px | 입력 장치와 무관한 저장소 제품 규칙 |
| 모션 | 색/상태 전환 120–160ms 이내 | 필수 애니메이션 없음; reduced-motion이면 제거 |

Source Sans/Noto는 방향 제안이며 이번 작업에서 폰트나 dependency를 설치하지 않는다. 실제 도입 파일/라이선스가 확인되지 않으면 폰트 의존 없이 구현하고 선택을 다시 확인한다. 기존 데이터 색은 정본에서 읽으며 랜딩 CSS에 밴드 팔레트를 복제하지 않는다.

## 레이아웃과 장식

데스크톱은 12열 개념의 7:5 Hero, 이하 문장/근거 폭에 맞춘 단순 CSS grid다. 모바일은 단일 열이다. 카드 그리드 대신 비교·과정·실제 화면·펼친 Q&A를 각각의 읽기 방식에 맞춘다. 사용자 요청의 7단계 IA를 시각 취향으로 재배열하지 않는다.

Hero 이미지는 실제 빌드 화면의 캡처만 허용한다. 합성 고지가 잘리는 crop은 금지하며 현재 동작과 다르면 다시 생성한다. 이미지가 없어도 who/problem/outcome/differentiator와 CTA는 HTML 텍스트로 남는다. 장식성 gradient·glassmorphism·가짜 고객 로고·빈 대시보드 그래프를 만들지 않는다.

## 접근성과 반응형 인수 기준

- 문서 언어 EN/KO 명시, H1 하나, 단계적인 제목, nav/main/footer landmark, 본문 건너뛰기 링크.
- 일반 텍스트 대비 4.5:1 이상, 큰 텍스트 3:1 이상을 목표로 실제 조합을 측정한다. 기준 출처: [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- 키보드 포커스는 배경과 구분되는 윤곽선과 여백으로 보이며 overflow·고정 헤더에 잘리지 않는다. 링크·버튼은 이름/역할이 명확하고 Enter/Space는 네이티브 동작을 따른다.
- 44px 조작부는 저장소의 강화된 제품 기준이다. WCAG 2.2 AA의 일반 최소 target 24px 및 예외와 혼동하지 않는다. 출처: [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- 320 CSS px 상당 폭에서 페이지 가로 스크롤 없이 재배치한다. 1280px에서 400% zoom도 확인한다. 출처: [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- 200% 텍스트 확대에서도 고지·CTA·Q&A가 잘리지 않는다. 색/이미지/hover만으로 전달하는 정보가 없다.
- 제품 캡처 대체 텍스트는 “합성 기업 화면: 참여 퍼널과 별도 조치 집계”처럼 의미를 설명하고 이미지의 모든 수치를 낭독하지 않는다. 동등한 설명과 실제 화면 링크를 인접 제공한다.
- 체크리스트 통과를 전체 WCAG 적합 인증으로 광고하지 않는다. 실제 구현 후 자동/수동 검증과 결함 수정이 필요하다.

## 구현 범위

기존 Python/PyYAML + vanilla HTML/CSS/JS를 사용한다. 새로운 UI 라이브러리, animation package, icon pack, CMS는 필요 없다. CSS 사용자 속성과 native 링크만으로 첫 버전을 구현한다. 디자인 승인 전 AGENTS에 필수 참조로 추가하지 않는다.
