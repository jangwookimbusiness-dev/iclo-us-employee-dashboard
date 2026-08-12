import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v6-template");
const OUT = path.join(ROOT, "output/proposal-v6");

const SNOW_SOURCES = [
  "https://docs.snowflake.com/en/user-guide/intro-editions",
  "https://docs.snowflake.com/en/user-guide/security-row-intro",
  "https://docs.snowflake.com/en/user-guide/data-protection-policies-snowsight",
  "https://docs.snowflake.com/en/user-guide/access-history",
  "https://docs.snowflake.com/en/collaboration/listings-bcdr-consumers",
  "https://docs.snowflake.com/en/user-guide/secure-data-sharing-across-regions-platforms",
];
const PROGRAM_SOURCES = [
  "User-provided ICLO x Snowflake external briefing requirements, 2026-08-05",
  "User-provided CEO Junbae Kim and CMO Hyeyoon Choi review emails, 2026-08-05",
  "ICLO Employer Dashboard synthetic demonstration",
];
const MARKET_SOURCES = [
  "https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/understanding-your-fiduciary-responsibilities-under-a-group-health-plan",
  "https://beta.dol.gov/research-data/surveys-reports-publications/2026-report-congress-annual-report-self-insured-group-health-plans",
  "https://www.healthcare.gov/coverage/dental-coverage/",
  "https://www.medicaid.gov/medicaid/benefits/prevention",
  "https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs",
  "https://www.ada.org/resources/community-initiatives/dental-benefits-plan-for-employees",
  "https://www.nhis.or.kr/english/wbheaa02600m01.do",
];

const notes = [
  "첫 장에서 이번 공동 검증의 범위를 미국 self-funded employer의 치아보험·임직원 복지 PoC로 고정한다. 임직원은 혜택을 더 쉽게 이용하고, 기업은 플랜·운영사 적합성, 네트워크 접근성, 이용률, 청구비용과 본인부담, 데이터 완결성을 근거로 복지 의사결정을 개선한다. 하단 색상 표시는 현재 PoC 범위, 제품 운영 원칙, 검증 필요, Snowflake 결정 요청을 구분한다.",
  "기존 문제 정의를 복원한 슬라이드다. 치아보험 가입 자격만으로 실제 진료가 자동으로 가능해지는 것은 아니며, 네트워크, 플랜 조건, 실제 예약 가능성, 예상 본인부담을 함께 이해해야 한다. 이 내용은 특정 플랜의 절대적 제약이 아니라 이용 과정에서 확인해야 할 일반적인 변수다.",
  "직원이 혜택을 이해하고 본인 요청으로 치과 찾기나 예약 지원을 받는 흐름이다. 초기 이미지 모델은 shadow mode이며 특정 치과, 응급도, 치료경로를 자동 결정하지 않는다. 이는 잠정적 제품 설계 경계이며 미국 규제 자문 전의 확정 법률 판단이 아니다.",
  "한국의 국민건강보험 중심 공통 기반과 달리 미국 성인 치아보험은 별도 혜택으로 운영되는 경우가 많다. 이번 PoC에서는 기업이 청구 위험을 부담하고 보험사 또는 TPA가 운영을 맡을 수 있다. 직원은 네트워크·플랜 조건·실제 예약을 이해하기 어렵고, 기업은 가입·이용·청구 데이터가 나뉘어 플랜과 운영사, 접근성, 복지 가치를 판단하기 어렵다.",
  "미국 치아보험 시장을 보장 시장, 비용 부담 구조, 계약·운영·청구 흐름으로 나누어 설명한다. fully insured와 self-funded는 비용 부담 방식이고, individual/Marketplace와 Medicaid/CHIP는 보장 시장이다. 현재 PoC는 미국 self-funded employer + 치아보험사/TPA + 임직원·가족 경로에만 한정한다.",
  "Snowflake는 가입 자격, 플랜, 앱 이벤트, 치아보험 청구를 연결하는 관리형 근거·협업 레이어다. 원본 구강 이미지는 별도 통제 저장소에 두고 Snowflake에는 URI, 메타데이터, 모델 버전, 승인된 파생 신호만 둔다. 기업은 직원별 건강 신호를 보지 않는다.",
  "예방진료 이용과 미치료 상태 발견이 늘면 첫해 치아보험 지급액이 먼저 오를 수 있다. 허용액, 보험자 지급액, 직원 본인부담금을 분리하고 이직률과 청구 반영 지연을 함께 보아야 한다. 그래프는 가설이며 실제 성과가 아니다.",
  "대시보드는 합성 데이터 예시다. 성과를 주장하는 화면이 아니라 직원/가입자 분모, 가입 자격 기준일, 청구 지연, 완결성, n>=20 셀 억제, 개인 PHI 미제공을 구매자에게 보이는 설계 증거다.",
  "Snowflake에 막연한 미국 고객 소개를 요청하지 않는다. 어떤 HLS sales play인지, 어떤 내부 전문가가 필요한지, 치아보험 가입·청구 데이터가 있는 계정팀 한 곳이 검증할 수 있는지, 파트너·co-sell 준비 기준과 credits/support 범위를 문서로 받을 수 있는지를 묻는다.",
  "90일의 목표는 공동판매 약속이 아니라 검증된 아키텍처, 규모별 비용 가설, named-account matrix, 한 payer/TPA 계정팀의 사용사례 검토, 다음 단계 판단이다. 마지막 문장은 Snowflake가 AI 또는 규제 준수를 보증하는 역할이 아님을 명확히 한다.",
  "책임을 플랫폼, 운영, 데이터 제공, 법률 판단으로 분리한다. Snowflake가 제공할 수 있는 기술 통제와 ICLO·employer·TPA가 책임져야 할 운영·계약·규제 판단을 혼동하지 않는다.",
  "현재 우선순위는 미국 계정·리전·Business Critical·BAA 경로, ingestion/share 방식, 목적 기반 접근, masking/row policy/access history, 규모별 비용이다. Native App, Clean Room, federated learning은 조건부 후속 의제다.",
  "J-curve는 고객 데이터로 보정할 계획 가설이다. 입력 가정과 모델 버전, 불확실성을 관리하고 실제 ICLO 성과처럼 제시하지 않는다. 이직률은 고용주가 장기 효과를 회수할 수 있는 기간과 신규 미치료 수요 유입에 영향을 줄 수 있다.",
  "시장 단위의 막연한 주장을 법인·데이터·리전·기술 준비도 근거로 바꾸기 위한 템플릿이다. 'Snowflake 고객인 TPA가 많다'는 표현은 계정 증거가 채워지기 전에는 사용하지 않는다.",
];

