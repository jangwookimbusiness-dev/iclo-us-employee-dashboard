import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v8-template");
const OUT = path.join(ROOT, "output/proposal-v8");
const TEAL = "#008A94";

const COPY = {
  en: {
    s2: {
      old: {
        section: "APPENDIX",
        tag: "HYPOTHESIS / TO BE VALIDATED",
        title: "Employer J-Curve Simulation - Inputs and Outputs",
        subtitle: "A governed planning heuristic should expose assumptions, scenario versions and uncertainty.",
        footer: "External proposal · discussion material",
        page: "13",
        labels: ["POPULATION", "ACCESS", "PLAN", "BASELINE + TIMING"],
        inputs: [
          "Employee/dependent age distribution\nTurnover + average tenure",
          "Workforce geography\nNetwork overlap + provider availability",
          "Plan design + annual maximum\nEmployer contribution + paid/OOP split",
          "Utilization + historical claims\nUntreated need/incidence + run-out",
        ],
        center: "GOVERNED\nSCENARIO MODEL",
        centerSub: "Lineage + version + uncertainty",
        outHeader: "OUTPUTS",
        outputs: [
          "Preventive utilization increase",
          "Newly discovered treatment spend",
          "Allowed / plan-paid / employee OOP separation",
          "Year 1 / Year 2 / Year 3 scenarios",
          "Turnover sensitivity",
          "Network-access sensitivity",
          "Expected data uncertainty",
        ],
        banner: "Planning heuristic - calibrate with customer data; not an ICLO outcome.",
      },
      next: {
        section: "HLS GTM PROPOSAL",
        tag: "CONFIRMED MARKET CONTEXT",
        title: "Coverage Alone Does Not Answer the Employee's Next Question",
        subtitle: "A dental benefit becomes usable only after four separate decisions are resolved.",
        footer: "External proposal · discussion material",
        page: "02",
        labels: ["ELIGIBILITY", "NETWORK", "PLAN RULES", "AVAILABILITY"],
        inputs: [
          "Am I covered today?\nEmployee + dependent status",
          "Which dentist fits my plan?\nIn-network status + distance",
          "What will the plan pay?\nDeductible + coinsurance + max",
          "Can I actually book?\nDirectory status + appointment",
        ],
        center: "EMPLOYEE\nDECISION",
        centerSub: "Coverage → choice → action",
        outHeader: "USABLE CARE",
        outputs: [
          "Eligibility confirmed",
          "In-network option found",
          "Plan rules understood",
          "Expected OOP bounded",
          "Appointment available",
          "Support requested",
          "Visit prepared",
        ],
        banner: "The product reduces decision friction; it does not expose raw clinical probabilities.",
      },
    },
    s4: {
      old: {
        section: "APPENDIX",
        tag1: "ICLO PRODUCT DESIGN PRINCIPLE",
        tag2: "REQUEST TO SNOWFLAKE",
        title: "Data and Responsibility Matrix",
        subtitle: "Platform responsibility, operating responsibility and legal judgment remain separate.",
        footer: "External proposal · discussion material",
        page: "11",
      },
      next: {
        section: "HLS GTM PROPOSAL",
        tag1: "CONFIRMED ICLO DIRECTION",
        tag2: "POC SCOPE",
        title: "The PoC Covers One U.S. Dental-Benefit Operating Lane",
        subtitle: "The U.S. market contains multiple funding models; this proposal validates only self-funded employer dental benefits.",
        footer: "External proposal · discussion material",
        page: "04",
        table: [
          ["Lens", "Korea baseline", "U.S. market", "This PoC", "Why it matters"],
          ["Coverage base", "NHIS-centered; dental is partly supplemental", "Dental benefit may be a separate plan", "Employer-sponsored dental", "Rights and data paths differ"],
          ["Funding risk", "Not this proposal's comparator", "Fully insured, self-funded, public and individual coexist", "Employer funds dental claims", "Employer has a direct stake"],
          ["Administration", "National operating context differs", "Carrier/TPA may run eligibility, network and claims", "One administrator lane", "Cooperation is required"],
          ["Employee task", "Coverage and price questions", "Network, plan rules, OOP and availability", "Employees + dependents", "Benefit must become usable care"],
          ["Evidence", "Not assumed comparable", "Data sit across employer, administrator and providers", "Aggregate employer evidence", "No employee-level PHI"],
        ],
      },
    },
  },
  ko: {
    s2: {
      old: {
        section: "부록",
        tag: "검증할 가설",
        title: "기업별 J-curve 시뮬레이션 - 입력값과 결과",
        subtitle: "계획용 가설은 입력 가정, 시나리오 버전, 불확실성을 모두 보여줘야 합니다.",
        footer: "ICLO 내부 검토 자료",
        page: "13",
        labels: ["가입 인구", "진료 접근성", "치아보험 플랜", "기준값 + 시점"],
        inputs: [
          "직원·가족 연령 분포\n이직률 + 평균 근속기간",
          "근무지 분포\n네트워크 겹침 + 치과 예약 가능성",
          "플랜 구조 + 연간 한도\n기업 부담 + 보험자 지급 / 본인부담 구분",
          "기존 이용률 + 과거 청구\n미치료 수요·발생률 + 청구 반영 지연",
        ],
        center: "통제된\n시나리오 모델",
        centerSub: "데이터 계보 + 버전 + 불확실성",
        outHeader: "결과",
        outputs: [
          "예방진료 이용 증가",
          "새로 발견된 치료비",
          "허용액 / 보험자 지급 / 직원 본인부담 구분",
          "1년차 / 2년차 / 3년차 시나리오",
          "이직률 민감도",
          "네트워크 접근성 민감도",
          "예상 데이터 불확실성",
        ],
        banner: "고객 데이터로 보정할 계획 가설이며 실제 ICLO 성과가 아닙니다.",
      },
      next: {
        section: "내부 검토용 공동 검증 제안",
        tag: "확인된 시장 맥락",
        title: "치아보험이 있어도 다음 행동은 자동으로 정해지지 않습니다",
        subtitle: "임직원은 실제 진료 전에 네 가지 질문을 각각 해결해야 합니다.",
        footer: "ICLO 내부 검토 자료",
        page: "02",
        labels: ["가입 자격", "네트워크", "치아보험 조건", "예약 가능성"],
        inputs: [
          "오늘 보장 대상인가?\n임직원·가족 + 효력일",
          "어느 치과가 플랜에 맞나?\n네트워크 + 거리",
          "치아보험이 얼마를 내나?\n공제액 + 본인부담 + 연간 한도",
          "실제로 예약할 수 있나?\n치과 목록 + 예약 가능 시간",
        ],
        center: "임직원\n의사결정",
        centerSub: "보장 → 선택 → 행동",
        outHeader: "실제 이용",
        outputs: [
          "가입 자격 확인",
          "네트워크 치과 확인",
          "치아보험 조건 이해",
          "예상 본인부담 범위",
          "예약 가능 시간 확인",
          "필요한 지원 요청",
          "진료 준비 완료",
        ],
        banner: "ICLO는 의사결정 마찰을 줄이며, 원시 임상 확률을 노출하지 않습니다.",
      },
    },
    s4: {
      old: {
        section: "부록",
        tag1: "ICLO 제품 설계 원칙",
        tag2: "Snowflake 요청",
        title: "데이터와 책임 구분표",
        subtitle: "플랫폼 기능, 실제 운영, 데이터 제공, 법률 판단의 책임을 구분합니다.",
        footer: "ICLO 내부 검토 자료",
        page: "11",
      },
      next: {
        section: "내부 검토용 공동 검증 제안",
        tag1: "확정된 ICLO 방향",
        tag2: "PoC 범위",
        title: "PoC는 미국 치아보험 시장의 한 운영 구조만 검증합니다",
        subtitle: "미국에는 여러 비용부담 방식이 공존하며, 이번 제안은 self-funded employer 치아보험에만 초점을 둡니다.",
        footer: "ICLO 내부 검토 자료",
        page: "04",
        table: [
          ["구분", "한국 이해 기준", "미국 시장", "이번 PoC", "의미"],
          ["보장 기반", "국민건강보험 중심; 치과 일부 비급여", "치아보험이 별도 복지 플랜일 수 있음", "기업 제공 치아보험", "권리·데이터 경로가 다름"],
          ["비용 위험", "이번 PoC의 비교 대상 아님", "완전보험·자가부담·공공·개인 시장 공존", "기업이 치아보험 청구비용 부담", "기업의 직접 이해관계"],
          ["운영", "국내 운영 구조와 다름", "보험사/TPA가 가입·네트워크·청구 운영 가능", "운영사 한 곳의 데이터 경로", "협조와 권리 확인 필요"],
          ["임직원 과업", "급여·비급여와 예상비용 이해", "네트워크·플랜·본인부담·예약 확인", "임직원·가족", "혜택을 실제 이용으로 전환"],
          ["기업 근거", "동일 기준으로 가정하지 않음", "데이터가 여러 기관에 분산", "기업 단위 집계 근거", "직원별 PHI 미노출"],
        ],
      },
    },
  },
};

