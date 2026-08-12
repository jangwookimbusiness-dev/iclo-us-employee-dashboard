import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const TMP = path.join(ROOT, "tmp/iclo-world-tour-v1");
const LOOP_PPTX = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Option-A-Collaboration-Bilingual-v3.pptx");
const WALL_PPTX = path.join(ROOT, "output/booth/option-a/ICLO-Snowflake-World-Tour-Option-A-Backwall-850x300mm-Bilingual-v3.pptx");
const WALL_PNG = path.join(ROOT, "output/booth/option-a/ICLO-Snowflake-World-Tour-Option-A-Backwall-850x300mm-Bilingual-v3.png");

const W = 1280;
const H = 720;
const C = {
  ink: "#12243A",
  ink2: "#24364C",
  muted: "#5E6A75",
  teal: "#55C5C8",
  tealDark: "#167D82",
  tealPale: "#E8F7F7",
  snow: "#29B5E8",
  paper: "#F5F7F6",
  line: "#D7DEDF",
  white: "#FFFFFF",
  black: "#0A1117",
  warning: "#D7922C",
};
const FONT = "Noto Sans KR";

const ASSET = (name) => path.join(TMP, "assets", name);
const SOURCE_GUIDE = "/Users/jk0307/Downloads/[스타트업 프로그램 코호트사용] 260827 Snowflake World Tour - Seoul - Startup Village Guide Deck (1).pdf";
const DASHBOARD_URL = "https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/";
const SNOWFLAKE_LOCKUP = path.join(ROOT, "output/booth/assets/Snowflake-Corporate-Logo-Blue-Transparent-v3.png");

function addText(slide, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: options.fontFamily ?? FONT,
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
    line: {
      style: options.lineStyle ?? "solid",
      fill: options.line ?? "none",
      width: options.lineWidth ?? 0,
    },
  };
  if (geometry === "roundRect") spec.borderRadius = options.borderRadius ?? "rounded-sm";
  return slide.shapes.add(spec);
}

function addRule(slide, x, y, width, color = C.line, height = 1) {
  return addBox(slide, { left: x, top: y, width, height }, { fill: color, line: color });
}

function addImage(slide, blob, position, alt, options = {}) {
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt,
    fit: options.fit ?? "cover",
    position,
    geometry: options.geometry ?? "rect",
  });
}

function connect(slide, from, to, options = {}) {
  return slide.shapes.connect(from, to, {
    kind: "straight",
    fromSide: options.fromSide ?? "right",
    toSide: options.toSide ?? "left",
    line: { style: options.dashed ? "dashed" : "solid", fill: options.color ?? C.tealDark, width: options.width ?? 3 },
    head: options.arrow === false ? { type: "none" } : { type: "arrow", width: "med", length: "med" },
  });
}

function addBrand(slide, logo, options = {}) {
  const left = options.left ?? 48;
  const top = options.top ?? 34;
  const width = options.width ?? 120;
  addImage(slide, logo, { left, top, width, height: width * 0.365 }, "ICLO logo", { fit: "contain" });
}

function addCoBrand(slide, logo, snowflake, options = {}) {
  const left = options.left ?? 48;
  const top = options.top ?? 30;
  const icloWidth = options.icloWidth ?? 104;
  const snowWidth = options.snowWidth ?? 205;
  addBrand(slide, logo, { left, top: top + 20, width: icloWidth });
  addText(slide, "×", { left: left + icloWidth + 10, top: top + 29, width: 28, height: 32 }, {
    fontSize: 19, bold: true, color: options.dark ? C.white : C.muted, alignment: "center",
  });
  addImage(slide, snowflake, { left: left + icloWidth + 48, top, width: snowWidth, height: snowWidth * 0.563 }, "Snowflake corporate logo supplied by the user", { fit: "contain" });
}

