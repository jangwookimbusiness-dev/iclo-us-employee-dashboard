import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-booth-v3");
const SOURCE = path.join(WORK, "template-starter.pptx");
const OUTPUT = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v3.pptx");
const RENDER_DIR = path.join(WORK, "final-render-2560x1440");
const LAYOUT_DIR = path.join(WORK, "final-layout");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,notes",
  include: "id,slide,text,textPreview,bbox",
  maxChars: 1000000,
});
const records = inspection.ndjson.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

function findTextObject(slide, fullText) {
  const matches = records.filter(
    (record) =>
      (record.kind === "textbox" || record.kind === "shape") &&
      record.slide === slide &&
      record.text === fullText,
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one text object on slide ${slide} for ${JSON.stringify(fullText)}; found ${matches.length}`);
  }
  return presentation.resolve(matches[0].id);
}

function rewrite(slide, oldText, newText) {
  findTextObject(slide, oldText).text.replace(oldText, newText);
}

function rewriteWhole(slide, oldText, newText) {
  findTextObject(slide, oldText).text = newText;
}

function rewriteAndPosition(slide, oldText, newText, position) {
  const target = findTextObject(slide, oldText);
  target.text = newText;
  target.position = position;
}

function setSlideNote(slideNumber, noteText) {
  const noteRecord = records.find((record) => record.kind === "notes" && record.slide === slideNumber);
  if (!noteRecord) throw new Error(`No speaker note object on slide ${slideNumber}`);
  presentation.resolve(noteRecord.id).setText(noteText);
}

function repositionByAnchor(anchorId, position) {
  presentation.resolve(anchorId).position = position;
}

// Slide 1 - B-prime problem opening, with employee benefits and a visible product boundary.
rewriteAndPosition(
  1,
  "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치과보험·임직원 복지",
  "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치아보험·임직원 복지",
  { left: 62, top: 132, width: 590, height: 24 },
);
rewriteAndPosition(
  1,
  "MAKE DENTAL INSURANCE\nMORE ACCESSIBLE.",
  "MAKE DENTAL INSURANCE\nAND BENEFITS\nMORE ACCESSIBLE.",
  { left: 58, top: 171, width: 600, height: 214 },
);
rewriteAndPosition(
  1,
  "치아보험이 있어도 실제 진료를 받기는 여전히 어렵습니다.",
  "임직원이 미국의 치아보험과 복지 혜택을\n더 쉽게 이해하고 이용하도록 돕습니다.",
  { left: 62, top: 414, width: 570, height: 74 },
);
rewriteAndPosition(
  1,
  "Employees navigate care. Employers see claims-verified, aggregate evidence.",
  "Employee dental-benefit navigation in front. Claims-verified evidence in back.",
  { left: 62, top: 558, width: 575, height: 30 },
);
rewriteAndPosition(
  1,
  "직원은 필요한 진료를 찾고, 회사는 청구 데이터에 근거한 집계 결과를 확인합니다.",
  "직원은 진료를 찾고, 기업은 청구 데이터로 집계 결과를 확인합니다.",
  { left: 62, top: 595, width: 575, height: 28 },
);
rewriteAndPosition(
  1,
  "Employee access · Claims-verified evidence on Snowflake / 직원 진료 접근 · Snowflake 기반 청구 검증",
  "NOT DENTAL INSURANCE SALES OR UNDERWRITING / 치아보험 판매·인수 모델 아님",
  { left: 62, top: 640, width: 585, height: 24 },
);
repositionByAnchor("sh/wn6dc7eh", { left: 62, top: 527, width: 100, height: 5 });

// Slide 2 - concrete U.S. dental-insurance access friction.
rewrite(2, "치아보험에 가입했어도 실제 이용이 쉬워지는 것은 아닙니다.", "치아보험에 가입해도 실제 진료 이용은 여전히 복잡합니다.");
rewrite(2, "내 치아보험 네트워크에 포함된 치과", "내 치아보험 네트워크 안의 치과");
rewrite(2, "OOP · DEDUCTIBLE · MAX", "DEDUCTIBLE · COINSURANCE\nANNUAL MAXIMUM");
rewrite(2, "본인부담·공제액·연간 한도", "공제액·본인부담률·연간 한도");
rewrite(2, "실제로 예약할 수 있는지 확인", "실제 예약 가능성과 방문 준비");
rewrite(2, "Employees rarely see all three in one place.", "Network and plan rules can limit choice or increase employee cost.");
rewrite(2, "직원은 이 세 가지를 한 번에 확인하기 어렵습니다.", "네트워크와 플랜 조건에 따라 선택이 제한되거나 본인부담이 커질 수 있습니다.");

// Slide 3 - employer-sponsored dental-benefit program plus Snowflake evidence layer.
rewrite(3, "Navigation in front. Evidence in back.", "Dental benefits. Evidence on Snowflake.");
rewrite(3, "앞에서는 이용을 돕고, 뒤에서는 근거를 만듭니다.", "임직원 치과복지 이용을 Snowflake 기반 근거로 연결합니다.");
rewrite(3, "Employee experience", "Dental-benefit program");
rewrite(3, "직원 경험", "임직원 복지 프로그램");
rewriteWhole(
  3,
  "Benefit understanding\n혜택 이해\nNetwork context\n네트워크 정보\nRequested support\n직원 요청에 따른 지원",
  "Understand dental benefits\n치아보험 혜택 이해\nFind in-network care\n네트워크 치과 탐색\nEmployee-requested support\n직원 요청에 따른 예약 지원",
);
rewriteWhole(
  3,
  "ELIGIBILITY + PLAN\n가입 자격·치아보험 조건\nAPP EVENTS + CLAIMS\n앱 이용 기록·청구 데이터",
  "ELIGIBILITY + PLAN\n가입 자격·플랜 조건\nAPP EVENTS + DENTAL CLAIMS\n앱 이용 기록·치아보험 청구",
);
rewrite(3, "Employer evidence", "Employer evidence");
rewrite(3, "기업용 집계 결과", "기업용 집계 근거");
rewriteWhole(
  3,
  "Claims-confirmed use\n청구 데이터로 확인된 이용\nAllowed · paid · OOP\n허용액·지급액·본인부담금\nAggregate employer view\n기업에는 집계 결과만",
  "Claims-confirmed use\n청구로 확인된 이용\nAllowed · paid · OOP\n허용액·지급액·본인부담금\nFreshness · lag · completeness\n기준일·지연·완결성",
);
rewrite(3, "SNOWFLAKE", "SNOWFLAKE");
rewrite(3, "Authorized structured data + approved signals only", "Approved data · purpose-based access · quality · lineage");
rewrite(3, "승인된 구조화 데이터와 신호만 저장", "승인된 데이터·품질 대조·데이터 계보");
rewrite(3, "Model signals stay separate from automated clinical routing.", "Individual routing and health signals stay outside employer views.");
rewrite(3, "이미지 신호와 자동 임상 경로 결정을 분리합니다.", "직원별 진료 경로와 건강 신호는 기업에 제공하지 않습니다.");

// Slide 4 - make program data quality and privacy visible.
rewrite(4, "Evidence begins with transparent definitions.", "Clear definitions make evidence credible.");
rewrite(4, "숫자보다 먼저, 데이터의 기준이 보여야 합니다.", "임직원 치과복지 성과는 명확한 데이터 기준에서 시작합니다.");
rewrite(4, "데이터 기준일·청구 지연", "데이터 기준일·청구 지연·완결성");
rewrite(4, "Not a performance claim—this demo makes data definitions and privacy visible.", "Not a performance claim - this demo shows access, data quality and privacy.");
rewrite(4, "성과가 아니라 데이터 기준과 프라이버시 설계를 보여주는 화면입니다.", "성과 주장이 아니라 접근성·데이터 품질·프라이버시 설계를 보여주는 화면입니다.");

// Slide 5 - explicit dental-claims economics.
rewrite(5, "No year-one savings promise.", "No year-one savings promise on dental claims.");
rewrite(5, "첫해 절감을 약속하지 않습니다.", "첫해 치아보험 청구비용 절감을 약속하지 않습니다.");

// Slide 6 - confirmed selections, with the actual collaboration context.
rewriteWhole(
  6,
  "Collaboration scoping and validation in progress\n협업 과제 발굴 및 검증 진행 중",
  "Dental-benefit collaboration validation in progress\n치아보험·임직원 복지 협업 과제 검증 중",
);

// Slide 7 - employer measurement question and specific validation request.
rewriteAndPosition(
  7,
  "CAN YOUR COMPANY PROVE\nHOW DENTAL INSURANCE IS USED?",
  "CAN YOUR COMPANY MEASURE\nHOW EMPLOYEES USE\nDENTAL INSURANCE & BENEFITS?",
  { left: 62, top: 146, width: 780, height: 150 },
);
rewriteAndPosition(
  7,
  "우리 회사의 치아보험 이용 현황을 데이터로 설명할 수 있나요?",
  "우리 회사는 임직원의 치아보험·치과복지 이용을\n데이터로 설명할 수 있나요?",
  { left: 66, top: 318, width: 720, height: 62 },
);
rewrite(7, "Let's validate a governed evidence pattern on Snowflake—together.", "Validate this program on Snowflake with one payer/TPA account team.");
rewrite(7, "Snowflake 기반의 데이터 협업 모델을 함께 검증합니다.", "Snowflake와 payer/TPA 계정 단위 데이터 협업을 검증합니다.");

setSlideNote(1, `패널과 부스의 공통 오프닝입니다. 미국의 임직원 치아보험과 치과복지 프로그램을 먼저 설명합니다. 치아보험 가입이 실제 이용을 자동으로 보장하지는 않으며, 직원은 네트워크, 예상 본인부담금, 실제 예약 가능성을 함께 이해해야 합니다. ICLO는 치아보험을 판매하거나 인수하는 회사가 아니라, 직원의 이용을 돕고 그 결과를 청구 데이터로 확인 가능한 집계 근거로 연결하려는 회사입니다.\n\n[Sources]\n- User-provided CEO and CMO email feedback, 2026-08-05\n- ICLO Snowflake external briefing source material\n- ICLO Option B-prime U.S. Access deck v3`);
setSlideNote(2, `미국 치아보험의 이용 장벽을 세 질문으로 설명합니다. 첫째, 내 플랜의 네트워크 안에 있는 치과는 어디인가. 둘째, 공제액, 본인부담률, 연간 한도를 고려하면 비용은 어떻게 달라지는가. 셋째, 실제 예약이 가능한가. 네트워크 밖 진료가 불가능하다고 단정하지 않고, 플랜과 네트워크 조건에 따라 선택이 제한되거나 직원 부담이 커질 수 있다고 설명합니다.\n\n[Sources]\n- ICLO Snowflake external briefing source material\n- ICLO Option B-prime U.S. Access deck v3`);
setSlideNote(3, `여기서 A안의 Snowflake 협업 모델로 전환합니다. 앞단은 임직원 치과복지 프로그램입니다. 직원이 치아보험 혜택을 이해하고, 네트워크 치과를 찾고, 본인이 요청한 예약 지원을 받습니다. Snowflake에서는 가입 자격, 플랜 조건, 앱 이용 기록, 치아보험 청구 데이터를 연결하고 품질 대조와 데이터 계보를 관리합니다. 원본 구강 이미지는 별도 통제 저장소에 두며, 직원별 진료 경로나 건강 신호는 기업에 제공하지 않습니다.\n\n[Sources]\n- ICLO Snowflake external briefing source material\n- ICLO Option A Snowflake Collaboration deck v3\n- ICLO Option B-prime U.S. Access deck v3`);
setSlideNote(4, `이 화면은 실제 성과가 아니라 임직원 치과복지 프로그램의 데이터 기준을 어떻게 보여줄지 설명하는 합성 데이터 데모입니다. 직원 수와 가입자 수의 기준, 가입 자격 기준일, 청구 반영 지연, 데이터 완결성, n≥20 셀 억제, 개인 PHI 미제공을 짚습니다. 부스에서는 QR로 데모를 열어 각 기준이 표시되는 위치를 보여줍니다.\n\n[Sources]\n- ICLO Employer Dashboard synthetic demo\n- ICLO Snowflake external briefing source material`);
setSlideNote(5, `첫해 치아보험 청구비용 절감을 약속하지 않는 이유를 설명합니다. 예방진료 이용과 미치료 상태의 발견이 늘면 첫해 보험자 지급액이 오를 수 있습니다. 허용액, 보험자 지급액, 직원 본인부담금을 분리하고, 근속기간과 청구 반영 지연을 고려해 1년차부터 3년차까지의 변화를 검증해야 합니다. 그래프는 가설이며 실제 ICLO 성과가 아닙니다.\n\n[Sources]\n- ICLO Snowflake external briefing source material\n- Illustrative J-curve; not an ICLO outcome`);
setSlideNote(6, `핀테크지원센터 Fintech Cube 9기와 Shinhan Future's Lab 12기는 이미 선정된 사실입니다. 현재는 치아보험과 임직원 복지 분야에서 금융사 협업 과제를 발굴하고 검증하는 단계입니다. 이 선정 이력이 치아보험 상품 제조, 자동 인수 또는 자동 심사 기능을 이미 제공한다는 의미는 아닙니다.\n\n[Sources]\n- User-provided confirmation: Fintech Cube Cohort 9 and Shinhan Future's Lab Cohort 12 selected\n- User-provided CEO email feedback, 2026-08-05`);
setSlideNote(7, `1차 청중은 국내 테크·금융 기업의 HR, 복지, 데이터 리더입니다. 미국 임직원 치아보험과 치과복지 도입을 검토할 잠재 고객이자 데이터 협업 파트너입니다. Snowflake에는 막연한 고객 소개가 아니라 아키텍처 논의와 실제 치과 가입 자격 또는 청구 데이터를 보유한 payer/TPA 계정팀 한 곳의 기술 검증을 요청합니다. Snowflake가 ICLO의 AI를 검증하거나 ICLO 전체를 자동으로 규제 준수 상태로 만들어 달라는 요청이 아님을 분명히 합니다.\n\n[Sources]\n- User-provided CEO and CMO email feedback, 2026-08-05\n- ICLO Snowflake external briefing source material`);

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.mkdir(RENDER_DIR, { recursive: true });
await fs.mkdir(LAYOUT_DIR, { recursive: true });

for (let index = 0; index < presentation.slides.count; index += 1) {
  const slide = presentation.slides.getItem(index);
  const n = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 2 });
  await fs.writeFile(path.join(RENDER_DIR, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await presentation.export({ slide, format: "layout" });
  await fs.writeFile(path.join(LAYOUT_DIR, `slide-${n}.layout.json`), new Uint8Array(await layout.arrayBuffer()));
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 0.8 });
await fs.writeFile(path.join(WORK, "final-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const finalInspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  include: "id,slide,text,textPreview,bbox,name,isPlaceholder,placeholders",
  maxChars: 1000000,
});
await fs.writeFile(path.join(WORK, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUTPUT);
console.log(JSON.stringify({ output: OUTPUT, slides: presentation.slides.count }, null, 2));