function findOne(records, slide, text) {
  const hits = records.filter((r) => r.slide === slide && ["textbox", "shape"].includes(r.kind) && r.text === text);
  if (hits.length !== 1) throw new Error(`slide ${slide}: expected one match for ${JSON.stringify(text)}, found ${hits.length}`);
  return hits[0];
}

function replaceText(deck, records, slide, oldText, newText) {
  const shape = deck.resolve(findOne(records, slide, oldText).id);
  shape.text = newText;
  return shape;
}

function applyTextBlock(deck, records, slide, oldBlock, nextBlock) {
  replaceText(deck, records, slide, oldBlock.section, nextBlock.section).text.style = { fontSize: 16, bold: true, color: TEAL };
  replaceText(deck, records, slide, oldBlock.tag, nextBlock.tag);
  replaceText(deck, records, slide, oldBlock.title, nextBlock.title);
  replaceText(deck, records, slide, oldBlock.subtitle, nextBlock.subtitle);
  replaceText(deck, records, slide, oldBlock.footer, nextBlock.footer);
  replaceText(deck, records, slide, oldBlock.page, nextBlock.page);
  oldBlock.labels.forEach((value, i) => replaceText(deck, records, slide, value, nextBlock.labels[i]));
  oldBlock.inputs.forEach((value, i) => replaceText(deck, records, slide, value, nextBlock.inputs[i]));
  replaceText(deck, records, slide, oldBlock.center, nextBlock.center);
  replaceText(deck, records, slide, oldBlock.centerSub, nextBlock.centerSub);
  replaceText(deck, records, slide, oldBlock.outHeader, nextBlock.outHeader);
  oldBlock.outputs.forEach((value, i) => replaceText(deck, records, slide, value, nextBlock.outputs[i]));
  replaceText(deck, records, slide, oldBlock.banner, nextBlock.banner);
}