function sourcesForSlide(slide) {
  const base = [...PROGRAM_SOURCES];
  if ([2, 4, 5].includes(slide)) base.push(...MARKET_SOURCES);
  if ([6, 9, 10, 11, 12].includes(slide)) base.push(...SNOW_SOURCES);
  if (slide === 12) base.push(
    "https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about",
    "https://docs.snowflake.com/en/user-guide/cleanrooms/about",
    "https://www.snowflake.com/en/why-snowflake/partners/",
    "https://www.snowflake.com/en/why-snowflake/startup-program/",
  );
  return base;
}

function noteText(slide) {
  return `${notes[slide - 1]}\n\n[Sources]\n${sourcesForSlide(slide).map((s) => `- ${s}`).join("\n")}`;
}

const EN_V5 = {
  1: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "U.S. SELF-FUNDED EMPLOYER DENTAL POC",
    "Building the Evidence Layer for\nEmployer Dental Benefits": "U.S. Self-Funded Employer\nDental-Benefit PoC",
    "ICLO turns employee dental-benefit navigation into claims-confirmed, privacy-governed evidence.": "Employees navigate dental benefits more easily; employers use utilization and claims evidence to improve plan and workforce-benefit decisions.",
    "Employee navigation": "Employee navigation",
    "Understand benefits\nRequest support": "Understand coverage\nFind care + request support",
    "Governed evidence plane": "Claims-verified evidence layer",
    "Eligibility + plan + events + claims": "Eligibility + plan + network\nApp events + dental claims",
    "Employer evidence": "Employer decisions",
    "Aggregate outcomes\nNo individual PHI": "Plan + administrator fit\nAccess + claims + OOP",
    "CONFIRMED DIRECTION": "CURRENT POC SCOPE",
    "DESIGN PRINCIPLE": "PRODUCT GUARDRAIL",
    "TO VALIDATE": "TO VALIDATE",
    "SNOWFLAKE ASK": "SNOWFLAKE DECISION",
  },
  2: {
    "HYPOTHESIS / TO BE VALIDATED": "CONFIRMED MARKET CONTEXT",
    "The Employee Problem Is Not Coverage Alone - It Is Navigation": "The PoC Targets a U.S. Self-Funded Employer Dental Benefit",
    "Plan, network and operational context shape whether coverage becomes usable care.": "Unlike Korea's NHIS-centered baseline, the employer may fund claims while a carrier or TPA operates a separate dental benefit.",
    "Coverage": "Korea baseline",
    "Eligible employee": "NHIS is the common base",
    "Network": "U.S. dental",
    "Provider economics": "Often a separate benefit",
    "Plan rules": "PoC target",
    "Deductible + max": "Self-funded employer",
    "Availability": "Employee problem",
    "Directory + booking": "Benefits are hard to use",
    "Usable care": "Employer problem",
    "Understood OOP": "Outcomes are hard to verify",
    "NETWORK": "PLAN + NETWORK",
    "Provider choice may be constrained or economically penalized by plan rules.": "Network, deductible, coinsurance, annual maximum and real availability shape use.",
    "BENEFIT DESIGN": "DATA SPLIT",
    "Deductible, coinsurance, annual maximum and covered procedures vary.": "Eligibility, benefit rules, provider operations and dental claims sit across organizations.",
    "OPERATIONS": "DECISION GAP",
    "Directory status, appointment availability and final EOB may differ from expectations.": "Employers need evidence for plan design, administrator fit, access gaps and workforce value.",
  },
  3: {
    "ICLO PRODUCT DESIGN PRINCIPLE": "U.S. DENTAL MARKET CONTEXT",
    "REQUEST TO SNOWFLAKE": "CURRENT POC SCOPE",
    "Snowflake Is the Governed Evidence Plane": "How the U.S. Dental Benefit Ecosystem Fits Together",
    "Structured evidence is governed in Snowflake; raw images and employee-level routing remain outside employer views.": "Funding arrangement, administrator, beneficiary and claim path are separate questions; the PoC covers one specific lane.",
    "05": "03",
    "RAW-IMAGE PATH": "CONTRACTING + CHOICE",
    "Raw oral image": "Coverage buyer / sponsor",
    "Controlled U.S. object storage / PHI vault": "Broker / benefits consultant",
    "Shadow inference": "Carrier / TPA / MCO contract",
    "STRUCTURED EVIDENCE PATH": "COVERAGE + FUNDING SEGMENTS",
    "App events": "Employer\nfully insured",
    "HRIS eligibility": "Employer\nself-funded / ASO",
    "Plan + provider context": "Individual / family\nMarketplace or direct",
    "TPA / carrier claims": "Medicaid / CHIP\nstate + MCO",
    "Snowflake U.S. governed evidence layer": "Dental benefit operating layer",
    "Canonical model": "FUNDING ROLE",
    "member-month + plan + event + claim": "Who bears dental claim cost",
    "Quality + controls": "ADMINISTRATION",
    "reconciliation + purpose access + lineage": "Eligibility + benefits + network",
    "Outcome layer": "CLAIMS + DATA",
    "experiment assignment + claims-confirmed outcomes": "Adjudication + EOB + claim lines",
    "URI + metadata + model version + approved derived signal only": "Defines funding, network, benefit rules, data rights and reporting terms",
    "Employer aggregate dashboard": "Beneficiaries + dental providers",
    "No employee-level health signals or routing": "Members receive care; dentists submit claims",
    "PHI platform prerequisite: Business Critical + appropriate Snowflake BAA. This does not make ICLO as a whole HIPAA-compliant.": "CURRENT POC SCOPE: U.S. SELF-FUNDED EMPLOYER + DENTAL CARRIER/TPA + EMPLOYEES/DEPENDENTS",
  },
  4: {
    "ICLO Connects Plan Context to Employee-Initiated Action": "ICLO Connects Dental Benefits to Employee Action",
    "Employee dental-benefit navigation in the front; a governed evidence layer in the back.": "Navigation in front; a governed, claims-verified evidence layer in back.",
    "Claims evidence": "Claims-verified evidence",
  },
  5: {
    "Snowflake Is the Governed Evidence Plane": "Snowflake Is the Governed Evidence and Collaboration Plane",
    "Structured evidence is governed in Snowflake; raw images and employee-level routing remain outside employer views.": "Structured evidence can be governed in Snowflake; raw images and employee-level routing stay outside employer views.",
    "PHI platform prerequisite: Business Critical + appropriate Snowflake BAA. This does not make ICLO as a whole HIPAA-compliant.": "For PHI in Snowflake: Business Critical + executed BAA are platform prerequisites - not ICLO-wide HIPAA compliance.",
  },
  6: {
    "The Economics Begin with a J-Curve, Not a Year-One Savings Promise": "The Economics Begin with a J-Curve - Not a Year-One Savings Promise",
    "Year-one utilization and plan-paid claims may rise before treatment-mix change becomes measurable.": "Year-one utilization and dental plan-paid claims may rise before treatment-mix change becomes measurable.",
    "04": "06",
  },
  7: {
    "The Dashboard Makes Privacy and Data Quality Visible": "The Dashboard Makes Data Quality and Privacy Visible",
    "This is not a performance claim. It shows how denominator, freshness, privacy and claims completeness become visible to the buyer.": "This is not a performance claim. It shows the denominator, freshness, claims lag, completeness and privacy rules behind each result.",
    "06": "07",
  },
  8: {
    "What We Need from Snowflake GTM": "What We Need from Snowflake GTM and Architecture",
    "Provide written credits/support scope and readiness criteria for partner, co-sell and application paths.": "Provide written account/region/BAA, credits/support scope and partner/co-sell readiness criteria.",
    "Select one payer/TPA account team to validate dental data and unmet need before any introduction.": "Select one self-funded employer dental account team or administrator/TPA team to validate data and need before any introduction.",
  },
  9: {
    "One payer/TPA account-team review\nPartner checklist\nNext / no-go decision": "One employer or administrator account-team review\nPartner checklist\nNext / no-go decision",
    "We are not asking Snowflake to validate our dental AI or make ICLO compliant. We are asking Snowflake to help us determine whether this can become a repeatable, governed payer/TPA data-collaboration pattern—and what ICLO must prove to make that partnership commercially real.": "We are not asking Snowflake to validate our dental AI or make ICLO compliant. We are asking Snowflake to help determine whether this can become a repeatable, governed payer/TPA data-collaboration pattern - and what ICLO must prove to make the partnership commercially real.",
  },
  13: {
    "Named-Account Diligence Template": "Self-Funded Employer Dental Account Diligence Template",
    "Replace market-level assumptions with legal-entity, workload and readiness evidence.": "Validate the employer, dental administrator, data workload, rights and technical readiness account by account.",
  },
};

