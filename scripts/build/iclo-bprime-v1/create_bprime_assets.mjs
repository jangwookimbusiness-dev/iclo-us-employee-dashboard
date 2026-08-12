import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const TMP = path.join(ROOT, "tmp/iclo-bprime-v1");
const LOOP_PPTX = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-BPrime-US-Access-Bilingual-v3.pptx");
const WALL_PPTX = path.join(ROOT, "output/booth/bprime/ICLO-Snowflake-World-Tour-BPrime-Backwall-850x300mm-Bilingual-v3.pptx");
const WALL_PNG = path.join(ROOT, "output/booth/bprime/ICLO-Snowflake-World-Tour-BPrime-Backwall-850x300mm-Bilingual-v3.png");

const W = 1280;
const H = 720;
const FONT = "Noto Sans KR";
const C = {
  ink: "#12243A",
  ink2: "#263A50",
  muted: "#64717C",
  snow: "#29B5E8",
  teal: "#55C5C8",
  tealDark: "#147E84",
  pale: "#EAF8F9",
  bluePale: "#EAF7FC",
  paper: "#F5F7F6",
  line: "#D6DEDF",
  white: "#FFFFFF",
  rose: "#B24A56",
};

const HERO_PATH = path.join(ROOT, "output/imagegen/ICLO-World-Tour-BPrime-US-Access-Hero-v1.png");
const ICLO_PATH = path.join(ROOT, "output/booth/ICLO-Logo-Color-Transparent.png");
const SNOW_PATH = path.join(ROOT, "output/booth/assets/Snowflake-Corporate-Logo-Blue-Transparent-v3.png");
const DASH_PATH = path.join(ROOT, "tmp/iclo-snowflake-briefing-v1/assets/employer-dashboard-overview.png");
const QR_PATH = path.join(ROOT, "tmp/iclo-world-tour-v1/assets/demo-qr.png");
const SOURCE_GUIDE = "/Users/jk0307/Downloads/[스타트업 프로그램 코호트사용] 260827 Snowflake World Tour - Seoul - Startup Village Guide Deck (1).pdf";
const DASHBOARD_URL = "https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/";

function addText(slide, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: FONT,
    fontSize: options.fontSize ?? 20,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "left",
    italic: options.italic ?? false,
  };
  return shape;
}

function addBox(slide, position, options = {}) {
  const geometry = options.geometry ?? "rect";
  const spec = {
    geometry,
    position,
    fill: options.fill ?? C.white,
    line: { style: "solid", fill: options.line ?? "none", width: options.lineWidth ?? 0 },
  };
  if (geometry === "roundRect") spec.borderRadius = "rounded-sm";
  return slide.shapes.add(spec);
}

function addRule(slide, x, y, width, color = C.line, height = 1) {
  return addBox(slide, { left: x, top: y, width, height }, { fill: color, line: color });
}

function addImage(slide, blob, position, alt, fit = "cover") {
  return slide.images.add({ blob, contentType: "image/png", alt, fit, position, geometry: "rect" });
}

function addCoBrand(slide, iclo, snow, options = {}) {
  const left = options.left ?? 54;
  const top = options.top ?? 28;
  const icloW = options.icloW ?? 104;
  const snowW = options.snowW ?? 150;
  addImage(slide, iclo, { left, top: top + 21, width: icloW, height: icloW * 0.56 }, "ICLO logo", "contain");
  addText(slide, "×", { left: left + icloW + 9, top: top + 31, width: 24, height: 28 }, { fontSize: 17, bold: true, color: C.muted, alignment: "center" });
  addImage(slide, snow, { left: left + icloW + 40, top, width: snowW, height: snowW * 0.563 }, "Snowflake corporate logo supplied by the user", "contain");
}

function addFooter(slide, n, dark = false) {
  addRule(slide, 52, 680, 1176, dark ? "#365065" : C.line, 1);
  addText(slide, "ICLO · SNOWFLAKE WORLD TOUR SEOUL 2026 · B′ CONCEPT", { left: 52, top: 690, width: 540, height: 18 }, { fontSize: 10.5, color: dark ? "#B9C7D1" : C.muted });
  addText(slide, String(n).padStart(2, "0"), { left: 1176, top: 690, width: 52, height: 18 }, { fontSize: 10.5, color: dark ? "#B9C7D1" : C.muted, alignment: "right" });
}