function applyScopeTable(deck, records, oldBlock, nextBlock) {
  replaceText(deck, records, 4, oldBlock.section, nextBlock.section).text.style = { fontSize: 16, bold: true, color: TEAL };
  replaceText(deck, records, 4, oldBlock.tag1, nextBlock.tag1);
  replaceText(deck, records, 4, oldBlock.tag2, nextBlock.tag2);
  replaceText(deck, records, 4, oldBlock.title, nextBlock.title);
  replaceText(deck, records, 4, oldBlock.subtitle, nextBlock.subtitle);
  replaceText(deck, records, 4, oldBlock.footer, nextBlock.footer);
  replaceText(deck, records, 4, oldBlock.page, nextBlock.page);
  const tableRecord = records.find((r) => r.slide === 4 && r.kind === "table" && r.rows === 6 && r.cols === 5);
  if (!tableRecord) throw new Error("slide 4: 6x5 source table not found");
  const table = deck.resolve(tableRecord.id);
  for (let r = 0; r < nextBlock.table.length; r += 1) {
    for (let c = 0; c < nextBlock.table[r].length; c += 1) table.cells.set(r, c, nextBlock.table[r][c]);
  }
}

async function build(lang) {
  const isKo = lang === "ko";
  const starter = path.join(WORK, lang, "template-starter.pptx");
  const deck = await PresentationFile.importPptx(await FileBlob.load(starter));
  const inspection = await deck.inspect({ kind: "slide,textbox,shape,image,table,notes", include: "id,slide,text,textPreview,bbox,rows,cols", maxChars: 1000000 });
  const records = inspection.ndjson.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const cfg = COPY[lang];

  applyTextBlock(deck, records, 2, cfg.s2.old, cfg.s2.next);
  applyScopeTable(deck, records, cfg.s4.old, cfg.s4.next);

  if (isKo) {
    deck.slides.getItem(1).speakerNotes.textFrame.setText(
      "치아보험 가입 여부와 실제 진료 이용 사이의 네 가지 의사결정 마찰을 보여준다. 선형 절차가 아니라 직원이 동시에 확인해야 하는 입력-판단-결과 구조다.\n\n[Sources]\n- User-provided ICLO x Snowflake external briefing requirements, 2026-08-05\n- ADA, Dental benefit plan designs: https://www.ada.org/resources/practice/dental-insurance/benefit-plan-designs"
    );
    deck.slides.getItem(3).speakerNotes.textFrame.setText(
      "미국 전체 치아보험 시장을 일반화하지 않고, 여러 구조 가운데 이번 PoC가 검증하는 self-funded employer 치아보험 한 레인만 비교한다. 한국 비교는 이해를 돕기 위한 제한적 기준이다.\n\n[Sources]\n- User-provided ICLO x Snowflake external briefing requirements, 2026-08-05\n- U.S. Department of Labor, self-insured group health plans\n- ADA, Dental benefit plan designs"
    );
  } else {
    for (const slide of deck.slides.items) {
      slide.speakerNotes.clear();
      slide.speakerNotes.setVisible(false);
    }
  }

  const base = isKo
    ? "ICLO-Snowflake-Joint-Validation-Proposal-v8-KO-Internal"
    : "ICLO-Snowflake-Joint-Validation-Proposal-v8-EN-External-Notes-Stripped";
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
  console.log(JSON.stringify({ lang, slides: deck.slides.count, output: path.join(outDir, `${base}.pptx`) }));
}

await build("en");
await build("ko");