const KO_V5 = {
  1: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "미국 SELF-FUNDED EMPLOYER 치아보험 POC",
    "Building the Evidence Layer for\nEmployer Dental Benefits": "U.S. Self-Funded Employer\nDental-Benefit PoC",
    "ICLO turns employee dental-benefit navigation into claims-confirmed, privacy-governed evidence.": "임직원은 치아보험을 더 쉽게 이용하고, 기업은 이용·청구 데이터로 플랜·운영사·치과복지를 판단합니다.",
    "Employee navigation": "Employee / 임직원",
    "Understand benefits\nRequest support": "치아보험 이해\n치과 찾기 + 지원 요청",
    "Governed evidence plane": "Evidence / 데이터 근거",
    "Eligibility + plan + events + claims": "가입·플랜·네트워크\n이용 기록 + 치아보험 청구",
    "Employer evidence": "Employer / 기업 의사결정",
    "Aggregate outcomes\nNo individual PHI": "플랜·운영사 적합성\n접근성 + 청구 + 본인부담",
    "CONFIRMED DIRECTION": "현재 PoC 범위",
    "DESIGN PRINCIPLE": "제품 운영 원칙",
    "TO VALIDATE": "검증 필요",
    "SNOWFLAKE ASK": "Snowflake 결정 요청",
  },
  2: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "HYPOTHESIS / TO BE VALIDATED": "확인된 시장 구조",
    "The Employee Problem Is Not Coverage Alone - It Is Navigation": "PoC 대상은 미국 self-funded employer 치아보험입니다",
    "Plan, network and operational context shape whether coverage becomes usable care.": "한국은 국민건강보험이 공통 기반이지만, 미국 대상 구조에서는 기업이 청구비용을 부담하고 보험사·TPA가 운영할 수 있습니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "Coverage": "한국의 공통 기반",
    "Eligible employee": "국민건강보험",
    "Network": "미국 치아보험",
    "Provider economics": "별도 복지 플랜",
    "Plan rules": "현재 PoC 대상",
    "Deductible + max": "자가부담형 기업",
    "Availability": "임직원 문제",
    "Directory + booking": "혜택 이용이 복잡",
    "Usable care": "기업 문제",
    "Understood OOP": "성과 확인이 어려움",
    "NETWORK": "플랜 + 네트워크",
    "Provider choice may be constrained or economically penalized by plan rules.": "네트워크, 공제액·본인부담률·연간 한도, 실제 예약 가능성이 이용을 좌우합니다.",
    "BENEFIT DESIGN": "데이터 분산",
    "Deductible, coinsurance, annual maximum and covered procedures vary.": "가입 자격, 혜택 규칙, 치과 운영, 청구 데이터가 여러 기관에 나뉩니다.",
    "OPERATIONS": "의사결정 공백",
    "Directory status, appointment availability and final EOB may differ from expectations.": "기업은 플랜·운영사 선택, 접근성 개선, 복지 가치 판단에 근거가 부족합니다.",
  },
  3: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "ICLO PRODUCT DESIGN PRINCIPLE": "미국 치아보험 시장 구조",
    "REQUEST TO SNOWFLAKE": "현재 PoC 범위",
    "Snowflake Is the Governed Evidence Plane": "미국 치아보험은 보장 대상·비용 부담·운영 주체가 서로 다릅니다",
    "Structured evidence is governed in Snowflake; raw images and employee-level routing remain outside employer views.": "fully insured·self-funded는 비용 구조이고, individual·Medicaid는 보장 시장입니다. 현재 PoC는 한 경로만 대상으로 합니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "05": "03",
    "RAW-IMAGE PATH": "계약 + 선택",
    "Raw oral image": "보험 구매자 / 플랜 주체",
    "Controlled U.S. object storage / PHI vault": "브로커 / 복지 컨설턴트",
    "Shadow inference": "보험사 / TPA / MCO 계약",
    "STRUCTURED EVIDENCE PATH": "보장 시장 + 비용 구조",
    "App events": "기업\n보험형",
    "HRIS eligibility": "기업\n자가부담형 / ASO",
    "Plan + provider context": "개인 / 가족\nMarketplace·직접 가입",
    "TPA / carrier claims": "Medicaid / CHIP\n주정부 + MCO",
    "Snowflake U.S. governed evidence layer": "치아보험 운영 레이어",
    "Canonical model": "비용 부담",
    "member-month + plan + event + claim": "누가 치아보험 청구비용을 부담하는가",
    "Quality + controls": "운영",
    "reconciliation + purpose access + lineage": "가입 자격 + 혜택 + 네트워크",
    "Outcome layer": "청구 + 데이터",
    "experiment assignment + claims-confirmed outcomes": "심사 + EOB + 청구 항목",
    "URI + metadata + model version + approved derived signal only": "비용 구조, 네트워크, 혜택 규칙, 데이터 권리와 보고 범위를 정합니다.",
    "Employer aggregate dashboard": "수혜자 + 치과",
    "No employee-level health signals or routing": "임직원·가족은 진료를 받고, 치과는 청구합니다.",
    "PHI platform prerequisite: Business Critical + appropriate Snowflake BAA. This does not make ICLO as a whole HIPAA-compliant.": "현재 PoC 범위: 미국 self-funded employer + 치아보험사/TPA + 임직원·가족",
  },
  4: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "CONFIRMED ICLO DIRECTION": "확정된 ICLO 방향",
    "ICLO PRODUCT DESIGN PRINCIPLE": "ICLO 제품 설계 원칙",
    "ICLO Connects Plan Context to Employee-Initiated Action": "ICLO는 치아보험 정보와 직원의 자발적 행동을 연결합니다",
    "Employee dental-benefit navigation in the front; a governed evidence layer in the back.": "앞에서는 치아보험 이용을 돕고, 뒤에서는 청구로 확인 가능한 근거를 만듭니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "Employee experience": "직원 경험",
    "Concern + benefit understanding\nOptional oral-image capture": "우려 사항 + 혜택 이해\n선택적 구강 사진",
    "Benefit + provider context": "혜택·치과 정보",
    "Eligibility + network\nPlan rules + availability": "가입 자격 + 네트워크\n플랜 조건 + 예약 정보",
    "Employee-initiated action": "직원 요청 기반 행동",
    "Provider search\nAppointment support": "치과 찾기\n예약 지원",
    "Claims evidence": "청구로 확인한 근거",
    "Completion + claim line\nEmployer aggregate only": "방문 완료 + 청구 항목\n기업에는 집계만",
    "SHADOW SIGNAL": "모델은 그림자 모드",
    "Raw disease probabilities are not shown to employees or employers. Model-derived signals do not automatically determine provider, urgency or treatment pathway.": "초기 모델의 질병 확률은 임직원이나 기업에 보여주지 않습니다. 특정 치과, 응급도, 치료경로도 자동으로 결정하지 않습니다.",
    "Design redline: separate signal, navigation and referral tables; timestamp employee action and consent.": "설계 경계: 모델 신호·이용 지원·연계 기록을 분리하고 임직원 행동과 동의 시각을 남깁니다.",
    "UNDERSTAND": "이해",
    "Concerns, benefits and optional image capture.": "우려 사항, 혜택, 선택적 사진 촬영",
    "MATCH": "연결",
    "Eligibility, plan, network and operational context.": "가입 자격, 플랜, 네트워크, 실제 예약 정보",
    "VERIFY": "확인",
    "Preventive visits and claims at aggregate employer level.": "예방진료와 청구를 기업 단위 집계로 확인",
  },
  5: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "ICLO PRODUCT DESIGN PRINCIPLE": "ICLO 제품 설계 원칙",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "Snowflake Is the Governed Evidence Plane": "Snowflake는 데이터와 책임을 분리해 연결하는 근거 레이어입니다",
    "Structured evidence is governed in Snowflake; raw images and employee-level routing remain outside employer views.": "가입·플랜·이용·청구 데이터는 Snowflake에서 관리하고, 원본 사진과 임직원별 진료 경로는 기업 화면 밖에 둡니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "RAW-IMAGE PATH": "원본 이미지 경로",
    "Raw oral image": "원본 구강 이미지",
    "Controlled U.S. object storage / PHI vault": "통제된 미국 저장소 / 개인건강정보 보관영역",
    "Shadow inference": "그림자 모드 분석",
    "STRUCTURED EVIDENCE PATH": "구조화된 근거 데이터 경로",
    "App events": "앱 이용 기록",
    "HRIS eligibility": "인사시스템 가입 자격",
    "Plan + provider context": "플랜 + 치과 정보",
    "TPA / carrier claims": "TPA / 보험사 청구",
    "Snowflake U.S. governed evidence layer": "Snowflake 미국 근거 레이어",
    "Canonical model": "공통 데이터 모델",
    "member-month + plan + event + claim": "가입자 월 + 플랜 + 이용 기록 + 청구",
    "Quality + controls": "품질 + 통제",
    "reconciliation + purpose access + lineage": "대조 + 목적별 접근 + 데이터 계보",
    "Outcome layer": "성과 계산 레이어",
    "experiment assignment + claims-confirmed outcomes": "실험군 배정 + 청구로 확인한 결과",
    "URI + metadata + model version + approved derived signal only": "URI + 메타데이터 + 모델 버전 + 승인된 파생 신호만",
    "Employer aggregate dashboard": "기업용 집계 대시보드",
    "No employee-level health signals or routing": "직원별 건강 신호·진료 경로 없음",
    "PHI platform prerequisite: Business Critical + appropriate Snowflake BAA. This does not make ICLO as a whole HIPAA-compliant.": "Snowflake에서 개인건강정보를 처리하려면 Business Critical과 적절한 BAA가 필요합니다. 이것만으로 ICLO 전체가 HIPAA 준수 상태가 되는 것은 아닙니다.",
  },
  6: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "CONFIRMED ICLO DIRECTION": "확정된 ICLO 방향",
    "HYPOTHESIS / TO BE VALIDATED": "검증할 가설",
    "The Economics Begin with a J-Curve, Not a Year-One Savings Promise": "경제성은 첫해 절감 약속이 아니라 J-curve 검증에서 시작합니다",
    "Year-one utilization and plan-paid claims may rise before treatment-mix change becomes measurable.": "예방진료와 미치료 상태 발견이 늘면 첫해 치아보험 지급액이 먼저 증가할 수 있습니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "Illustrative shape only - not an ICLO outcome": "예시 가설 - 실제 ICLO 성과가 아님",
    "Baseline": "기준",
    "Plan-year start": "플랜 연도 시작",
    "Year 1": "1년차",
    "Preventive use rises\nNew treatment is discovered": "예방 이용 증가\n미치료 상태 발견",
    "Years 2-3": "2-3년차",
    "Treatment mix + run-out\nbecome measurable": "치료 구성 + 청구 지연\n측정 가능",
    "Validate": "검증",
    "Direction unknown": "방향 미확정",
    "LOW\nTURNOVER": "낮은\n이직률",
    "HIGH\nTURNOVER": "높은\n이직률",
    "Multi-year value lens": "여러 해 가치 관점",
    "Employee experience lens": "직원 경험 관점",
    "UTILIZATION": "이용량",
    "Preventive use can raise plan-paid claims.": "예방진료 이용은 보험자 지급액을 늘릴 수 있습니다.",
    "COST ALLOCATION": "비용 구분",
    "Allowed, plan-paid and employee OOP can move differently.": "허용액, 보험자 지급액, 직원 본인부담금은 다르게 움직일 수 있습니다.",
    "CONTRACT PRINCIPLE": "계약 원칙",
    "ICLO will not contract on a year-one savings guarantee.": "ICLO는 첫해 절감을 보장하는 계약을 제안하지 않습니다.",
    "04": "06",
  },
  7: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "ICLO PRODUCT DESIGN PRINCIPLE": "ICLO 제품 설계 원칙",
    "The Dashboard Makes Privacy and Data Quality Visible": "대시보드는 성과보다 데이터 기준과 프라이버시를 먼저 보여줍니다",
    "This is not a performance claim. It shows how denominator, freshness, privacy and claims completeness become visible to the buyer.": "합성 데이터 예시이며, 분모·기준일·청구 지연·완결성·소규모 집계 억제를 구매자에게 보이는 설계입니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "SYNTHETIC": "합성 데이터",
    "Illustrative only": "설명용 예시",
    "DENOMINATOR": "기준 집단",
    "Employees / members": "직원 / 가입자",
    "FRESHNESS": "최신성",
    "Dates + claims lag": "기준일 + 청구 지연",
    "PRIVACY": "프라이버시",
    "Aggregate · n ≥ 20 · no PHI": "집계만 · n ≥ 20 · 개인정보 없음",
    "LIVE DEMO": "데모",
    "Synthetic dashboard": "합성 데이터 대시보드",
    "06": "07",
  },
  8: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "What We Need from Snowflake GTM": "Snowflake에 요청하는 것은 고객 소개가 아니라 검증 경로입니다",
    "We need industry fit, internal coordination and account-path sponsorship - not generic introductions.": "산업 적합성, 내부 전문가 연결, 계정팀 검증, 파트너 준비 기준을 요청합니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "FIT": "적합성",
    "Which HLS sales play fits naturally: payer claims analytics, benefits navigation, healthtech applications or secure collaboration?": "어떤 HLS 영업 유형에 가장 자연스럽게 들어가는가?",
    "PEOPLE": "전문가",
    "Name the HLS architect, solution engineer, security/compliance owner and startup/partner lead.": "HLS 아키텍트, 솔루션 엔지니어, 보안·컴플라이언스, 스타트업·파트너 담당자를 지정해 달라.",
    "ACCOUNTS": "계정",
    "Select one payer/TPA account team to validate dental data and unmet need before any introduction.": "self-funded employer 치아보험 계정팀 또는 운영사·TPA 계정팀 한 곳에서 데이터와 수요를 검증해 달라.",
    "PATH": "진행 경로",
    "Provide written credits/support scope and readiness criteria for partner, co-sell and application paths.": "계정·리전·BAA, credits/support 범위, 파트너·공동판매 준비 기준을 문서로 달라.",
    "Not asking Snowflake for: legal opinions, compliance certification, generic customer introductions or a savings guarantee.": "Snowflake에 법률 판단, 준수 인증, 막연한 고객 소개, 비용 절감 보장을 요청하지 않습니다.",
  },
  9: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "A 90-Day Joint Validation Plan": "90일 동안 기술 구조와 계정 수요를 함께 검증합니다",
    "The outcome is a validated architecture and one account-team use-case review, not a co-sell commitment.": "목표는 공동판매 약속이 아니라 검증된 구조와 한 계정팀의 사용사례 검토입니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "DAYS 0-30": "0-30일",
    "ALIGN": "정렬",
    "Sales play\nNamed stakeholders\nU.S. account / region / BAA path\nArchitecture workshop": "영업 유형\n담당자 지정\n미국 계정·리전·BAA 경로\n아키텍처 워크숍",
    "DAYS 31-60": "31-60일",
    "DESIGN": "설계",
    "Ingestion pattern\n2.5K / 10K / 25K sizing\nSecurity reference\nAccount matrix v1": "데이터 수집 방식\n2.5K / 10K / 25K 규모 산정\n보안 기준 구조\n계정 매트릭스 1차본",
    "DAYS 61-90": "61-90일",
    "VALIDATE": "검증",
    "One payer/TPA account-team review\nPartner checklist\nNext / no-go decision": "기업 또는 운영사 계정팀 1곳 검토\n파트너 체크리스트\n진행 / 보류 결정",
    "CONDITIONAL": "조건부",
    "EXPAND": "확장",
    "Native App\nMulti-party Clean Room\nFederated learning\nJoint story / design partner": "Native App\n다자간 Clean Room\n연합학습 검토\n공동 사례 / 설계 파트너",
    "We are not asking Snowflake to validate our dental AI or make ICLO compliant. We are asking Snowflake to help us determine whether this can become a repeatable, governed payer/TPA data-collaboration pattern—and what ICLO must prove to make that partnership commercially real.": "Snowflake에 치과 AI를 검증하거나 ICLO를 규제 준수 상태로 만들어 달라는 요청이 아닙니다. 반복 가능한 payer/TPA 데이터 협업 구조가 될 수 있는지, ICLO가 무엇을 입증해야 상업적 협력이 가능한지 함께 확인하려는 제안입니다.",
  },
  10: {
    "APPENDIX": "부록",
    "ICLO PRODUCT DESIGN PRINCIPLE": "ICLO 제품 설계 원칙",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "Data and Responsibility Matrix": "데이터와 책임 구분표",
    "Platform responsibility, operating responsibility and legal judgment remain separate.": "플랫폼 기능, 실제 운영, 데이터 제공, 법률 판단의 책임을 구분합니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
  },
  11: {
    "APPENDIX": "부록",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "Detailed Snowflake Technical Questions": "Snowflake에 확인할 기술 질문",
    "Resolve the pilot pattern first; treat application packaging and multi-party ML as conditional.": "첫 파일럿의 데이터 연결 방식을 먼저 정하고, 앱 패키징과 다자간 ML은 후순위로 둡니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "PRIORITY NOW": "지금 결정할 항목",
    "What is the practical U.S. account, cloud/region, Business Critical and BAA path?": "미국 계정, 클라우드·리전, Business Critical, BAA의 실제 개설 절차는?",
    "When should we use same-region Direct Share versus controlled SFTP/API staging?": "같은 리전의 Direct Share와 통제된 SFTP/API 수집은 언제 각각 쓰는가?",
    "What tenancy, purpose-access, masking, row-policy and access-history pattern do you recommend?": "테넌시, 목적별 접근, 마스킹, 행 정책, 접근 기록을 어떻게 설계하는가?",
    "How should we size 2.5K / 10K / 25K populations and measure post-credit unit economics?": "2,500 / 10,000 / 25,000명 규모의 비용과 크레딧 이후 단위 경제성을 어떻게 산정하는가?",
    "What must ICLO prove for startup, partner, Powered by Snowflake or co-sell readiness?": "스타트업·파트너·Powered by Snowflake·공동판매 준비를 위해 무엇을 입증해야 하는가?",
    "CONDITIONAL / LATER": "조건부 / 추후",
    "Native App": "Native App",
    "When does customer-account execution create repeatability beyond a connector pattern?": "언제 단순 연결기를 넘어 반복 가능한 고객 계정 실행이 필요한가?",
    "Clean Room": "Clean Room",
    "What real multi-party payer / TPA / employer collaboration would justify it?": "여러 payer·TPA·기업이 실제로 협업할 때 필요한가?",
    "Federated learning": "연합학습",
    "Does this mean true local training and parameter aggregation, or collaborative ML inside a Clean Room, Native App or customer-account execution pattern?": "기관별 로컬 학습인가, Snowflake 안의 협업형 ML인가?",
    "Not required for the first employer pilot.": "첫 기업 파일럿의 필수 조건이 아닙니다.",
  },
  12: {
    "APPENDIX": "부록",
    "HYPOTHESIS / TO BE VALIDATED": "검증할 가설",
    "Employer J-Curve Simulation - Inputs and Outputs": "기업별 J-curve 시뮬레이션 - 입력값과 결과",
    "A governed planning heuristic should expose assumptions, scenario versions and uncertainty.": "계획용 가설은 입력 가정, 시나리오 버전, 불확실성을 모두 보여줘야 합니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "POPULATION": "가입 인구",
    "Employee/dependent age distribution\nTurnover + average tenure": "직원·가족 연령 분포\n이직률 + 평균 근속기간",
    "ACCESS": "진료 접근성",
    "Workforce geography\nNetwork overlap + provider availability": "근무지 분포\n네트워크 겹침 + 치과 예약 가능성",
    "PLAN": "치아보험 플랜",
    "Plan design + annual maximum\nEmployer contribution + paid/OOP split": "플랜 구조 + 연간 한도\n기업 부담 + 보험자 지급 / 본인부담 구분",
    "BASELINE + TIMING": "기준값 + 시점",
    "Utilization + historical claims\nUntreated need/incidence + run-out": "기존 이용률 + 과거 청구\n미치료 수요·발생률 + 청구 반영 지연",
    "GOVERNED\nSCENARIO MODEL": "통제된\n시나리오 모델",
    "Lineage + version + uncertainty": "데이터 계보 + 버전 + 불확실성",
    "OUTPUTS": "결과",
    "Preventive utilization increase": "예방진료 이용 증가",
    "Newly discovered treatment spend": "새로 발견된 치료비",
    "Allowed / plan-paid / employee OOP separation": "허용액 / 보험자 지급 / 직원 본인부담 구분",
    "Year 1 / Year 2 / Year 3 scenarios": "1년차 / 2년차 / 3년차 시나리오",
    "Turnover sensitivity": "이직률 민감도",
    "Network-access sensitivity": "네트워크 접근성 민감도",
    "Expected data uncertainty": "예상 데이터 불확실성",
    "Planning heuristic - calibrate with customer data; not an ICLO outcome.": "고객 데이터로 보정할 계획 가설이며 실제 ICLO 성과가 아닙니다.",
  },
  13: {
    "APPENDIX": "부록",
    "REQUEST TO SNOWFLAKE": "Snowflake 요청",
    "Named-Account Diligence Template": "계정 단위 검증 템플릿",
    "Replace market-level assumptions with legal-entity, workload and readiness evidence.": "시장 전체의 추정을 법인·데이터·기술 준비도에 관한 실제 근거로 바꿉니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "ACCOUNT IDENTITY + DATA": "계정 정보 + 데이터",
    "COMMERCIAL + TECHNICAL READINESS": "사업 + 기술 준비도",
    "No statement that 'many TPAs are on Snowflake' should be used before this matrix contains account evidence.": "이 표에 계정 근거가 채워지기 전에는 'Snowflake 고객인 TPA가 많다'고 말하지 않습니다.",
  },
};

