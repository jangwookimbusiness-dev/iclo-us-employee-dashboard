import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v7-template");
const OUT = path.join(ROOT, "output/proposal-v7");

const COLORS = {
  navy: "#1D3155",
  gray: "#63738A",
  sky: "#29B5E8",
  teal: "#008A94",
  amber: "#E09A19",
  rule: "#D7E0EA",
};

const PUBLIC_SOURCES = [
  "https://docs.snowflake.com/en/user-guide/intro-editions",
  "https://docs.snowflake.com/en/user-guide/security-row-intro",
  "https://docs.snowflake.com/en/user-guide/data-protection-policies-snowsight",
  "https://docs.snowflake.com/en/user-guide/access-history",
  "https://docs.snowflake.com/en/user-guide/secure-data-sharing-across-regions-platforms",
];

const copy = {
  en: {
    slide1Subtitle: "This proposal converts ICLO's existing Snowflake startup support into a structured 90-day joint validation. [Official program name / current sponsor: confirm]",
    slide9Title: "Convert Existing Snowflake Support into a Routed Validation",
    slide9Subtitle: "Step 0 is routing: the current Korea startup sponsor names the U.S. HLS GTM and architecture owners before technical work begins.",
    slide9Rows: [
      ["ROUTE", "Confirm the official support-program name; the current Korea sponsor routes ICLO to U.S. HLS GTM and architecture."],
      ["FIT + PEOPLE", "Confirm the primary sales play and name the HLS architect, SE, security/compliance and startup/partner leads."],
      ["ACCOUNT", "Complete one account diligence row by Day 30; run a separate account-team use-case review by Day 75."],
      ["PATH", "Document account/region/BAA, credits/support and partner/co-sell readiness criteria."],
    ],
    slide10Title: "A 90-Day Validation with Explicit Owners, Gates and Outputs",
    slide10Subtitle: "Each phase assigns Snowflake and ICLO actions; ICLO owns the cadence and decision log.",
    phases: [
      {
        phase: "STEP 0 + DAYS 0-30", title: "ROUTE + ALIGN",
        snowflake: "Route to HLS; confirm play, owners and the U.S. account / BAA path.",
        iclo: "Provide current-state pack; run workshop and cadence.",
        gate: "GATE · Sponsor, owners and route in writing",
      },
      {
        phase: "DAYS 31-60", title: "DESIGN",
        snowflake: "Size workload; co-draft the security reference and account matrix.",
        iclo: "Provide source map, ingestion test and sizing inputs.",
        gate: "GATE · Architecture + matrix v1 accepted",
      },
      {
        phase: "DAYS 61-90", title: "VALIDATE",
        snowflake: "Sponsor one account-team review; issue the partner-readiness checklist.",
        iclo: "Run review; recommend go / no-go.",
        gate: "GATE · Use case + evidence minimum agreed",
      },
      {
        phase: "CONDITIONAL", title: "EXPAND",
        snowflake: "Assess Native App, Clean Room or federated learning only if needed.",
        iclo: "Build only after multi-party demand is confirmed.",
        gate: "TRIGGER · Account review confirms multi-party need",
      },
    ],
    slide10Bottom: "OPERATING MODEL · ICLO runs weekly written status and one decision log.\nCONSUMPTION MODEL · employers × member-months × ingestion / transform / outcome-refresh frequency → annual credits [estimate in sizing session].",
    q1: "Given ICLO's current Snowflake status [account / cloud / region / credits: confirm], what is the practical U.S. Business Critical and BAA path?",
    about: {
      tag: "COMPLETION REQUIRED",
      title: "About ICLO - What Is Confirmed and What Must Be Completed",
      subtitle: "Program selections and a defined product/data boundary support validation; current Snowflake status must be confirmed before release.",
      leftHeader: "ICLO AT A GLANCE",
      items: [
        ["COMPANY", "[Legal entity · HQ · stage · team size: confirm before release]"],
        ["PRODUCT", "HomeDen SaaS (PMS / EMR / CRM) plus employer dental-benefit navigation and claims-evidence design"],
        ["PROGRAMS", "Selected: Fintech Cube Cohort 9; Shinhan Future's Lab Cohort 12"],
        ["SNOWFLAKE STATUS", "[Current account · cloud · region · credits · support owner: confirm]"],
        ["NEXT PROOF", "One U.S. self-funded employer dental-data path plus one account-team review"],
      ],
      rightHeader: "CONFIRMED / TO COMPLETE",
      right: [
        ["CONFIRMED", "Program selections; product/data boundary; target PoC lane"],
        ["RELATIONSHIP", "[Official Snowflake program name and current sponsor: confirm]"],
        ["CURRENT STATE", "[Account, cloud, region, credits, usage and support owner: confirm]"],
      ],
      bottom: "Before release: replace all bracketed fields. Program selection does not prove insurer integration, underwriting, adjudication or U.S. outcomes.",
    },
  },
  ko: {
    slide1Subtitle: "현재 Snowflake 지원 관계를 구조화된 90일 공동 검증으로 전환하는 제안입니다. [공식 프로그램명·현재 스폰서 확인 필요]",
    slide9Title: "기존 Snowflake 지원을 미국 HLS 공동 검증 경로로 전환합니다",
    slide9Subtitle: "Step 0에서 현재 한국 스타트업 담당이 미국 HLS GTM·아키텍처 담당자를 지정·연결한 뒤 기술 검증을 시작합니다.",
    slide9Rows: [
      ["라우팅", "공식 지원 프로그램명·현재 스폰서를 확인하고, 미국 HLS GTM·아키텍처 담당자로 연결합니다."],
      ["적합성 + 담당", "주요 영업 유형과 HLS 아키텍트·SE·보안·스타트업/파트너 담당자를 문서로 확정합니다."],
      ["계정", "Day 30까지 계정 검증 행 1건을 작성하고, Day 75에 계정팀 사용사례 검토를 별도로 진행합니다."],
      ["진행 경로", "계정·리전·BAA, 크레딧·지원 범위, 파트너·공동판매 준비 기준을 문서화합니다."],
    ],
    slide10Title: "Snowflake와 ICLO의 역할·게이트·산출물을 90일 안에 명확히 합니다",
    slide10Subtitle: "각 단계의 담당과 진입 조건을 구분하고, ICLO가 운영 케이던스와 단일 의사결정 기록을 맡습니다.",
    phases: [
      {
        phase: "STEP 0 + 0-30일", title: "라우팅 + 정렬",
        snowflake: "HLS로 연결하고 영업 유형·담당·미국 계정/BAA 경로를 확정합니다.",
        iclo: "현황 자료를 제공하고 워크숍·주간 운영을 맡습니다.",
        gate: "게이트 · 스폰서·담당·경로 서면 확정",
      },
      {
        phase: "31-60일", title: "설계",
        snowflake: "사용량을 산정하고 보안 기준 구조·계정 매트릭스를 공동 작성합니다.",
        iclo: "원천 데이터 매핑·수집 시험·사이징 입력값을 제공합니다.",
        gate: "게이트 · 아키텍처와 매트릭스 1차본 승인",
      },
      {
        phase: "61-90일", title: "검증",
        snowflake: "계정팀 검토 1건을 후원하고 파트너 준비 체크리스트를 제공합니다.",
        iclo: "검토를 운영하고 진행/보류안을 제시합니다.",
        gate: "게이트 · 사용사례와 최소 근거 합의",
      },
      {
        phase: "조건부", title: "확장",
        snowflake: "필요성이 확인된 경우에만 Native App·Clean Room·연합학습을 검토합니다.",
        iclo: "다자간 수요가 확인된 뒤에만 확장 기능을 구축합니다.",
        gate: "발동 조건 · 계정 검토에서 다자간 수요 확인",
      },
    ],
    slide10Bottom: "운영 방식 · ICLO가 주간 서면 현황과 단일 의사결정 기록을 관리합니다.\n사용량 산정 · 기업 수 × 가입자-월 × 수집·변환·결과 갱신 빈도 → 연간 크레딧[사이징 세션에서 산정].",
    q1: "ICLO의 현재 Snowflake 상태[계정·클라우드·리전·크레딧 확인 필요]를 기준으로 미국 Business Critical·BAA 경로를 어떻게 정할 것인가?",
    about: {
      tag: "외부 공유 전 확인",
      title: "ICLO 소개 - 확인된 내용과 반드시 채울 항목",
      subtitle: "프로그램 선정과 제품·데이터 경계는 검증의 기반이지만, 현재 Snowflake 상태는 외부 공유 전에 확인해야 합니다.",
      leftHeader: "ICLO 핵심 정보",
      items: [
        ["회사", "[법인명·본사·사업 단계·핵심 인력 수: 외부 공유 전 확인]"],
        ["제품", "HomeDen SaaS(PMS·EMR·CRM)와 임직원 치아보험 이용지원·청구 근거 설계"],
        ["선정", "핀테크지원센터 Fintech Cube 9기·신한퓨쳐스랩 12기 선정"],
        ["SNOWFLAKE 상태", "[현재 계정·클라우드·리전·크레딧·지원 담당자: 확인]"],
        ["다음 입증", "미국 self-funded employer 치아보험 데이터 경로 1건과 계정팀 검토 1건"],
      ],
      rightHeader: "확인됨 / 추가 확인",
      right: [
        ["확인됨", "프로그램 선정·제품/데이터 경계·현재 PoC 대상 경로"],
        ["지원 관계", "[Snowflake 공식 프로그램명과 현재 스폰서: 확인]"],
        ["현재 상태", "[계정·클라우드·리전·크레딧·사용량·지원 담당자: 확인]"],
      ],
      bottom: "외부 공유 전 대괄호를 모두 교체합니다. 프로그램 선정은 보험사 연동·인수·심사 또는 미국 성과를 입증하지 않습니다.",
    },
  },
};