function addFooter(slide, number, dark = false) {
  addRule(slide, 48, 681, 1184, dark ? "#314358" : C.line, 1);
  addText(slide, "ICLO · SNOWFLAKE WORLD TOUR SEOUL 2026", { left: 48, top: 690, width: 420, height: 18 }, {
    fontSize: 10.5, color: dark ? "#B7C4D0" : C.muted,
  });
  addText(slide, String(number).padStart(2, "0"), { left: 1180, top: 690, width: 52, height: 18 }, {
    fontSize: 10.5, color: dark ? "#B7C4D0" : C.muted, alignment: "right",
  });
}

function addTitle(slide, ko, en, number, dark = false) {
  addText(slide, en, { left: 56, top: 62, width: 835, height: 58 }, {
    fontSize: 36, bold: true, color: dark ? C.white : C.ink,
  });
  addText(slide, ko, { left: 58, top: 124, width: 835, height: 30 }, {
    fontSize: 18, color: dark ? "#C9D5DF" : C.muted,
  });
  addRule(slide, 56, 171, 1168, dark ? "#314358" : C.line, 1);
  addRule(slide, 56, 171, 108, C.teal, 4);
  addFooter(slide, number, dark);
}

function addNotes(slide, note, sources = []) {
  const sourceText = sources.map((s) => `- ${s}`).join("\n");
  slide.speakerNotes.textFrame.setText(`${note}\n\n[Sources]\n${sourceText}`);
  slide.speakerNotes.setVisible(true);
}