function withoutKey(mapping, key) {
  const copy = { ...mapping };
  delete copy[key];
  return copy;
}

const EN = {
  1: { ...EN_V5[1] },
  2: {
    "The Employee Problem Is Not Coverage Alone - It Is Navigation": "Dental Insurance Does Not Automatically Become Usable Care",
    "Plan, network and operational context shape whether coverage becomes usable care.": "Eligibility matters, but network, plan rules and real availability determine whether coverage becomes care.",
    "Coverage": "Dental\ninsurance",
    "Eligible employee": "",
    "BENEFIT DESIGN": "DENTAL PLAN",
  },
  3: { ...EN_V5[4] },
  4: { ...EN_V5[2], "02": "04" },
  5: withoutKey(EN_V5[3], "05"),
  6: { ...EN_V5[5], "05": "06" },
  7: { ...EN_V5[6], "04": "07" },
  8: { ...EN_V5[7], "06": "08" },
  9: { ...EN_V5[8], "08": "09" },
  10: { ...EN_V5[9], "09": "10" },
  11: { "10": "11" },
  12: { "11": "12" },
  13: { "12": "13" },
  14: { ...EN_V5[13], "13": "14" },
};

const KO = {
  1: { ...KO_V5[1] },
  2: {
    "HLS GTM & ARCHITECTURE PROPOSAL": "내부 검토용 공동 검증 제안",
    "HYPOTHESIS / TO BE VALIDATED": "검증할 가설",
    "The Employee Problem Is Not Coverage Alone - It Is Navigation": "치아보험 가입만으로 실제 진료 이용이 쉬워지는 것은 아닙니다",
    "Plan, network and operational context shape whether coverage becomes usable care.": "가입 자격이 있어도 네트워크, 플랜 조건, 실제 예약 가능성을 함께 알아야 진료로 이어집니다.",
    "External proposal · discussion material": "ICLO 내부 검토 자료",
    "Coverage": "치아보험 가입",
    "Eligible employee": "가입 대상 직원·가족",
    "Network": "네트워크",
    "Provider economics": "치과 선택·비용",
    "Plan rules": "플랜 조건",
    "Deductible + max": "공제액·연간 한도",
    "Availability": "예약 가능성",
    "Directory + booking": "치과 목록·예약",
    "Usable care": "실제 이용",
    "Understood OOP": "예상 본인부담금",
    "NETWORK": "네트워크",
    "Provider choice may be constrained or economically penalized by plan rules.": "플랜에 따라 치과 선택이 제한되거나 비용이 커질 수 있습니다.",
    "BENEFIT DESIGN": "치아보험 조건",
    "Deductible, coinsurance, annual maximum and covered procedures vary.": "공제액, 본인부담률, 연간 한도, 보장 시술이 플랜마다 다릅니다.",
    "OPERATIONS": "실제 운영",
    "Directory status, appointment availability and final EOB may differ from expectations.": "치과 목록, 실제 예약, 사전 예상비용과 보험 설명서(EOB)가 다를 수 있습니다.",
  },
  3: { ...KO_V5[4] },
  4: { ...KO_V5[2], "02": "04" },
  5: withoutKey(KO_V5[3], "05"),
  6: { ...KO_V5[5], "05": "06" },
  7: { ...KO_V5[6], "04": "07" },
  8: { ...KO_V5[7], "06": "08" },
  9: { ...KO_V5[8], "08": "09" },
  10: { ...KO_V5[9], "09": "10" },
  11: { ...KO_V5[10], "10": "11" },
  12: { ...KO_V5[11], "11": "12" },
  13: { ...KO_V5[12], "12": "13" },
  14: { ...KO_V5[13], "13": "14" },
};