function addText(slide, name, text, position, style) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = style;
  return shape;
}

function addRule(slide, name, position) {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position,
    fill: COLORS.rule,
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function findOne(records, slide, text) {
  const hits = records.filter((r) => r.slide === slide && ["textbox", "shape"].includes(r.kind) && r.text === text);
  if (hits.length !== 1) throw new Error(`slide ${slide}: expected one match for ${JSON.stringify(text)}, found ${hits.length}`);
  return hits[0];
}

function replaceText(deck, records, slide, oldText, newText) {
  deck.resolve(findOne(records, slide, oldText).id).text = newText;
}

function resizeCards(deck, records) {
  const xs = [64, 355, 646, 937];
  for (const x of xs) {
    const hit = records.find((r) => r.slide === 10 && r.kind === "shape" && Array.isArray(r.bbox) && r.bbox[0] === x && r.bbox[1] === 218 && r.bbox[2] === 252 && r.bbox[3] === 226);
    if (!hit) throw new Error(`slide 10: card not found at x=${x}`);
    deck.resolve(hit.id).position = { left: x, top: 218, width: 252, height: 240 };
  }
}

function moveFlowArrows(deck, records) {
  const xs = [316, 607, 898];
  for (const x of xs) {
    const hit = records.find((r) => r.slide === 10 && r.kind === "shape" && Array.isArray(r.bbox) && r.bbox[0] === x && r.bbox[1] === 331 && r.bbox[2] === 39);
    if (!hit) throw new Error(`slide 10: flow arrow not found at x=${x}`);
    deck.resolve(hit.id).position = { left: x, top: 470, width: 39, height: 0 };
  }
}

function buildSwimlane(deck, records, lang, cfg) {
  const slide = deck.slides.getItem(9);
  const original = lang === "en" ? {
    title: "A 90-Day Joint Validation Plan",
    subtitle: "The outcome is a validated architecture and one account-team use-case review, not a co-sell commitment.",
    phase: ["DAYS 0-30", "DAYS 31-60", "DAYS 61-90", "CONDITIONAL"],
    title2: ["ALIGN", "DESIGN", "VALIDATE", "EXPAND"],
    body: [
      "Sales play\nNamed stakeholders\nU.S. account / region / BAA path\nArchitecture workshop",
      "Ingestion pattern\n2.5K / 10K / 25K sizing\nSecurity reference\nAccount matrix v1",
      "One employer or administrator account-team review\nPartner checklist\nNext / no-go decision",
      "Native App\nMulti-party Clean Room\nFederated learning\nJoint story / design partner",
    ],
    bottom: "We are not asking Snowflake to validate our dental AI or make ICLO compliant. We are asking Snowflake to help determine whether this can become a repeatable, governed payer/TPA data-collaboration pattern - and what ICLO must prove to make the partnership commercially real.",
  } : {
    title: "90일 동안 기술 구조와 계정 수요를 함께 검증합니다",
    subtitle: "목표는 공동판매 약속이 아니라 검증된 구조와 한 계정팀의 사용사례 검토입니다.",
    phase: ["0-30일", "31-60일", "61-90일", "조건부"],
    title2: ["정렬", "설계", "검증", "확장"],
    body: [
      "영업 유형\n담당자 지정\n미국 계정·리전·BAA 경로\n아키텍처 워크숍",
      "데이터 수집 방식\n2.5K / 10K / 25K 규모 산정\n보안 기준 구조\n계정 매트릭스 1차본",
      "기업 또는 운영사 계정팀 1곳 검토\n파트너 체크리스트\n진행 / 보류 결정",
      "Native App\n다자간 Clean Room\n연합학습 검토\n공동 사례 / 설계 파트너",
    ],
    bottom: "Snowflake에 치과 AI를 검증하거나 ICLO를 규제 준수 상태로 만들어 달라는 요청이 아닙니다. 반복 가능한 payer/TPA 데이터 협업 구조가 될 수 있는지, ICLO가 무엇을 입증해야 상업적 협력이 가능한지 함께 확인하려는 제안입니다.",
  };

  replaceText(deck, records, 10, original.title, cfg.slide10Title);
  replaceText(deck, records, 10, original.subtitle, cfg.slide10Subtitle);
  replaceText(deck, records, 10, original.bottom, cfg.slide10Bottom);
  resizeCards(deck, records);
  moveFlowArrows(deck, records);

  const xs = [64, 355, 646, 937];
  for (let i = 0; i < 4; i += 1) {
    const phaseShape = deck.resolve(findOne(records, 10, original.phase[i]).id);
    phaseShape.text = cfg.phases[i].phase;
    phaseShape.position = { left: xs[i] + 18, top: 226, width: 216, height: 18 };
    phaseShape.text.style = { fontSize: 16, bold: true, color: i === 3 ? COLORS.amber : (i === 2 ? "#FF6F73" : (i === 1 ? COLORS.sky : COLORS.teal)) };

    const titleShape = deck.resolve(findOne(records, 10, original.title2[i]).id);
    titleShape.text = cfg.phases[i].title;
    titleShape.position = { left: xs[i] + 18, top: 248, width: 216, height: 28 };
    titleShape.text.style = { fontSize: 23, bold: true, color: COLORS.navy };

    const bodyShape = deck.resolve(findOne(records, 10, original.body[i]).id);
    bodyShape.text = cfg.phases[i].snowflake;
    bodyShape.position = { left: xs[i] + 18, top: 302, width: 216, height: 49 };
    bodyShape.text.style = { fontSize: 15, color: COLORS.gray };

    addText(slide, `swimlane-snowflake-${i + 1}`, "SNOWFLAKE", { left: xs[i] + 18, top: 282, width: 216, height: 18 }, { fontSize: 15, bold: true, color: COLORS.sky });
    addRule(slide, `swimlane-rule-${i + 1}`, { left: xs[i] + 18, top: 357, width: 216, height: 1 });
    addText(slide, `swimlane-iclo-label-${i + 1}`, "ICLO", { left: xs[i] + 18, top: 362, width: 216, height: 18 }, { fontSize: 15, bold: true, color: COLORS.teal });
    addText(slide, `swimlane-iclo-${i + 1}`, cfg.phases[i].iclo, { left: xs[i] + 18, top: 383, width: 216, height: 28 }, { fontSize: 14, color: COLORS.gray });
    addText(slide, `swimlane-gate-${i + 1}`, cfg.phases[i].gate, { left: xs[i] + 18, top: 419, width: 216, height: 33 }, { fontSize: 13, bold: true, color: i === 3 ? COLORS.amber : COLORS.navy });
  }
}

function buildAbout(deck, records, lang, cfg) {
  const a = cfg.about;
  const old = lang === "en" ? {
    tag: "REQUEST TO SNOWFLAKE", title: "Detailed Snowflake Technical Questions",
    subtitle: "Resolve the pilot pattern first; treat application packaging and multi-party ML as conditional.",
    leftHeader: "PRIORITY NOW",
    items: [
      "What is the practical U.S. account, cloud/region, Business Critical and BAA path?",
      "When should we use same-region Direct Share versus controlled SFTP/API staging?",
      "What tenancy, purpose-access, masking, row-policy and access-history pattern do you recommend?",
      "How should we size 2.5K / 10K / 25K populations and measure post-credit unit economics?",
      "What must ICLO prove for startup, partner, Powered by Snowflake or co-sell readiness?",
    ],
    rightHeader: "CONDITIONAL / LATER",
    rightHeads: ["Native App", "Clean Room", "Federated learning"],
    rightBody: [
      "When does customer-account execution create repeatability beyond a connector pattern?",
      "What real multi-party payer / TPA / employer collaboration would justify it?",
      "Does this mean true local training and parameter aggregation, or collaborative ML inside a Clean Room, Native App or customer-account execution pattern?",
    ],
    bottom: "Not required for the first employer pilot.",
    footer: "External proposal · discussion material",
  } : {
    tag: "Snowflake 요청", title: "Snowflake에 확인할 기술 질문",
    subtitle: "첫 파일럿의 데이터 연결 방식을 먼저 정하고, 앱 패키징과 다자간 ML은 후순위로 둡니다.",
    leftHeader: "지금 결정할 항목",
    items: [
      "미국 계정, 클라우드·리전, Business Critical, BAA의 실제 개설 절차는?",
      "같은 리전의 Direct Share와 통제된 SFTP/API 수집은 언제 각각 쓰는가?",
      "테넌시, 목적별 접근, 마스킹, 행 정책, 접근 기록을 어떻게 설계하는가?",
      "2,500 / 10,000 / 25,000명 규모의 비용과 크레딧 이후 단위 경제성을 어떻게 산정하는가?",
      "스타트업·파트너·Powered by Snowflake·공동판매 준비를 위해 무엇을 입증해야 하는가?",
    ],
    rightHeader: "조건부 / 추후",
    rightHeads: ["Native App", "Clean Room", "연합학습"],
    rightBody: [
      "언제 단순 연결기를 넘어 반복 가능한 고객 계정 실행이 필요한가?",
      "여러 payer·TPA·기업이 실제로 협업할 때 필요한가?",
      "기관별 로컬 학습인가, Snowflake 안의 협업형 ML인가?",
    ],
    bottom: "첫 기업 파일럿의 필수 조건이 아닙니다.",
    footer: "ICLO 내부 검토 자료",
  };

  replaceText(deck, records, 15, old.tag, a.tag);
  replaceText(deck, records, 15, old.title, a.title);
  replaceText(deck, records, 15, old.subtitle, a.subtitle);
  replaceText(deck, records, 15, old.leftHeader, a.leftHeader);
  replaceText(deck, records, 15, old.rightHeader, a.rightHeader);
  replaceText(deck, records, 15, old.footer, old.footer);
  replaceText(deck, records, 15, "12", "15");
  for (let i = 0; i < 5; i += 1) replaceText(deck, records, 15, old.items[i], `${a.items[i][0]}\n${a.items[i][1]}`);
  for (let i = 0; i < 3; i += 1) {
    replaceText(deck, records, 15, old.rightHeads[i], a.right[i][0]);
    replaceText(deck, records, 15, old.rightBody[i], a.right[i][1]);
  }
  const bottomShape = deck.resolve(findOne(records, 15, old.bottom).id);
  bottomShape.text = a.bottom;
  bottomShape.position = { left: 686, top: 570, width: 500, height: 44 };
  bottomShape.text.style = { fontSize: 14, bold: true, color: COLORS.amber };
}

async function build(lang) {
  const isKo = lang === "ko";
  const cfg = copy[lang];
  const source = path.join(WORK, lang, "template-starter.pptx");
  const deck = await PresentationFile.importPptx(await FileBlob.load(source));
  const inspection = await deck.inspect({ kind: "slide,textbox,shape,table,notes", include: "id,slide,text,bbox,rows,cols", maxChars: 1000000 });
  const records = inspection.ndjson.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

  replaceText(deck, records, 1,
    isKo ? "임직원은 치아보험을 더 쉽게 이용하고, 기업은 이용·청구 데이터로 플랜·운영사·치과복지를 판단합니다." : "Employees navigate dental benefits more easily; employers use utilization and claims evidence to improve plan and workforce-benefit decisions.",
    cfg.slide1Subtitle,
  );

  replaceText(deck, records, 9,
    isKo ? "Snowflake에 요청하는 것은 고객 소개가 아니라 검증 경로입니다" : "What We Need from Snowflake GTM and Architecture",
    cfg.slide9Title,
  );
  replaceText(deck, records, 9,
    isKo ? "산업 적합성, 내부 전문가 연결, 계정팀 검증, 파트너 준비 기준을 요청합니다." : "We need industry fit, internal coordination and account-path sponsorship - not generic introductions.",
    cfg.slide9Subtitle,
  );
  const rowHeads = isKo ? ["적합성", "전문가", "계정", "진행 경로"] : ["FIT", "PEOPLE", "ACCOUNTS", "PATH"];
  const rowBody = isKo ? [
    "어떤 HLS 영업 유형에 가장 자연스럽게 들어가는가?",
    "HLS 아키텍트, 솔루션 엔지니어, 보안·컴플라이언스, 스타트업·파트너 담당자를 지정해 달라.",
    "self-funded employer 치아보험 계정팀 또는 운영사·TPA 계정팀 한 곳에서 데이터와 수요를 검증해 달라.",
    "계정·리전·BAA, credits/support 범위, 파트너·공동판매 준비 기준을 문서로 달라.",
  ] : [
    "Which HLS sales play fits naturally: payer claims analytics, benefits navigation, healthtech applications or secure collaboration?",
    "Name the HLS architect, solution engineer, security/compliance owner and startup/partner lead.",
    "Select one self-funded employer dental account team or administrator/TPA team to validate data and need before any introduction.",
    "Provide written account/region/BAA, credits/support scope and partner/co-sell readiness criteria.",
  ];
  for (let i = 0; i < 4; i += 1) {
    replaceText(deck, records, 9, rowHeads[i], cfg.slide9Rows[i][0]);
    replaceText(deck, records, 9, rowBody[i], cfg.slide9Rows[i][1]);
  }

  buildSwimlane(deck, records, lang, cfg);
  replaceText(deck, records, 12,
    isKo ? "미국 계정, 클라우드·리전, Business Critical, BAA의 실제 개설 절차는?" : "What is the practical U.S. account, cloud/region, Business Critical and BAA path?",
    cfg.q1,
  );
  buildAbout(deck, records, lang, cfg);

  for (let i = 0; i < deck.slides.count; i += 1) {
    const slide = deck.slides.getItem(i);
    if (isKo) {
      if (i === 0) slide.speakerNotes.textFrame.setText("첫 장에서 현재 Snowflake 지원 관계를 90일 공동 검증으로 전환한다는 목적을 명시한다. 공식 프로그램명과 현재 스폰서는 외부 공유 전에 확인한다.");
      else if (i === 8) slide.speakerNotes.textFrame.setText("Step 0은 현재 한국 담당자가 미국 HLS GTM·아키텍처 담당자로 연결하는 라우팅 단계다. 계정 검증 행 작성과 계정팀 사용사례 검토를 서로 다른 액션으로 구분한다.");
      else if (i === 9) slide.speakerNotes.textFrame.setText("Snowflake와 ICLO의 단계별 역할, 게이트, 공동 산출물을 한 화면에 묶는다. ICLO가 주간 현황과 단일 의사결정 기록을 운영한다.");
      else if (i === 11) slide.speakerNotes.textFrame.setText("현재 Snowflake 계정·클라우드·리전·크레딧 상태를 확인한 뒤 미국 Business Critical·BAA 경로를 구체화한다.");
      else if (i === 14) slide.speakerNotes.textFrame.setText("대괄호 항목은 외부 공유 전 반드시 채운다. 프로그램 선정은 협업 준비 신호이며 보험사 연동·인수·심사 또는 미국 성과 완료를 뜻하지 않는다.");
    } else {
      slide.speakerNotes.clear();
      slide.speakerNotes.setVisible(false);
    }
  }

  const base = isKo ? "ICLO-Snowflake-Joint-Validation-Proposal-v7-KO-Internal" : "ICLO-Snowflake-Joint-Validation-Proposal-v7-EN-External-Notes-Stripped";
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