async function bytes(imagePath) {
  const b = await fs.readFile(imagePath);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

const hero = await bytes(ASSET("hero-employee.png"));
const collaboration = await bytes(ASSET("collaboration-team-crop.png"));
const logo = await bytes(ASSET("iclo-logo-tight.png"));
const snowflake = await bytes(SNOWFLAKE_LOCKUP);
const dashboard = await bytes(ASSET("employer-dashboard-overview.png"));
const qr = await bytes(ASSET("demo-qr.png"));

const loop = Presentation.create({ slideSize: { width: W, height: H } });
const content = [];

// 1. Hero
{
  const slide = loop.slides.add();
  slide.background.fill = C.paper;
  addImage(slide, hero, { left: 0, top: 0, width: W, height: H }, "Korean employee using a smartphone in a Seoul office");
  addBox(slide, { left: 0, top: 0, width: 720, height: H }, { fill: C.white });
  addBox(slide, { left: 0, top: 0, width: 12, height: H }, { fill: C.teal });
  addCoBrand(slide, logo, snowflake, { left: 62, top: 30, icloWidth: 118, snowWidth: 168 });
  addText(slide, "EMPLOYEE DENTAL BENEFITS / 직원 치과 복지", { left: 64, top: 145, width: 500, height: 22 }, {
    fontSize: 12, bold: true, color: C.tealDark,
  });
  addText(slide, "MAKE DENTAL BENEFITS\nEASIER TO USE.", { left: 58, top: 178, width: 610, height: 150 }, {
    fontSize: 49, bold: true, color: C.ink,
  });
  addText(slide, "직원이 치과 혜택을 더 쉽게 이해하고 이용하도록.", { left: 62, top: 360, width: 590, height: 42 }, {
    fontSize: 22, bold: true, color: C.ink2,
  });
  addRule(slide, 62, 438, 88, C.teal, 4);
  addText(slide, "Employees navigate care. Employers see claims-verified, aggregate evidence.", { left: 62, top: 470, width: 600, height: 44 }, {
    fontSize: 17, bold: true, color: C.ink2,
  });
  addText(slide, "직원은 진료를 탐색하고, 회사는 청구로 확인된 집계 근거를 봅니다.", { left: 62, top: 520, width: 600, height: 44 }, {
    fontSize: 16, color: C.muted,
  });
  addText(slide, "Employee navigation · Claims-verified evidence / 직원 내비게이션 · 청구 검증 근거", { left: 62, top: 628, width: 600, height: 28 }, {
    fontSize: 12.5, bold: true, color: C.tealDark,
  });
  const note = "부스 첫 5초 화면. ICLO를 치아 사진 AI가 아니라 employee dental-benefit navigation과 claims-verified aggregate evidence로 소개한다. 실사 이미지는 생성형 이미지이지만 텍스트·로고·UI는 이미지 안에 합성하지 않고 편집 가능한 레이어로 분리했다.";
  addNotes(slide, note, [SOURCE_GUIDE, "User-provided ICLO positioning", ASSET("hero-employee.png")]);
  content.push({ slide: 1, ko: "직원이 치과 혜택을 제대로 누리도록.", en: "Make dental benefits easier to use." });
}

// 2. Navigation problem
{
  const slide = loop.slides.add();
  slide.background.fill = C.paper;
  addCoBrand(slide, logo, snowflake, { left: 903, top: 30, icloWidth: 92, snowWidth: 196 });
  addTitle(slide, "보험이 있어도, 이용은 여전히 어렵습니다.", "Coverage does not solve navigation.", 2);
  const columns = [
    { x: 58, en: "WHERE TO GO?", ko: "어디로 갈까?", bodyEn: "IN-NETWORK CARE", bodyKo: "내 플랜에 맞는 네트워크 치과" },
    { x: 443, en: "HOW MUCH?", ko: "얼마가 들까?", bodyEn: "OOP · DEDUCTIBLE · MAX", bodyKo: "본인부담·공제액·연간 한도" },
    { x: 828, en: "WHEN?", ko: "언제 갈 수 있을까?", bodyEn: "REAL AVAILABILITY", bodyKo: "디렉터리가 아닌 실제 예약 가능성" },
  ];
  columns.forEach((c, i) => {
    if (i > 0) addRule(slide, c.x - 35, 230, 1, C.line, 284);
    addText(slide, c.en, { left: c.x, top: 250, width: 330, height: 52 }, { fontSize: 32, bold: true, color: C.ink });
    addText(slide, c.ko, { left: c.x, top: 313, width: 330, height: 34 }, { fontSize: 18, bold: true, color: C.muted });
    addText(slide, c.bodyEn, { left: c.x, top: 383, width: 330, height: 30 }, { fontSize: 19, bold: true, color: C.tealDark });
    addText(slide, c.bodyKo, { left: c.x, top: 430, width: 330, height: 48 }, { fontSize: 16, color: C.ink2 });
  });
  addRule(slide, 58, 542, 1164, C.teal, 4);
  addText(slide, "Employees rarely see all three in one place.", { left: 58, top: 572, width: 760, height: 34 }, { fontSize: 22, bold: true });
  addText(slide, "직원은 이 세 가지를 한 번에 확인하기 어렵습니다.", { left: 58, top: 615, width: 720, height: 26 }, { fontSize: 16, color: C.muted });
  addNotes(slide, "Snowflake 고객사 임직원이 즉시 공감할 수 있도록 미국 치과보험 friction을 network, cost sharing, real availability의 세 질문으로 압축한다. Provider choice는 plan/network rules에 따라 제한되거나 경제적으로 불리해질 수 있다는 수준으로만 설명한다.", ["ICLO Snowflake external briefing source material"]);
  content.push({ slide: 2, ko: "보험이 있어도, 이용은 여전히 어렵습니다.", en: "Coverage does not solve navigation." });
}

// 3. Product and evidence architecture
{
  const slide = loop.slides.add();
  slide.background.fill = C.white;
  addCoBrand(slide, logo, snowflake, { left: 903, top: 30, icloWidth: 92, snowWidth: 196 });
  addTitle(slide, "앞에서는 내비게이션. 뒤에서는 증거.", "Navigation in front. Evidence in back.", 3);
  const left = addBox(slide, { left: 58, top: 238, width: 310, height: 220 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  const middle = addBox(slide, { left: 485, top: 218, width: 310, height: 260 }, { fill: C.ink, line: C.ink, lineWidth: 1 });
  const right = addBox(slide, { left: 912, top: 238, width: 310, height: 220 }, { fill: C.tealPale, line: C.teal, lineWidth: 1 });
  connect(slide, left, middle, { arrow: false, color: C.tealDark, width: 3 });
  connect(slide, middle, right, { arrow: false, color: C.tealDark, width: 3 });
  addText(slide, "→", { left: 386, top: 314, width: 78, height: 48 }, { fontSize: 34, bold: true, color: C.tealDark, alignment: "center" });
  addText(slide, "→", { left: 813, top: 314, width: 78, height: 48 }, { fontSize: 34, bold: true, color: C.tealDark, alignment: "center" });

  addText(slide, "Employee experience", { left: 82, top: 260, width: 260, height: 30 }, { fontSize: 21, bold: true });
  addText(slide, "직원 경험", { left: 82, top: 300, width: 260, height: 24 }, { fontSize: 16, color: C.muted });
  addText(slide, "Benefit understanding\n혜택 이해\nNetwork context\n네트워크 맥락\nRequested support\n직원 요청 지원", { left: 82, top: 338, width: 260, height: 112 }, { fontSize: 14.5, bold: true, color: C.ink2 });

  addText(slide, "Snowflake", { left: 513, top: 243, width: 254, height: 34 }, { fontSize: 26, bold: true, color: C.white, alignment: "center" });
  addText(slide, "Governed evidence plane", { left: 513, top: 284, width: 254, height: 24 }, { fontSize: 16, color: "#BFD1DD", alignment: "center" });
  addText(slide, "관리형 증거 레이어", { left: 513, top: 310, width: 254, height: 22 }, { fontSize: 14, color: "#BFD1DD", alignment: "center" });
  addRule(slide, 535, 335, 210, C.snow, 4);
  addText(slide, "ELIGIBILITY + PLAN\n자격·플랜\nAPP EVENTS + CLAIMS\n앱 이벤트·청구", { left: 510, top: 362, width: 260, height: 82 }, { fontSize: 14.5, bold: true, color: C.white, alignment: "center" });

  addText(slide, "Employer evidence", { left: 936, top: 260, width: 260, height: 30 }, { fontSize: 21, bold: true });
  addText(slide, "기업 집계 근거", { left: 936, top: 299, width: 260, height: 24 }, { fontSize: 16, color: C.tealDark });
  addText(slide, "Claims-confirmed use\n청구로 확인된 이용\nAllowed · paid · OOP\n비용 주체별 구분\nAggregate employer view\n기업 집계 전용", { left: 936, top: 338, width: 260, height: 112 }, { fontSize: 14.5, bold: true, color: C.ink2 });

  addRule(slide, 58, 523, 1164, C.line, 1);
  addText(slide, "RAW ORAL IMAGES", { left: 58, top: 542, width: 220, height: 22 }, { fontSize: 13, bold: true, color: C.rose });
  addText(slide, "원본 구강 이미지는 통제된 미국 내 저장소에 보관", { left: 58, top: 570, width: 490, height: 24 }, { fontSize: 14.5, color: C.muted });
  addText(slide, "SNOWFLAKE", { left: 682, top: 542, width: 180, height: 22 }, { fontSize: 13, bold: true, color: C.tealDark });
  addText(slide, "Authorized structured data + approved signals only", { left: 682, top: 570, width: 540, height: 22 }, { fontSize: 14.5, bold: true, color: C.ink2 });
  addText(slide, "승인된 구조화 데이터와 신호만 저장", { left: 682, top: 597, width: 540, height: 22 }, { fontSize: 14, color: C.muted });
  addText(slide, "Model signals stay separate from automated clinical routing.", { left: 58, top: 624, width: 1164, height: 22 }, { fontSize: 14, bold: true, color: C.ink2, alignment: "center" });
  addText(slide, "이미지 신호는 자동 임상 라우팅과 분리합니다.", { left: 58, top: 649, width: 1164, height: 20 }, { fontSize: 13.5, color: C.muted, alignment: "center" });
  addNotes(slide, "Employee app events, eligibility, plan/provider context와 claims를 Snowflake governed evidence plane에서 연결하되 raw oral image는 별도 U.S. object storage/PHI vault 경로에 둔다. 모델 신호와 예약/임상 routing을 시스템적으로 분리하고 employer에는 개인 신호를 제공하지 않는다.", ["ICLO Snowflake external briefing addendum v1"]);
  content.push({ slide: 3, ko: "앞에서는 내비게이션. 뒤에서는 증거.", en: "Navigation in front. Evidence in back." });
}

// 4. Dashboard proof
{
  const slide = loop.slides.add();
  slide.background.fill = C.paper;
  addCoBrand(slide, logo, snowflake, { left: 903, top: 30, icloWidth: 92, snowWidth: 196 });
  addTitle(slide, "증거는 숫자보다 먼저, 정의가 보여야 합니다.", "Evidence begins with transparent definitions.", 4);
  addBox(slide, { left: 54, top: 294, width: 1172, height: 344 }, { fill: C.white, line: C.line, lineWidth: 1 });
  addImage(slide, dashboard, { left: 66, top: 306, width: 1148, height: 320 }, "ICLO employer dashboard with synthetic data", { fit: "contain" });
  const callouts = [
    ["SYNTHETIC SAMPLE", "합성 데이터·예시용"],
    ["EMPLOYEE / MEMBER LENS", "직원·가입자 기준"],
    ["FRESHNESS + CLAIMS LAG", "기준일·청구 지연"],
    ["AGGREGATE · n≥20 · NO PHI", "집계 전용·개인 PHI 없음"],
  ];
  callouts.forEach(([en, ko], i) => {
    const left = 58 + i * 292;
    addRule(slide, left, 210, 7, C.teal, 57);
    addText(slide, en, { left: left + 20, top: 208, width: 255, height: 24 }, { fontSize: 13.5, bold: true, color: C.tealDark });
    addText(slide, ko, { left: left + 20, top: 240, width: 255, height: 22 }, { fontSize: 13.5, color: C.ink2 });
  });
  addText(slide, "Not a performance claim—this demo makes data definitions and privacy visible.", { left: 58, top: 648, width: 650, height: 22 }, { fontSize: 12.5, bold: true, color: C.rose });
  addText(slide, "성과가 아닌 데이터 기준과 프라이버시 설계 예시입니다.", { left: 730, top: 648, width: 492, height: 22 }, { fontSize: 12.5, color: C.muted, alignment: "right" });
  addNotes(slide, "실제 성과가 아니라 synthetic sample이다. 현장 설명 시 employee lens와 member lens, eligibility/claims 기준일, lag, completeness, n≥20 suppression을 먼저 가리킨다. employer가 개인 PHI를 보지 않는다는 점을 명확히 한다.", [DASHBOARD_URL, path.join(ROOT, "index.html")]);
  content.push({ slide: 4, ko: "증거는 숫자보다 먼저, 정의가 보여야 합니다.", en: "Evidence begins with transparent definitions." });
}

// 5. Honest economics
{
  const slide = loop.slides.add();
  slide.background.fill = C.ink;
  addCoBrand(slide, logo, snowflake, { left: 903, top: 30, icloWidth: 92, snowWidth: 196, dark: true });
  addTitle(slide, "첫해 절감을 약속하지 않습니다.", "No year-one savings promise.", 5, true);
  addText(slide, "ILLUSTRATIVE HYPOTHESIS - NOT AN OUTCOME / 예시 가설 - 실제 결과 아님", { left: 74, top: 214, width: 620, height: 22 }, { fontSize: 11.5, bold: true, color: C.warning });
  addRule(slide, 100, 530, 580, "#5B6D7E", 2);
  addRule(slide, 100, 270, 2, "#5B6D7E", 260);
  addText(slide, "Plan-paid claims / 보험자 지급 청구액", { left: 40, top: 242, width: 250, height: 22 }, { fontSize: 11, color: "#AEBBC5" });
  const pts = [
    addBox(slide, { left: 142, top: 430, width: 16, height: 16 }, { geometry: "ellipse", fill: C.teal, line: C.teal }),
    addBox(slide, { left: 290, top: 320, width: 16, height: 16 }, { geometry: "ellipse", fill: C.warning, line: C.warning }),
    addBox(slide, { left: 444, top: 365, width: 16, height: 16 }, { geometry: "ellipse", fill: C.teal, line: C.teal }),
    addBox(slide, { left: 598, top: 398, width: 16, height: 16 }, { geometry: "ellipse", fill: C.teal, line: C.teal }),
  ];
  for (let i = 0; i < pts.length - 1; i += 1) connect(slide, pts[i], pts[i + 1], { arrow: false, color: C.teal, width: 4 });
  ["Baseline / 기준", "Year 1 / 1년", "Year 2 / 2년", "Year 3 / 3년"].forEach((label, i) => {
    addText(slide, label, { left: 116 + i * 154, top: 548, width: 90, height: 24 }, { fontSize: 12.5, color: "#C4D0D9", alignment: "center" });
  });
  addText(slide, "Prevention + discovered treatment", { left: 220, top: 268, width: 290, height: 28 }, { fontSize: 16, bold: true, color: C.warning, alignment: "center" });
  addText(slide, "예방 이용 + 미치료 상태 발견", { left: 230, top: 300, width: 270, height: 24 }, { fontSize: 13, color: "#D6C09D", alignment: "center" });

  const items = [
    ["Year 1 / 1년차", "Preventive use and discovered treatment can raise plan-paid claims.", "예방진료와 발견된 치료로 보험자 지급액이 늘 수 있습니다."],
    ["Years 2-3 / 2-3년차", "Treatment-mix change becomes measurable over time.", "치료 믹스 변화는 시간이 지나야 측정할 수 있습니다."],
    ["Turnover / 이직률", "Tenure changes the economic and employee-experience case.", "근속기간에 따라 비용·직원 경험의 가치 논리가 달라집니다."],
  ];
  items.forEach(([label, en, ko], i) => {
    const top = 230 + i * 118;
    addText(slide, label, { left: 758, top, width: 190, height: 24 }, { fontSize: 15, bold: true, color: C.teal });
    addText(slide, en, { left: 758, top: top + 31, width: 450, height: 38 }, { fontSize: 16, bold: true, color: C.white });
    addText(slide, ko, { left: 758, top: top + 72, width: 450, height: 34 }, { fontSize: 14, color: "#B7C4D0" });
  });
  addRule(slide, 758, 594, 450, C.warning, 3);
  addText(slide, "Measure allowed, plan-paid and employee OOP separately.", { left: 758, top: 608, width: 450, height: 22 }, { fontSize: 13.5, bold: true, color: C.white });
  addText(slide, "허용액·보험자 지급액·직원 본인부담액을 구분해 측정합니다.", { left: 758, top: 635, width: 450, height: 22 }, { fontSize: 13, color: "#B7C4D0" });
  addNotes(slide, "J-curve는 planning hypothesis다. 첫해 예방 이용과 미치료 상태 발견으로 allowed, plan-paid, employee OOP가 서로 다르게 움직일 수 있다. 실제 ICLO 성과값으로 제시하지 않으며 year-one savings guarantee를 하지 않는다. Turnover sensitivity는 Snowflake analytics use case로 연결한다.", ["ICLO Snowflake external briefing addendum v1"]);
  content.push({ slide: 5, ko: "첫해 절감을 약속하지 않습니다.", en: "No year-one savings promise." });
}

// 6. Collaboration readiness
{
  const slide = loop.slides.add();
  slide.background.fill = C.white;
  addImage(slide, collaboration, { left: 0, top: 0, width: 650, height: H }, "Two Korean professionals reviewing a laptop together");
  addBox(slide, { left: 650, top: 0, width: 630, height: H }, { fill: C.white });
  addCoBrand(slide, logo, snowflake, { left: 762, top: 18, icloWidth: 86, snowWidth: 130 });
  addText(slide, "SELECTED FOR TWO FINANCIAL\nINNOVATION COHORTS.", { left: 710, top: 112, width: 500, height: 102 }, { fontSize: 31, bold: true });
  addText(slide, "핀테크 큐브 9기 · 신한퓨처스랩 12기 선정 완료", { left: 712, top: 235, width: 500, height: 42 }, { fontSize: 18, bold: true, color: C.muted });
  addRule(slide, 712, 338, 500, C.line, 1);

  addText(slide, "Selected · Fintech Cube Cohort 9", { left: 712, top: 367, width: 480, height: 32 }, { fontSize: 23, bold: true });
  addText(slide, "핀테크 큐브 9기 선정", { left: 712, top: 407, width: 480, height: 24 }, { fontSize: 16, color: C.tealDark });
  addRule(slide, 712, 457, 500, C.line, 1);
  addText(slide, "Selected · Shinhan Future’s Lab Cohort 12", { left: 712, top: 486, width: 480, height: 32 }, { fontSize: 22, bold: true });
  addText(slide, "신한퓨처스랩 12기 선정", { left: 712, top: 526, width: 480, height: 24 }, { fontSize: 16, color: C.tealDark });

  addBox(slide, { left: 712, top: 594, width: 500, height: 66 }, { fill: C.tealPale, line: C.teal, lineWidth: 1 });
  addText(slide, "Collaboration scoping and validation in progress\n협업 과제 발굴·검증 진행 중", { left: 734, top: 602, width: 456, height: 50 }, { fontSize: 15, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "선정 사실은 사용자가 확인한 정보다. 프로그램 선정은 금융사 협업을 위한 검증 채널과 준비도의 신호로만 설명하고, 완료된 제휴·계약·성과로 표현하지 않는다. 화면의 인물 사진은 생성형 실사 이미지이며 실제 프로그램 관계자가 아니다.", ["User confirmation: Fintech Cube 9 and Shinhan Future’s Lab 12 selection", "https://fintech.or.kr/", "https://www.futureslab.kr/", ASSET("collaboration-team.png")]);
  content.push({ slide: 6, ko: "핀테크 큐브 9기 · 신한퓨처스랩 12기 선정 완료", en: "Selected for two financial innovation cohorts." });
}

// 7. CTA and live demo
{
  const slide = loop.slides.add();
  slide.background.fill = C.ink;
  addCoBrand(slide, logo, snowflake, { left: 64, top: 28, icloWidth: 105, snowWidth: 150, dark: true });
  addText(slide, "CAN YOUR COMPANY PROVE\nHOW DENTAL BENEFITS ARE USED?", { left: 62, top: 158, width: 780, height: 130 }, { fontSize: 39, bold: true, color: C.white });
  addText(slide, "회사의 치과 혜택 이용을 근거로 설명할 수 있나요?", { left: 66, top: 318, width: 720, height: 44 }, { fontSize: 21, bold: true, color: "#D6E0E7" });
  addRule(slide, 66, 419, 106, C.teal, 5);
  addText(slide, "Looking for HR, Benefits and Data teams at technology and financial-services companies.", { left: 66, top: 453, width: 720, height: 44 }, { fontSize: 19, bold: true, color: C.white });
  addText(slide, "테크·금융 기업의 HR · Benefits · Data 팀을 찾습니다.", { left: 66, top: 508, width: 720, height: 32 }, { fontSize: 16, color: "#B7C4D0" });
  addText(slide, "Help validate the governed evidence pattern on Snowflake.", { left: 66, top: 590, width: 720, height: 28 }, { fontSize: 17, bold: true, color: C.teal });
  addText(slide, "Snowflake에서 구현할 관리형 증거 패턴을 함께 검증합니다.", { left: 66, top: 627, width: 720, height: 26 }, { fontSize: 14.5, color: "#B7C4D0" });

  addText(slide, "LIVE SYNTHETIC DEMO / 합성 데이터 데모", { left: 875, top: 103, width: 330, height: 24 }, { fontSize: 12, bold: true, color: C.teal, alignment: "center" });
  addBox(slide, { left: 895, top: 142, width: 288, height: 288 }, { fill: C.white });
  addImage(slide, qr, { left: 910, top: 157, width: 258, height: 258 }, "QR code to the ICLO employer dashboard demo", { fit: "contain" });
  addText(slide, "Synthetic data · aggregate only · no individual PHI", { left: 844, top: 461, width: 390, height: 26 }, { fontSize: 14, bold: true, color: C.white, alignment: "center" });
  addText(slide, "합성 데이터 · 집계 전용 · 개인 PHI 없음", { left: 858, top: 497, width: 362, height: 26 }, { fontSize: 13, color: "#B7C4D0", alignment: "center" });
  addText(slide, "ASK FOR A WALK-THROUGH / 데모 설명 요청", { left: 830, top: 560, width: 416, height: 26 }, { fontSize: 12.5, bold: true, color: C.teal, alignment: "center" });
  addText(slide, "SCAN TO OPEN / 스캔하여 열기", { left: 900, top: 626, width: 278, height: 24 }, { fontSize: 12, bold: true, color: C.white, alignment: "center" });
  addNotes(slide, "QR은 공개 synthetic dashboard로 연결된다. 리드 스캐너가 제공되지 않으므로 현장에서 질문을 받은 뒤 데모 QR을 보여주고, 별도 폼 또는 명함 수집 프로세스와 연결한다. Snowflake가 ICLO를 보증하거나 co-sell한다는 의미로 설명하지 않는다.", [SOURCE_GUIDE, DASHBOARD_URL]);
  content.push({ slide: 7, ko: "회사의 치과 혜택 이용을 근거로 설명할 수 있나요?", en: "Can your company prove how dental benefits are used?" });
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
await fs.writeFile(path.join(TMP, "rendered", "booth-loop-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const inspect = await loop.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 40000 });
await fs.writeFile(path.join(TMP, "rendered", "booth-loop-inspect.txt"), inspect.ndjson);
const loopFile = await PresentationFile.exportPptx(loop);
await loopFile.save(LOOP_PPTX);

// 850 × 300 mm backwall. 3213 × 1134 px maps to 33.47 × 11.81 inches at 96 dpi.
const BW = 3213;
const BH = 1134;
const wall = Presentation.create({ slideSize: { width: BW, height: BH } });
{
  const slide = wall.slides.add();
  slide.background.fill = C.paper;
  addImage(slide, hero, { left: 0, top: 0, width: BW, height: BH }, "Wide booth backwall hero with Korean office employee");
  addBox(slide, { left: 0, top: 0, width: 1710, height: BH }, { fill: C.white });
  addBox(slide, { left: 0, top: 0, width: 34, height: BH }, { fill: C.teal });
  addCoBrand(slide, logo, snowflake, { left: 140, top: 44, icloWidth: 260, snowWidth: 330 });
  addText(slide, "MAKE DENTAL BENEFITS\nEASIER TO USE.", { left: 126, top: 300, width: 1470, height: 330 }, { fontSize: 106, bold: true, color: C.ink });
  addText(slide, "직원이 치과 혜택을 더 쉽게 이해하고 이용하도록.", { left: 140, top: 690, width: 1400, height: 82 }, { fontSize: 45, bold: true, color: C.ink2 });
  addRule(slide, 140, 854, 240, C.teal, 12);
  addText(slide, "Employee navigation · Claims-verified aggregate evidence", { left: 140, top: 907, width: 1400, height: 64 }, { fontSize: 31, bold: true, color: C.tealDark });
  addText(slide, "직원 내비게이션 · 청구로 검증된 기업 집계 근거", { left: 140, top: 994, width: 1400, height: 58 }, { fontSize: 29, color: C.ink2 });
}
const wallSlide = wall.slides.items[0];
const wallPng = await wall.export({ slide: wallSlide, format: "png", scale: 2 });
await fs.writeFile(WALL_PNG, new Uint8Array(await wallPng.arrayBuffer()));
const wallLayout = await wallSlide.export({ format: "layout" });
await fs.writeFile(path.join(TMP, "rendered", "backwall.layout.json"), await wallLayout.text());
const wallFile = await PresentationFile.exportPptx(wall);
await wallFile.save(WALL_PPTX);

await fs.writeFile(path.join(TMP, "booth-content.json"), JSON.stringify({ content, backwallFallbackText: "DENTAL BENEFITS, MADE EASIER", dashboardUrl: DASHBOARD_URL }, null, 2));
console.log(`Created ${LOOP_PPTX}`);
console.log(`Created ${WALL_PPTX}`);
console.log(`Created ${WALL_PNG}`);