const EN_TABLES = {};

const KO_TABLES = {
  11: [[
    ["영역", "ICLO", "기업 / TPA / 협력사", "Snowflake", "Snowflake 범위 밖"],
    ["직원 이용 지원", "제품·이용 기록·동의 화면", "직원 행동·운영 지원", "이용 기록을 목적별 관리", "면허·환자연계 법률 검토"],
    ["가입 자격·플랜·네트워크", "정보 연결·사용", "계약에 따라 데이터 제공", "공통 모델·대조", "데이터 권리 판단"],
    ["청구·성과", "프로그램 귀속 로직", "청구·지연·방문완료", "집계 계산·접근 통제", "절감 효과 검증"],
    ["원본 이미지·모델", "보관·분석·검증", "필요 시 임상 역할", "URI·메타데이터·승인 신호", "모델 엔드포인트 검증"],
    ["거버넌스·준수", "앱 통제·사고 대응", "원천 시스템 통제", "권한·마스킹·행 정책·이력", "ICLO 전체 준수 결론"],
  ]],
  14: [
    [
      ["조직 / 법인", "계정 유형", "자가부담형 치아보험 운영?", "Snowflake 내 가입 자격?", "Snowflake 내 청구 항목?", "클라우드 / 리전"],
      ["", "", "", "", "", ""],
      ["", "", "", "", "", ""],
    ],
    [
      ["기존 이용지원 / 원격치과 업체", "ICLO 가능 영역", "Snowflake 계정 담당자", "기술 검증 준비?", "고객 소개 준비?"],
      ["", "", "", "", ""],
    ],
  ],
};