function addHeader(slide, en, ko, n, iclo, snow, options = {}) {
  const dark = options.dark ?? false;
  slide.background.fill = dark ? C.ink : C.white;
  addText(slide, en, { left: 56, top: 50, width: 820, height: 76 }, { fontSize: 37, bold: true, color: dark ? C.white : C.ink });
  addText(slide, ko, { left: 58, top: 126, width: 800, height: 32 }, { fontSize: 18, color: dark ? "#C7D3DC" : C.muted });
  addCoBrand(slide, iclo, snow, { left: 925, top: 22, icloW: 76, snowW: 130 });
  addRule(slide, 56, 174, 1168, dark ? "#365065" : C.line, 1);
  addRule(slide, 56, 174, 112, C.snow, 4);
  addFooter(slide, n, dark);
}

function addNotes(slide, note, sources = []) {
  slide.speakerNotes.textFrame.setText(`${note}\n\n[Sources]\n${sources.map((s) => `- ${s}`).join("\n")}`);
  slide.speakerNotes.setVisible(true);
}

async function bytes(p) {
  const b = await fs.readFile(p);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

const hero = await bytes(HERO_PATH);
const iclo = await bytes(ICLO_PATH);
const snow = await bytes(SNOW_PATH);
const dashboard = await bytes(DASH_PATH);
const qr = await bytes(QR_PATH);

const loop = Presentation.create({ slideSize: { width: W, height: H } });

// 1. B-prime hero
{
  const slide = loop.slides.add();
  slide.background.fill = C.white;
  addImage(slide, hero, { left: 610, top: 0, width: 670, height: H }, "U.S. professional employee reviewing benefits information in a modern office");
  addBox(slide, { left: 0, top: 0, width: 700, height: H }, { fill: C.white });
  addBox(slide, { left: 0, top: 0, width: 12, height: H }, { fill: C.snow });
  addCoBrand(slide, iclo, snow, { left: 62, top: 28, icloW: 112, snowW: 165 });
  addText(slide, "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치과보험·직원 복지", { left: 62, top: 132, width: 590, height: 24 }, { fontSize: 12, bold: true, color: C.tealDark });
  addText(slide, "MAKE DENTAL INSURANCE\nAND BENEFITS\nMORE ACCESSIBLE.", { left: 58, top: 171, width: 600, height: 214 }, { fontSize: 44, bold: true });
  addText(slide, "미국의 치과보험과 복지 혜택을\n더 쉽게 이해하고 이용하도록.", { left: 62, top: 414, width: 570, height: 74 }, { fontSize: 22, bold: true, color: C.ink2 });
  addRule(slide, 62, 527, 100, C.snow, 5);
  addText(slide, "Employee navigation in front. Claims-verified evidence in back.", { left: 62, top: 558, width: 575, height: 30 }, { fontSize: 17, bold: true, color: C.ink2 });
  addText(slide, "앞에서는 직원 내비게이션, 뒤에서는 청구로 검증된 근거를 제공합니다.", { left: 62, top: 595, width: 575, height: 28 }, { fontSize: 15, color: C.muted });
  addText(slide, "NAVIGATION SUPPORT — NOT INSURANCE SALES OR UNDERWRITING", { left: 62, top: 640, width: 585, height: 20 }, { fontSize: 11.5, bold: true, color: C.tealDark });
  addText(slide, "보험 판매·인수가 아닌 직원 내비게이션 지원", { left: 62, top: 664, width: 585, height: 20 }, { fontSize: 11.5, color: C.muted });
  addNotes(slide, "B′의 첫 화면이다. 미국 치과보험 및 employee benefits의 접근성을 lead로 두고, ICLO의 employee navigation과 claims-verified evidence를 한 문장으로 연결한다. 보험 판매, 개별 인수, 자동 청구심사 또는 자동 임상 라우팅을 제안하지 않는다.", [SOURCE_GUIDE, HERO_PATH, SNOW_PATH]);
}

// 2. Coverage is not access
{
  const slide = loop.slides.add();
  addHeader(slide, "Coverage is not the same as access.", "보험 가입만으로 실제 이용이 쉬워지지는 않습니다.", 2, iclo, snow);
  const rows = [
    ["01", "FIND\n찾기", "In-network care", "내 plan에 맞는 네트워크 치과를 찾기"],
    ["02", "UNDERSTAND\n이해", "Deductible · coinsurance · annual maximum", "공제액·본인부담률·연간 한도를 이해하기"],
    ["03", "ACT\n실행", "Real availability and appointment preparation", "실제 예약 가능성과 방문 준비를 연결하기"],
  ];
  rows.forEach(([n, verb, en, ko], i) => {
    const top = 224 + i * 123;
    addText(slide, n, { left: 60, top, width: 70, height: 40 }, { fontSize: 30, bold: true, color: C.snow, alignment: "center" });
    addText(slide, verb, { left: 164, top: top - 2, width: 210, height: 52 }, { fontSize: 18, bold: true, color: C.tealDark });
    addText(slide, en, { left: 390, top: top + 1, width: 760, height: 34 }, { fontSize: 23, bold: true, color: C.ink2 });
    addText(slide, ko, { left: 390, top: top + 44, width: 760, height: 28 }, { fontSize: 16.5, color: C.muted });
    addRule(slide, 60, top + 88, 1160, C.line, 1);
  });
  addText(slide, "Provider choice may be constrained or economically penalized by network and plan rules.", { left: 60, top: 603, width: 1160, height: 26 }, { fontSize: 16.5, bold: true, color: C.rose, alignment: "center" });
  addText(slide, "Provider 선택은 네트워크와 plan 규칙에 따라 제한되거나 비용상 불리할 수 있습니다.", { left: 60, top: 632, width: 1160, height: 24 }, { fontSize: 14.5, color: C.muted, alignment: "center" });
  addNotes(slide, "미국 치과보험 friction을 find, understand, act 세 동사로 설명한다. 네트워크 밖 진료가 절대 불가능하다고 말하지 않고, plan/network rules에 따라 선택이 제한되거나 경제적 불이익이 생길 수 있다고 표현한다.", ["User-provided ICLO Snowflake external briefing source material"]);
}

// 3. Employee action
{
  const slide = loop.slides.add();
  addHeader(slide, "Turn benefits into employee action.", "혜택 정보가 실제 예방진료와 적절한 in-network care로 이어지게 합니다.", 3, iclo, snow);
  const steps = [
    ["1", "UNDERSTAND / 이해", "Eligibility · coverage rules · OOP context", "자격·보장 규칙·예상 부담"],
    ["2", "NAVIGATE / 탐색", "Network and provider context", "네트워크·provider 정보"],
    ["3", "PREPARE / 준비", "Employee-requested appointment support", "직원이 요청한 예약·방문 준비"],
  ];
  steps.forEach(([n, title, en, ko], i) => {
    const left = 62 + i * 401;
    addText(slide, n, { left, top: 228, width: 56, height: 58 }, { fontSize: 44, bold: true, color: C.snow, alignment: "center" });
    addText(slide, title, { left: left + 75, top: 235, width: 270, height: 34 }, { fontSize: 20, bold: true });
    addRule(slide, left, 309, 340, i === 1 ? C.teal : C.line, i === 1 ? 4 : 2);
    addText(slide, en, { left, top: 344, width: 340, height: 74 }, { fontSize: 20, bold: true, color: C.ink2 });
    addText(slide, ko, { left, top: 438, width: 340, height: 52 }, { fontSize: 16.5, color: C.muted });
  });
  addBox(slide, { left: 62, top: 548, width: 1148, height: 77 }, { fill: C.pale, line: C.teal, lineWidth: 1 });
  addText(slide, "PRODUCT REDLINE", { left: 84, top: 560, width: 190, height: 22 }, { fontSize: 14, bold: true, color: C.tealDark });
  addText(slide, "제품 원칙", { left: 84, top: 591, width: 190, height: 22 }, { fontSize: 14, color: C.tealDark });
  addText(slide, "Image-derived signals remain separate from automated provider, urgency or treatment routing.", { left: 290, top: 560, width: 880, height: 28 }, { fontSize: 17.5, bold: true, color: C.ink2 });
  addText(slide, "이미지 기반 신호는 provider·긴급도·치료 경로 자동 결정과 분리합니다.", { left: 290, top: 596, width: 880, height: 22 }, { fontSize: 14.5, color: C.muted });
  addNotes(slide, "B′는 소비자 진단 앱이 아니라 employee-initiated navigation이다. 초기에는 직원 action 또는 human-assisted support를 포함하며 image-derived signal은 provider, urgency, treatment pathway를 자동 결정하지 않는다.", ["User-provided ICLO Snowflake external briefing source material"]);
}

// 4. Snowflake evidence plane
{
  const slide = loop.slides.add();
  addHeader(slide, "Connect access to claims-verified evidence.", "개인 건강신호를 employer에게 노출하지 않고 이용 여정을 집계 근거로 연결합니다.", 4, iclo, snow);
  addText(slide, "EMPLOYEE + PLAN CONTEXT / 직원 + 플랜 맥락", { left: 60, top: 212, width: 350, height: 24 }, { fontSize: 12.5, bold: true, color: C.tealDark });
  addText(slide, "SNOWFLAKE GOVERNED EVIDENCE / 관리형 증거", { left: 445, top: 212, width: 400, height: 24 }, { fontSize: 12.5, bold: true, color: C.snow, alignment: "center" });
  addText(slide, "EMPLOYER VIEW / 기업 뷰", { left: 890, top: 212, width: 330, height: 24 }, { fontSize: 12.5, bold: true, color: C.tealDark, alignment: "right" });
  addText(slide, "→", { left: 390, top: 331, width: 60, height: 46 }, { fontSize: 34, bold: true, color: C.tealDark, alignment: "center" });
  addText(slide, "→", { left: 830, top: 331, width: 60, height: 46 }, { fontSize: 34, bold: true, color: C.tealDark, alignment: "center" });
  addBox(slide, { left: 60, top: 251, width: 330, height: 246 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  ["Eligibility + plan rules", "Provider + network context", "Employee app events", "TPA / carrier claims"].forEach((line, i) => {
    addText(slide, line, { left: 82, top: 274 + i * 35, width: 286, height: 24 }, { fontSize: 16, bold: true, color: C.ink2 });
  });
  addRule(slide, 82, 421, 82, C.teal, 3);
  addText(slide, "자격·플랜·네트워크·앱 이벤트·TPA/보험사 청구", { left: 82, top: 438, width: 286, height: 42 }, { fontSize: 13.5, color: C.muted });
  addBox(slide, { left: 450, top: 251, width: 380, height: 246 }, { fill: C.ink, line: C.ink });
  addImage(slide, snow, { left: 548, top: 266, width: 184, height: 104 }, "Snowflake corporate logo inside the evidence plane", "contain");
  addText(slide, "Purpose-based access\nQuality + reconciliation\nLineage + aggregate views", { left: 478, top: 374, width: 324, height: 76 }, { fontSize: 15.5, bold: true, color: C.white, alignment: "center" });
  addText(slide, "목적별 접근·품질 대조·계보·집계 뷰", { left: 478, top: 457, width: 324, height: 24 }, { fontSize: 13, color: "#BFD1DD", alignment: "center" });
  addBox(slide, { left: 890, top: 251, width: 330, height: 246 }, { fill: C.bluePale, line: C.snow, lineWidth: 1 });
  ["Claims-confirmed use", "Allowed · paid · OOP", "Freshness · lag · completeness", "Aggregate only · no PHI"].forEach((line, i) => {
    addText(slide, line, { left: 912, top: 274 + i * 35, width: 288, height: 24 }, { fontSize: 16, bold: true, color: C.ink2 });
  });
  addRule(slide, 912, 421, 82, C.snow, 3);
  addText(slide, "청구 확인·비용 구분·최신성·집계 전용", { left: 912, top: 438, width: 288, height: 42 }, { fontSize: 13.5, color: C.muted });
  addRule(slide, 60, 532, 1160, C.line, 1);
  addBox(slide, { left: 60, top: 548, width: 500, height: 72 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  addText(slide, "RAW ORAL IMAGES", { left: 82, top: 560, width: 200, height: 20 }, { fontSize: 12.5, bold: true, color: C.rose });
  addText(slide, "Controlled U.S. storage / 미국 내 통제 저장", { left: 82, top: 588, width: 450, height: 22 }, { fontSize: 14.5, bold: true, color: C.ink2 });
  addText(slide, "→", { left: 592, top: 563, width: 76, height: 40 }, { fontSize: 28, bold: true, color: C.tealDark, alignment: "center" });
  addBox(slide, { left: 700, top: 548, width: 520, height: 72 }, { fill: C.bluePale, line: C.snow, lineWidth: 1 });
  addText(slide, "SNOWFLAKE", { left: 722, top: 560, width: 160, height: 20 }, { fontSize: 12.5, bold: true, color: C.tealDark });
  addText(slide, "Authorized structured data + approved signals only", { left: 722, top: 588, width: 470, height: 22 }, { fontSize: 14.5, bold: true, color: C.ink2 });
  addText(slide, "Individual routing and health signals stay outside employer views.", { left: 60, top: 636, width: 570, height: 20 }, { fontSize: 13, bold: true, color: C.ink2 });
  addText(slide, "개인 라우팅·건강 신호는 employer 뷰에 노출하지 않습니다.", { left: 650, top: 636, width: 570, height: 20 }, { fontSize: 13, color: C.muted, alignment: "right" });
  addNotes(slide, "Snowflake를 employee app과 claims를 이어주는 governed evidence plane으로 설명한다. employer에게는 aggregate output만 제공하고 개인 routing/health signal은 제공하지 않는다. Raw oral image는 controlled U.S. object storage 또는 PHI vault에 두며, Snowflake에는 승인된 structured data와 metadata만 저장한다.", ["User-provided ICLO Snowflake external briefing source material", SNOW_PATH]);
}

// 5. Dashboard proof
{
  const slide = loop.slides.add();
  addHeader(slide, "Measure access—not individual employees.", "분모·최신성·완결성·프라이버시가 보이는 aggregate evidence입니다.", 5, iclo, snow);
  addBox(slide, { left: 54, top: 288, width: 1172, height: 350 }, { fill: C.white, line: C.line, lineWidth: 1 });
  addImage(slide, dashboard, { left: 66, top: 300, width: 1148, height: 326 }, "ICLO employer dashboard using synthetic data", "contain");
  const notes = [
    ["SYNTHETIC SAMPLE", "합성 데이터·예시용"],
    ["EMPLOYEE / MEMBER LENS", "직원·가입자 기준"],
    ["FRESHNESS + CLAIMS LAG", "기준일·청구 지연·완결성"],
    ["AGGREGATE · n≥20 · NO PHI", "집계 전용·개인 PHI 없음"],
  ];
  notes.forEach(([head, body], i) => {
    const left = 58 + i * 292;
    addRule(slide, left, 207, 7, C.snow, 57);
    addText(slide, head, { left: left + 20, top: 205, width: 255, height: 24 }, { fontSize: 13.5, bold: true, color: C.tealDark });
    addText(slide, body, { left: left + 20, top: 237, width: 255, height: 22 }, { fontSize: 13.5, color: C.ink2 });
  });
  addText(slide, "Not a performance claim—this demo makes access, data quality and privacy visible.", { left: 58, top: 648, width: 680, height: 22 }, { fontSize: 12.5, bold: true, color: C.rose });
  addText(slide, "성과가 아닌 접근성·데이터 품질·프라이버시 설계 예시입니다.", { left: 748, top: 648, width: 474, height: 22 }, { fontSize: 12.5, color: C.muted, alignment: "right" });
  addNotes(slide, "Dashboard는 synthetic data를 이용한 visual proof다. 성과 주장이 아니라 employees/members lens, eligibility/claims 기준일, claims lag, completeness, aggregate-only, n≥20 suppression을 구매자에게 보여주는 방식의 데모다.", [DASHBOARD_URL, DASH_PATH]);
}

// 6. CTA
{
  const slide = loop.slides.add();
  slide.background.fill = C.ink;
  addBox(slide, { left: 0, top: 0, width: 12, height: H }, { fill: C.snow });
  addBox(slide, { left: 62, top: 30, width: 360, height: 94 }, { fill: C.white, line: C.white });
  addCoBrand(slide, iclo, snow, { left: 78, top: 32, icloW: 98, snowW: 146 });
  addText(slide, "CAN YOUR COMPANY MAKE\nDENTAL BENEFITS EASIER TO ACCESS?", { left: 62, top: 168, width: 760, height: 132 }, { fontSize: 39, bold: true, color: C.white });
  addText(slide, "미국의 치과보험과 복지 혜택을 더 쉽게 만들 준비가 되어 있나요?", { left: 66, top: 329, width: 730, height: 52 }, { fontSize: 21, bold: true, color: "#D6E0E7" });
  addRule(slide, 66, 432, 106, C.snow, 5);
  addText(slide, "Looking for U.S. employer-benefits, payer/TPA, HR and data teams.", { left: 66, top: 456, width: 720, height: 40 }, { fontSize: 19, bold: true, color: C.white });
  addText(slide, "미국 employer benefits, payer/TPA, HR 및 data 팀과의 협업을 찾습니다.", { left: 66, top: 504, width: 720, height: 28 }, { fontSize: 15.5, color: "#B9C7D1" });
  addText(slide, "Let’s validate a governed eligibility + plan + claims collaboration pattern on Snowflake.", { left: 66, top: 554, width: 720, height: 40 }, { fontSize: 16.5, bold: true, color: C.white });
  addText(slide, "Snowflake에서 자격·플랜·청구를 연결하는 관리형 협업 패턴을 검증합니다.", { left: 66, top: 601, width: 720, height: 28 }, { fontSize: 14.5, color: "#B9C7D1" });
  addText(slide, "Synthetic demo · aggregate only · no individual PHI / 합성 데이터 · 집계 전용", { left: 66, top: 642, width: 720, height: 24 }, { fontSize: 13, bold: true, color: C.snow });
  addBox(slide, { left: 900, top: 128, width: 286, height: 286 }, { fill: C.white, line: C.white });
  addImage(slide, qr, { left: 914, top: 142, width: 258, height: 258 }, "QR code to the synthetic ICLO employer dashboard", "contain");
  addText(slide, "LIVE SYNTHETIC DEMO / 합성 데이터 데모", { left: 860, top: 88, width: 366, height: 24 }, { fontSize: 12, bold: true, color: C.snow, alignment: "center" });
  addText(slide, "SCAN TO OPEN / 스캔하여 열기", { left: 880, top: 445, width: 326, height: 28 }, { fontSize: 12.5, bold: true, color: C.white, alignment: "center" });
  addText(slide, "SYNTHETIC EMPLOYER DASHBOARD", { left: 860, top: 500, width: 366, height: 22 }, { fontSize: 12.5, bold: true, color: C.snow, alignment: "center" });
  addText(slide, "합성 데이터 기반 기업 대시보드", { left: 860, top: 529, width: 366, height: 22 }, { fontSize: 12.5, color: "#B9C7D1", alignment: "center" });
  addText(slide, "NAVIGATION SUPPORT — NOT INSURANCE SALES", { left: 840, top: 594, width: 406, height: 24 }, { fontSize: 11.5, bold: true, color: C.snow, alignment: "center" });
  addText(slide, "직원 내비게이션 — 보험 판매 모델 아님", { left: 850, top: 626, width: 386, height: 22 }, { fontSize: 12, color: "#B9C7D1", alignment: "center" });
  addFooter(slide, 6, true);
  addNotes(slide, "부스 대화의 CTA다. U.S. employer-benefits, payer/TPA, HR, data team과 eligibility, plan, claims를 연결하는 working session을 요청한다. Snowflake 고객 소개를 막연히 요청하지 않고 governed data-collaboration pattern의 account-level validation을 요청한다.", [SOURCE_GUIDE, DASHBOARD_URL]);
}

await fs.mkdir(path.dirname(LOOP_PPTX), { recursive: true });
await fs.mkdir(path.dirname(WALL_PPTX), { recursive: true });
await fs.mkdir(path.join(TMP, "rendered"), { recursive: true });
for (const [index, slide] of loop.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await loop.export({ slide, format: "png", scale: 2 });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.layout.json`), await layout.text());
}
const montage = await loop.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(TMP, "rendered", "bprime-loop-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const inspect = await loop.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 40000 });
await fs.writeFile(path.join(TMP, "rendered", "bprime-loop-inspect.txt"), inspect.ndjson);
const loopFile = await PresentationFile.exportPptx(loop);
await loopFile.save(LOOP_PPTX);

// 850 x 300 mm backwall at 96dpi-equivalent page geometry.
const BW = 3213;
const BH = 1134;
const wall = Presentation.create({ slideSize: { width: BW, height: BH } });
{
  const slide = wall.slides.add();
  slide.background.fill = C.white;
  addImage(slide, hero, { left: 1700, top: 1, width: 1512, height: BH - 2 }, "U.S. employee reviewing benefits in a contemporary office");
  addBox(slide, { left: 0, top: 0, width: 1885, height: BH }, { fill: C.white });
  addBox(slide, { left: 0, top: 0, width: 34, height: BH }, { fill: C.snow });
  addCoBrand(slide, iclo, snow, { left: 140, top: 48, icloW: 300, snowW: 430 });
  addText(slide, "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치과보험·직원 복지", { left: 140, top: 260, width: 1600, height: 52 }, { fontSize: 28, bold: true, color: C.tealDark });
  addText(slide, "MAKE DENTAL INSURANCE\nAND BENEFITS\nMORE ACCESSIBLE.", { left: 126, top: 338, width: 1600, height: 396 }, { fontSize: 89, bold: true, color: C.ink });
  addText(slide, "미국의 치과보험과 복지 혜택을\n더 쉽게 이해하고 이용하도록.", { left: 140, top: 748, width: 1500, height: 116 }, { fontSize: 43, bold: true, color: C.ink2 });
  addRule(slide, 140, 893, 260, C.snow, 12);
  addText(slide, "Employee navigation in front · Claims-verified aggregate evidence in back", { left: 140, top: 928, width: 1500, height: 48 }, { fontSize: 27, bold: true, color: C.tealDark });
  addText(slide, "앞에서는 직원 내비게이션 · 뒤에서는 청구로 검증된 기업 집계 근거", { left: 140, top: 985, width: 1500, height: 46 }, { fontSize: 25, color: C.ink2 });
  addText(slide, "ICLO @ Snowflake World Tour Seoul 2026", { left: 140, top: 1048, width: 1500, height: 36 }, { fontSize: 21, color: C.muted });
}
const wallSlide = wall.slides.items[0];
const wallPng = await wall.export({ slide: wallSlide, format: "png", scale: 2 });
await fs.writeFile(WALL_PNG, new Uint8Array(await wallPng.arrayBuffer()));
const wallLayout = await wallSlide.export({ format: "layout" });
await fs.writeFile(path.join(TMP, "rendered", "bprime-backwall.layout.json"), await wallLayout.text());
const wallFile = await PresentationFile.exportPptx(wall);
await wallFile.save(WALL_PPTX);

console.log(`Created ${LOOP_PPTX}`);
console.log(`Created ${WALL_PPTX}`);
console.log(`Created ${WALL_PNG}`);