async function build(lang) {
  const isKo = lang === "ko";
  const source = path.join(WORK, lang, "template-starter.pptx");
  const deck = await PresentationFile.importPptx(await FileBlob.load(source));
  const inspection = await deck.inspect({ kind: "slide,textbox,shape,table,notes", include: "id,slide,text,bbox,rows,cols", maxChars: 1000000 });
  const records = inspection.ndjson.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const replacements = isKo ? KO : EN;
  for (const [slideNoText, mapping] of Object.entries(replacements)) {
    const slideNo = Number(slideNoText);
    for (const [oldText, newText] of Object.entries(mapping)) {
      const matches = records.filter((record) => ["textbox", "shape"].includes(record.kind) && record.slide === slideNo && record.text === oldText);
      if (matches.length !== 1) throw new Error(`${lang}: expected one match on slide ${slideNo} for ${JSON.stringify(oldText)}, found ${matches.length}`);
      deck.resolve(matches[0].id).text = newText;
    }
  }

  const tableSets = isKo ? KO_TABLES : EN_TABLES;
  for (const [slideNoText, tablesData] of Object.entries(tableSets)) {
    const slideNo = Number(slideNoText);
    const tableRecords = records.filter((record) => record.kind === "table" && record.slide === slideNo);
    if (tableRecords.length !== tablesData.length) throw new Error(`${lang}: table count mismatch on slide ${slideNo}`);
    for (let t = 0; t < tablesData.length; t += 1) {
      const table = deck.resolve(tableRecords[t].id);
      const values = tablesData[t];
      for (let r = 0; r < values.length; r += 1) {
        for (let c = 0; c < values[r].length; c += 1) table.cells.set(r, c, values[r][c]);
      }
    }
  }

  for (let slideNo = 1; slideNo <= deck.slides.count; slideNo += 1) {
    const noteRecord = records.find((record) => record.kind === "notes" && record.slide === slideNo);
    if (!noteRecord) throw new Error(`No notes record for slide ${slideNo}`);
    deck.resolve(noteRecord.id).setText(noteText(slideNo));
  }

  const base = isKo ? "ICLO-Snowflake-Joint-Validation-Proposal-v6-KO-Internal" : "ICLO-Snowflake-Joint-Validation-Proposal-v6-EN-External";
  const outDir = path.join(OUT, isKo ? "01_KO_Internal" : "02_EN_External");
  const renderDir = path.join(WORK, lang, "final-render");
  const layoutDir = path.join(WORK, lang, "final-layout");
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(renderDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });
  for (let i = 0; i < deck.slides.count; i += 1) {
    const slide = deck.slides.getItem(i);
    const n = String(i + 1).padStart(2, "0");
    const png = await deck.export({ slide, format: "png", scale: 2 });
    await fs.writeFile(path.join(renderDir, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await deck.export({ slide, format: "layout" });
    await fs.writeFile(path.join(layoutDir, `slide-${n}.layout.json`), new Uint8Array(await layout.arrayBuffer()));
  }
  const montage = await deck.export({ format: "webp", montage: true, scale: 0.65 });
  await fs.writeFile(path.join(WORK, lang, "final-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
  const finalInspection = await deck.inspect({ kind: "slide,textbox,shape,image,table,notes,layout", include: "id,slide,text,textPreview,bbox,rows,cols", maxChars: 1000000 });
  await fs.writeFile(path.join(WORK, lang, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");
  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(path.join(outDir, `${base}.pptx`));
  console.log(JSON.stringify({ lang, base, slides: deck.slides.count, outDir }));
}

await build("en");
await build("ko");
