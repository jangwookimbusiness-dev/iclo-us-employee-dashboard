import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const TMP = path.join(ROOT, "tmp/iclo-snowflake-proposal-v2");
const FINAL = path.join(ROOT, "output/pptx/ICLO-Snowflake-HLS-Proposal-External-Briefing-v2.pptx");
const IMG_OVERVIEW = path.join(TMP, "assets/employer-dashboard-overview.png");
const IMG_ICLO_LOGO = path.join(TMP, "assets/iclo-logo.png");
const IMG_SNOWFLAKE_LOGO = path.join(TMP, "assets/snowflake-logo.png");
const IMG_QR = path.join(TMP, "assets/demo-qr.png");

const W = 1280;
const H = 720;
const C = {
  navy: "#1B2A4A",
  navy2: "#253A63",
  coral: "#FF7A79",
  teal: "#007A87",
  sky: "#29B5E8",
  amber: "#D99A24",
  green: "#2E7D5B",
  ink: "#152238",
  muted: "#5B6B82",
  line: "#DCE3EC",
  light: "#F5F7FA",
  lighter: "#FAFBFC",
  white: "#FFFFFF",
  paleTeal: "#E8F5F5",
  paleSky: "#EAF7FC",
  paleCoral: "#FFF0F0",
  paleAmber: "#FFF7E8",
  paleNavy: "#EEF1F7",
};
const FONT = "Arial";

const internalReport = "/Users/jk0307/Documents/obsidian_vault1/J-Dub S-Brain/20_Business/25_iclo/01_strategy/2026-07-30-iclo-us-employer-oral-health-report-v2.md";
const internal3Pager = "/Users/jk0307/Documents/obsidian_vault1/J-Dub S-Brain/20_Business/25_iclo/01_strategy/2026-07-30-iclo-snowflake-korea-3pager-v2.md";
const internalEmail = "/Users/jk0307/Documents/obsidian_vault1/J-Dub S-Brain/20_Business/25_iclo/02_meetings/2026-08-04-unknown-re-미국-임직원-복지-프로그램-시안-대시보드-포함.md";
const dashboardUrl = "https://jangwookimbusiness-dev.github.io/iclo-us-employee-dashboard/";

function addText(slide, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name: options.name,
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: FONT,
    fontSize: options.fontSize ?? 18,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "left",
    italic: options.italic ?? false,
  };
  return shape;
}

function addBox(slide, position, options = {}) {
  const geometry = options.geometry ?? "roundRect";
  const shape = {
    geometry,
    name: options.name,
    position,
    fill: options.fill ?? C.white,
    line: {
      style: options.lineStyle ?? "solid",
      fill: options.line ?? C.line,
      width: options.lineWidth ?? 1,
    },
  };
  if (["rect", "textbox", "roundRect"].includes(geometry)) {
    shape.borderRadius = options.borderRadius ?? "rounded-lg";
  }
  return slide.shapes.add(shape);
}

function addDot(slide, x, y, n, fill) {
  addBox(slide, { left: x, top: y, width: 28, height: 28 }, {
    geometry: "ellipse", fill, line: fill, lineWidth: 0, borderRadius: 0,
  });
  addText(slide, String(n), { left: x, top: y + 3, width: 28, height: 22 }, {
    fontSize: 15, bold: true, color: C.white, alignment: "center",
  });
}

function addCategory(slide, labels) {
  const categoryColors = {
    "CONFIRMED ICLO DIRECTION": C.navy,
    "ICLO PRODUCT DESIGN PRINCIPLE": C.teal,
    "HYPOTHESIS / TO BE VALIDATED": C.amber,
    "REQUEST TO SNOWFLAKE": C.sky,
  };
  const widths = labels.map((label) => Math.max(180, Math.min(280, 24 + label.length * 8)));
  const totalW = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, labels.length - 1) * 8;
  let x = W - 64 - totalW;
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const width = widths[i];
    addBox(slide, { left: x, top: 22, width, height: 30 }, {
      geometry: "rect", fill: C.white, line: categoryColors[label], lineWidth: 1, borderRadius: 0,
    });
    addBox(slide, { left: x, top: 22, width: 6, height: 30 }, {
      geometry: "rect", fill: categoryColors[label], line: categoryColors[label], lineWidth: 0, borderRadius: 0,
    });
    addText(slide, label, { left: x + 12, top: 27, width: width - 18, height: 20 }, {
      fontSize: 9.5, bold: true, color: categoryColors[label],
    });
    x += width + 8;
  }
}

function addHeader(slide, title, takeaway, labels, slideNumber, appendix = false) {
  slide.background.fill = C.white;
  addText(slide, appendix ? "APPENDIX" : "HLS GTM & ARCHITECTURE PROPOSAL", {
    left: 64, top: 29, width: 260, height: 20,
  }, { fontSize: 11, bold: true, color: appendix ? C.coral : C.teal });
  addCategory(slide, labels);
  const titleFontSize = title.length > 65 ? 28 : title.length > 58 ? 31 : 36;
  addText(slide, title, { left: 64, top: 62, width: 1152, height: 52 }, {
    fontSize: titleFontSize, bold: true, color: C.navy,
  });
  addText(slide, takeaway, { left: 64, top: 121, width: 1120, height: 52 }, {
    fontSize: 21, color: C.muted,
  });
  addBox(slide, { left: 64, top: 177, width: 1152, height: 2 }, {
    geometry: "rect", fill: C.line, line: C.line, lineWidth: 0, borderRadius: 0,
  });
  addBox(slide, { left: 64, top: 177, width: 88, height: 2 }, {
    geometry: "rect", fill: appendix ? C.coral : C.teal, line: appendix ? C.coral : C.teal, lineWidth: 0, borderRadius: 0,
  });
  addBox(slide, { left: 64, top: 680, width: 1152, height: 1 }, {
    geometry: "rect", fill: C.line, line: C.line, lineWidth: 0, borderRadius: 0,
  });
  slide.images.add({
    blob: ICLO_LOGO_BYTES, contentType: "image/png", alt: "ICLO logo",
    fit: "contain", position: { left: 64, top: 685, width: 58, height: 21 },
  });
  addText(slide, "×", { left: 128, top: 686, width: 18, height: 18 }, { fontSize: 11, bold: true, color: C.muted, alignment: "center" });
  slide.images.add({
    blob: SNOWFLAKE_LOGO_BYTES, contentType: "image/png", alt: "Snowflake logo",
    fit: "contain", position: { left: 150, top: 682, width: 78, height: 28 },
  });
  addText(slide, "External proposal · discussion material", {
    left: 244, top: 687, width: 360, height: 18,
  }, { fontSize: 10.5, color: C.muted });
  addText(slide, String(slideNumber).padStart(2, "0"), {
    left: 1168, top: 687, width: 48, height: 18,
  }, { fontSize: 10.5, color: C.muted, alignment: "right" });
}

function addNotes(slide, note, sources) {
  const sourceLines = sources.map((s) => `- ${s}`).join("\n");
  slide.speakerNotes.textFrame.setText(`${note}\n\n[Sources]\n${sourceLines}`);
  slide.speakerNotes.setVisible(true);
}

function addMessageColumns(slide, items, top = 535) {
  const gap = 24;
  const width = (1152 - gap * (items.length - 1)) / items.length;
  items.forEach((item, i) => {
    const left = 64 + i * (width + gap);
    addBox(slide, { left, top, width: 4, height: 92 }, {
      geometry: "rect", fill: item.color, line: item.color, lineWidth: 0, borderRadius: 0,
    });
    addText(slide, item.title, { left: left + 14, top: top + 2, width: width - 14, height: 25 }, {
      fontSize: 16, bold: true, color: C.ink,
    });
    addText(slide, item.body, { left: left + 14, top: top + 29, width: width - 14, height: 60 }, {
      fontSize: 15.5, color: C.muted,
    });
  });
}

function connect(slide, from, to, options = {}) {
  return slide.shapes.connect(from, to, {
    kind: options.kind ?? "straight",
    fromSide: options.fromSide ?? "right",
    toSide: options.toSide ?? "left",
    line: { style: options.dashed ? "dashed" : "solid", fill: options.color ?? C.muted, width: options.width ?? 2 },
    head: { type: "none" },
    tail: options.noHead ? { type: "none" } : { type: "arrow", width: "med", length: "med" },
  });
}

async function readImageBytes(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function styleTable(table, rows, columns, headerFill = C.navy, options = {}) {
  const headerFontSize = options.headerFontSize ?? 14;
  const bodyFontSize = options.bodyFontSize ?? 13.5;
  const margin = options.margin ?? 7;
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: columns }).assign({
    fill: headerFill,
    textStyle: { fontFamily: FONT, fontSize: headerFontSize, bold: true, color: C.white },
    margins: { left: 8, right: 8, top: margin, bottom: margin },
    anchor: "middle",
  });
  if (rows > 1) {
    table.cells.block({ row: 1, column: 0, rowCount: rows - 1, columnCount: columns }).assign({
      fill: C.white,
      textStyle: { fontFamily: FONT, fontSize: bodyFontSize, color: C.ink },
      margins: { left: 8, right: 8, top: margin, bottom: margin },
      anchor: "middle",
    });
  }
}

const slideData = [];
const ICLO_LOGO_BYTES = await readImageBytes(IMG_ICLO_LOGO);
const SNOWFLAKE_LOGO_BYTES = await readImageBytes(IMG_SNOWFLAKE_LOGO);
const QR_BYTES = await readImageBytes(IMG_QR);
const presentation = Presentation.create({ slideSize: { width: W, height: H } });

// Slide 1
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  addText(slide, "HLS GTM & ARCHITECTURE PROPOSAL", { left: 64, top: 52, width: 420, height: 24 }, {
    fontSize: 12, bold: true, color: C.sky,
  });
  slide.images.add({ blob: ICLO_LOGO_BYTES, contentType: "image/png", alt: "ICLO logo", fit: "contain", position: { left: 940, top: 36, width: 104, height: 38 } });
  addText(slide, "×", { left: 1054, top: 46, width: 24, height: 24 }, { fontSize: 17, bold: true, color: "#B8C4D8", alignment: "center" });
  slide.images.add({ blob: SNOWFLAKE_LOGO_BYTES, contentType: "image/png", alt: "Snowflake logo", fit: "contain", position: { left: 1086, top: 30, width: 130, height: 55 } });
  addText(slide, "Building the Evidence Layer for\nEmployer Dental Benefits", {
    left: 64, top: 132, width: 920, height: 125,
  }, { fontSize: 46, bold: true, color: C.white });
  addText(slide, "ICLO turns employee dental-benefit navigation into claims-confirmed, privacy-governed evidence.", {
    left: 64, top: 276, width: 1080, height: 58,
  }, { fontSize: 22, color: "#D9E2F0" });

  const boxes = [
    { x: 64, w: 298, title: "Employee navigation", body: "Understand benefits\nRequest support", fill: C.paleCoral, line: C.coral },
    { x: 432, w: 398, title: "Governed evidence plane", body: "Eligibility + plan + events + claims", fill: C.paleSky, line: C.sky },
    { x: 900, w: 316, title: "Employer evidence", body: "Aggregate outcomes\nNo individual PHI", fill: C.paleTeal, line: C.teal },
  ];
  const nodes = boxes.map((b) => addBox(slide, { left: b.x, top: 430, width: b.w, height: 124 }, {
    fill: b.fill, line: b.line, lineWidth: 2,
  }));
  connect(slide, nodes[0], nodes[1], { color: C.white, width: 2 });
  connect(slide, nodes[1], nodes[2], { color: C.white, width: 2 });
  boxes.forEach((b) => {
    addText(slide, b.title, { left: b.x + 18, top: 448, width: b.w - 36, height: 28 }, {
      fontSize: 18, bold: true, color: C.navy,
    });
    addText(slide, b.body, { left: b.x + 18, top: 483, width: b.w - 36, height: 55 }, {
      fontSize: 15, color: C.muted,
    });
  });

  const legend = [
    ["CONFIRMED DIRECTION", C.navy2], ["DESIGN PRINCIPLE", C.teal], ["TO VALIDATE", C.amber], ["SNOWFLAKE ASK", C.sky],
  ];
  legend.forEach(([label, color], i) => {
    const x = 64 + i * 215;
    addBox(slide, { left: x, top: 628, width: 10, height: 10 }, { geometry: "rect", fill: color, line: color, lineWidth: 0, borderRadius: 0 });
    addText(slide, label, { left: x + 18, top: 624, width: 185, height: 18 }, { fontSize: 11, bold: true, color: "#D9E2F0" });
  });
  addText(slide, "01", { left: 1168, top: 673, width: 48, height: 18 }, { fontSize: 10.5, color: "#B8C4D8", alignment: "right" });

  const note = "ICLO를 ' 치아 사진 AI '로 소개하지 않는다. 앞단은 직원의 치과복지 이해와 이용을 돕는 경험이고, 뒷단은 그 여정을 eligibility와 claims로 확인하는 evidence layer라는 점을 먼저 고정한다. 이번 미팅의 목적은 제품 판매가 아니라 Snowflake 내 sales play, 기술 검증 세션, account-level 검증 경로를 합의하는 것이다.";
  addNotes(slide, note, [internalReport, internal3Pager, dashboardUrl]);
  slideData.push({ number: 1, title: "ICLO x Snowflake: Building the Evidence Layer for Employer Dental Benefits", note, sources: [internalReport, internal3Pager, dashboardUrl] });
}

// Slide 2
{
  const slide = presentation.slides.add();
  addHeader(slide, "The Employee Problem Is Not Coverage Alone - It Is Navigation",
    "Plan, network and operational context shape whether coverage becomes usable care.",
    ["HYPOTHESIS / TO BE VALIDATED"], 2);

  const pathItems = [
    { title: "Coverage", sub: "Eligible employee", fill: C.paleNavy, line: C.navy },
    { title: "Network", sub: "Provider economics", fill: C.paleSky, line: C.sky },
    { title: "Plan rules", sub: "Deductible + max", fill: C.paleAmber, line: C.amber },
    { title: "Availability", sub: "Directory + booking", fill: C.paleCoral, line: C.coral },
    { title: "Usable care", sub: "Understood OOP", fill: C.paleTeal, line: C.teal },
  ];
  const nodes = pathItems.map((item, i) => addBox(slide, {
    left: 64 + i * 229, top: 240 + (i % 2 ? 44 : 0), width: 190, height: 112,
  }, { fill: item.fill, line: item.line, lineWidth: 2 }));
  for (let i = 0; i < nodes.length - 1; i += 1) connect(slide, nodes[i], nodes[i + 1], { color: C.muted, width: 2, kind: "elbow" });
  pathItems.forEach((item, i) => {
    const top = 240 + (i % 2 ? 44 : 0);
    addText(slide, item.title, { left: 80 + i * 229, top: top + 20, width: 158, height: 28 }, { fontSize: 19, bold: true, color: C.navy, alignment: "center" });
    addText(slide, item.sub, { left: 80 + i * 229, top: top + 57, width: 158, height: 36 }, { fontSize: 15, color: C.muted, alignment: "center" });
  });
  addMessageColumns(slide, [
    { title: "NETWORK", body: "Provider choice may be constrained or economically penalized by plan rules.", color: C.sky },
    { title: "BENEFIT DESIGN", body: "Deductible, coinsurance, annual maximum and covered procedures vary.", color: C.amber },
    { title: "OPERATIONS", body: "Directory status, appointment availability and final EOB may differ from expectations.", color: C.coral },
  ], 520);

  const note = "보험이 있어도 모든 직원에게 동일한 이용경험이 생기는 것은 아니라는 문제를 설명한다. 다만 '계약 치과만 갈 수 있다'처럼 절대화하지 않는다. friction의 크기와 구매 우선순위는 아직 고객 데이터와 인터뷰로 검증해야 하므로 hypothesis로 명시한다.";
  const sources = [internalReport, internalEmail, "https://www.healthcare.gov/coverage/dental-coverage/", "https://www.deltadental.com/about-us/terms-of-use/"];
  addNotes(slide, note, sources);
  slideData.push({ number: 2, title: "The Employee Problem Is Not Coverage Alone - It Is Navigation", note, sources });
}

// Slide 3
{
  const slide = presentation.slides.add();
  addHeader(slide, "ICLO Connects Plan Context to Employee-Initiated Action",
    "Employee dental-benefit navigation in the front; a governed evidence layer in the back.",
    ["CONFIRMED ICLO DIRECTION", "ICLO PRODUCT DESIGN PRINCIPLE"], 3);

  const stages = [
    { n: "01", title: "Employee experience", body: "Concern + benefit understanding\nOptional oral-image capture", color: C.coral, fill: C.paleCoral },
    { n: "02", title: "Benefit + provider context", body: "Eligibility + network\nPlan rules + availability", color: C.sky, fill: C.paleSky },
    { n: "03", title: "Employee-initiated action", body: "Provider search\nAppointment support", color: C.amber, fill: C.paleAmber },
    { n: "04", title: "Claims evidence", body: "Completion + claim line\nEmployer aggregate only", color: C.teal, fill: C.paleTeal },
  ];
  const nodes = stages.map((s, i) => addBox(slide, { left: 64 + i * 291, top: 230, width: 252, height: 180 }, { fill: s.fill, line: s.color, lineWidth: 2 }));
  for (let i = 0; i < nodes.length - 1; i += 1) connect(slide, nodes[i], nodes[i + 1], { color: C.muted, width: 2 });
  stages.forEach((s, i) => {
    const left = 64 + i * 291;
    addText(slide, s.n, { left: left + 18, top: 246, width: 44, height: 26 }, { fontSize: 16, bold: true, color: s.color });
    addText(slide, s.title, { left: left + 18, top: 283, width: 215, height: 48 }, { fontSize: 19, bold: true, color: C.navy });
    addText(slide, s.body, { left: left + 18, top: 342, width: 215, height: 52 }, { fontSize: 15.5, color: C.muted });
  });
  addBox(slide, { left: 64, top: 455, width: 1152, height: 104 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1.5 });
  addText(slide, "SHADOW SIGNAL", { left: 84, top: 474, width: 180, height: 22 }, { fontSize: 14, bold: true, color: C.amber });
  addText(slide, "Raw disease probabilities are not shown to employees or employers. Model-derived signals do not automatically determine provider, urgency or treatment pathway.", {
    left: 270, top: 470, width: 920, height: 46,
  }, { fontSize: 16.5, color: C.ink });
  addText(slide, "Design redline: separate signal, navigation and referral tables; timestamp employee action and consent.", {
    left: 270, top: 522, width: 900, height: 24,
  }, { fontSize: 14, color: C.muted });
  addMessageColumns(slide, [
    { title: "UNDERSTAND", body: "Concerns, benefits and optional image capture.", color: C.coral },
    { title: "MATCH", body: "Eligibility, plan, network and operational context.", color: C.sky },
    { title: "VERIFY", body: "Preventive visits and claims at aggregate employer level.", color: C.teal },
  ], 570);

  const note = "Employee Experience, Benefit and Provider Context, Action, Claims Evidence의 네 단계를 보여준다. 초기 이미지 모델 출력은 shadow mode에 두고 직원 행동, urgency, provider 또는 treatment pathway를 자동 결정하지 않는다. employee-initiated 또는 human-assisted navigation은 현재 ICLO의 잠정 product redline이며 미국 규제 자문을 거쳐 확정할 사안이다.";
  const sources = [internalReport, internalEmail];
  addNotes(slide, note, sources);
  slideData.push({ number: 3, title: "ICLO Connects Plan Context to Employee-Initiated Action", note, sources });
}

// Slide 4
{
  const slide = presentation.slides.add();
  addHeader(slide, "The Economics Begin with a J-Curve, Not a Year-One Savings Promise",
    "Year-one utilization and plan-paid claims may rise before treatment-mix change becomes measurable.",
    ["CONFIRMED ICLO DIRECTION", "HYPOTHESIS / TO BE VALIDATED"], 4);

  addText(slide, "Illustrative shape only - not an ICLO outcome", { left: 64, top: 200, width: 450, height: 22 }, { fontSize: 13, bold: true, color: C.amber });
  const curveNodes = [
    { x: 64, y: 342, w: 180, h: 78, title: "Baseline", body: "Plan-year start", color: C.navy, fill: C.paleNavy },
    { x: 290, y: 245, w: 248, h: 124, title: "Year 1", body: "Preventive use rises\nNew treatment is discovered", color: C.coral, fill: C.paleCoral },
    { x: 584, y: 290, w: 246, h: 112, title: "Years 2-3", body: "Treatment mix + run-out\nbecome measurable", color: C.sky, fill: C.paleSky },
    { x: 876, y: 324, w: 184, h: 94, title: "Validate", body: "Direction unknown", color: C.teal, fill: C.paleTeal },
  ];
  const nodes = curveNodes.map((n) => addBox(slide, { left: n.x, top: n.y, width: n.w, height: n.h }, { fill: n.fill, line: n.color, lineWidth: 2 }));
  for (let i = 0; i < nodes.length - 1; i += 1) connect(slide, nodes[i], nodes[i + 1], { color: C.muted, width: 2 });
  curveNodes.forEach((n) => {
    addText(slide, n.title, { left: n.x + 14, top: n.y + 15, width: n.w - 28, height: 25 }, { fontSize: 18, bold: true, color: C.navy, alignment: "center" });
    addText(slide, n.body, { left: n.x + 14, top: n.y + 46, width: n.w - 28, height: n.h - 50 }, { fontSize: 14.5, color: C.muted, alignment: "center" });
  });
  addBox(slide, { left: 1072, top: 230, width: 144, height: 102 }, { fill: C.paleTeal, line: C.teal, lineWidth: 1.5 });
  addText(slide, "LOW\nTURNOVER", { left: 1084, top: 251, width: 120, height: 48 }, { fontSize: 13.5, bold: true, color: C.teal, alignment: "center" });
  addBox(slide, { left: 1072, top: 356, width: 144, height: 102 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1.5 });
  addText(slide, "HIGH\nTURNOVER", { left: 1084, top: 377, width: 120, height: 48 }, { fontSize: 13.5, bold: true, color: C.amber, alignment: "center" });
  addText(slide, "Multi-year value lens", { left: 1064, top: 470, width: 180, height: 24 }, { fontSize: 13.5, color: C.teal, alignment: "center" });
  addText(slide, "Employee experience lens", { left: 1064, top: 497, width: 180, height: 24 }, { fontSize: 13.5, color: C.amber, alignment: "center" });
  addMessageColumns(slide, [
    { title: "UTILIZATION", body: "Preventive use can raise plan-paid claims.", color: C.coral },
    { title: "COST ALLOCATION", body: "Allowed, plan-paid and employee OOP can move differently.", color: C.sky },
    { title: "CONTRACT PRINCIPLE", body: "ICLO will not contract on a year-one savings guarantee.", color: C.navy },
  ], 548);

  const note = "초기 preventive utilization과 발견 치료가 비용을 올릴 수 있음을 먼저 인정한다. 이후 mix 변화는 가설이며 고객 데이터로 검증해야 한다. Allowed, plan-paid, employee OOP를 분리하고 저이직 기업은 장기 회수 가능성, 고이직 기업은 employee experience와 retention 논리를 별도로 검토한다. 숫자를 실제 ICLO outcome처럼 제시하지 않는다.";
  const sources = [internalReport, internalEmail];
  addNotes(slide, note, sources);
  slideData.push({ number: 4, title: "The Economics Begin with a J-Curve, Not a Year-One Savings Promise", note, sources });
}

// Slide 5
{
  const slide = presentation.slides.add();
  addHeader(slide, "Snowflake Is the Governed Evidence Plane",
    "Structured evidence is governed in Snowflake; raw images and employee-level routing remain outside employer views.",
    ["ICLO PRODUCT DESIGN PRINCIPLE", "REQUEST TO SNOWFLAKE"], 5);

  addText(slide, "RAW-IMAGE PATH", { left: 64, top: 202, width: 200, height: 20 }, { fontSize: 12, bold: true, color: C.coral });
  const raw1 = addBox(slide, { left: 64, top: 238, width: 220, height: 66 }, { fill: C.paleCoral, line: C.coral, lineWidth: 1.5 });
  const raw2 = addBox(slide, { left: 64, top: 328, width: 220, height: 82 }, { fill: C.paleNavy, line: C.navy, lineWidth: 1.5 });
  const raw3 = addBox(slide, { left: 64, top: 434, width: 220, height: 72 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1.5 });
  connect(slide, raw1, raw2, { fromSide: "bottom", toSide: "top", kind: "straight", color: C.muted });
  connect(slide, raw2, raw3, { fromSide: "bottom", toSide: "top", kind: "straight", color: C.muted });
  addText(slide, "Raw oral image", { left: 82, top: 260, width: 184, height: 24 }, { fontSize: 17, bold: true, color: C.navy, alignment: "center" });
  addText(slide, "Controlled U.S. object storage / PHI vault", { left: 82, top: 350, width: 184, height: 44 }, { fontSize: 15.5, bold: true, color: C.navy, alignment: "center" });
  addText(slide, "Shadow inference", { left: 82, top: 458, width: 184, height: 24 }, { fontSize: 16, bold: true, color: C.amber, alignment: "center" });

  addText(slide, "STRUCTURED EVIDENCE PATH", { left: 324, top: 202, width: 250, height: 20 }, { fontSize: 12, bold: true, color: C.sky });
  const sourceLabels = ["App events", "HRIS eligibility", "Plan + provider context", "TPA / carrier claims"];
  const sourceNodes = sourceLabels.map((label, i) => addBox(slide, { left: 324 + i * 222, top: 232, width: 198, height: 66 }, { fill: C.paleSky, line: C.sky, lineWidth: 1.3 }));
  sourceLabels.forEach((label, i) => addText(slide, label, { left: 336 + i * 222, top: 253, width: 174, height: 28 }, { fontSize: 15, bold: true, color: C.navy, alignment: "center" }));

  const plane = addBox(slide, { left: 324, top: 342, width: 864, height: 174 }, { fill: C.navy, line: C.navy, lineWidth: 0 });
  sourceNodes.forEach((node) => connect(slide, node, plane, { fromSide: "bottom", toSide: "top", kind: "elbow", color: C.sky, width: 1.5 }));
  connect(slide, raw3, plane, { fromSide: "right", toSide: "left", kind: "elbow", color: C.amber, dashed: true, width: 2 });
  addText(slide, "Snowflake U.S. governed evidence layer", { left: 350, top: 362, width: 500, height: 30 }, { fontSize: 22, bold: true, color: C.white });
  addText(slide, "Canonical model", { left: 350, top: 414, width: 180, height: 22 }, { fontSize: 16, bold: true, color: C.sky });
  addText(slide, "member-month + plan + event + claim", { left: 350, top: 443, width: 220, height: 42 }, { fontSize: 14.5, color: "#D9E2F0" });
  addText(slide, "Quality + controls", { left: 610, top: 414, width: 180, height: 22 }, { fontSize: 16, bold: true, color: C.coral });
  addText(slide, "reconciliation + purpose access + lineage", { left: 610, top: 443, width: 226, height: 42 }, { fontSize: 14.5, color: "#D9E2F0" });
  addText(slide, "Outcome layer", { left: 878, top: 414, width: 180, height: 22 }, { fontSize: 16, bold: true, color: "#87D7D7" });
  addText(slide, "experiment assignment + claims-confirmed outcomes", { left: 878, top: 443, width: 260, height: 42 }, { fontSize: 14.5, color: "#D9E2F0" });
  addText(slide, "URI + metadata + model version + approved derived signal only", { left: 76, top: 524, width: 260, height: 42 }, { fontSize: 13.5, color: C.amber });

  const out = addBox(slide, { left: 736, top: 552, width: 452, height: 72 }, { fill: C.paleTeal, line: C.teal, lineWidth: 2 });
  connect(slide, plane, out, { fromSide: "bottom", toSide: "top", kind: "straight", color: C.teal, width: 2 });
  addText(slide, "Employer aggregate dashboard", { left: 756, top: 571, width: 412, height: 24 }, { fontSize: 18, bold: true, color: C.teal, alignment: "center" });
  addText(slide, "No employee-level health signals or routing", { left: 756, top: 598, width: 412, height: 20 }, { fontSize: 13.5, color: C.muted, alignment: "center" });
  addBox(slide, { left: 324, top: 636, width: 864, height: 30 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1 });
  addText(slide, "PHI platform prerequisite: Business Critical + appropriate Snowflake BAA. This does not make ICLO as a whole HIPAA-compliant.", {
    left: 338, top: 642, width: 836, height: 18,
  }, { fontSize: 12.5, bold: true, color: C.amber, alignment: "center" });

  const note = "Snowflake는 database hosting이 아니라 canonical model, data-quality reconciliation, policy-based access, lineage, outcome calculation과 account collaboration을 담당하는 evidence plane으로 설명한다. Raw oral image는 별도 controlled U.S. object storage 또는 PHI vault에 두고 Snowflake에는 URI, metadata, model version과 승인된 derived signal만 적재하는 경계를 제안한다. Business Critical과 적절한 BAA는 PHI 처리 시 플랫폼 전제이지 ICLO 전체 HIPAA 준수의 완성 조건이 아니다.";
  const sources = [internalReport, internal3Pager, "https://docs.snowflake.com/en/user-guide/intro-editions", "https://docs.snowflake.com/en/user-guide/data-sharing-intro", "https://docs.snowflake.com/en/user-guide/security-row-intro"];
  addNotes(slide, note, sources);
  slideData.push({ number: 5, title: "Snowflake Is the Governed Evidence Plane", note, sources });
}

// Slide 6
{
  const slide = presentation.slides.add();
  addHeader(slide, "The Dashboard Makes Privacy and Data Quality Visible",
    "This is not a performance claim. It shows how denominator, freshness, privacy and claims completeness become visible to the buyer.",
    ["ICLO PRODUCT DESIGN PRINCIPLE"], 6);

  const overview = await readImageBytes(IMG_OVERVIEW);
  slide.images.add({
    blob: overview, contentType: "image/png", alt: "ICLO employer dashboard overview using synthetic data",
    fit: "contain", position: { left: 64, top: 205, width: 1152, height: 368 }, geometry: "roundRect", borderRadius: "rounded-lg",
  });
  addBox(slide, { left: 64, top: 205, width: 1152, height: 368 }, { fill: "none", line: C.line, lineWidth: 1.5 });

  const annotations = [
    ["SYNTHETIC", "Illustrative only", C.coral],
    ["DENOMINATOR", "Employees / members", C.navy],
    ["FRESHNESS", "Dates + claims lag", C.sky],
    ["PRIVACY", "Aggregate · n ≥ 20 · no PHI", C.teal],
  ];
  annotations.forEach(([label, body, color], i) => {
    const left = 64 + i * 232;
    addBox(slide, { left, top: 594, width: 4, height: 54 }, { geometry: "rect", fill: color, line: color, lineWidth: 0, borderRadius: 0 });
    addText(slide, label, { left: left + 14, top: 594, width: 202, height: 20 }, { fontSize: 12.5, bold: true, color });
    addText(slide, body, { left: left + 14, top: 620, width: 202, height: 25 }, { fontSize: 14, color: C.ink });
  });
  slide.images.add({
    blob: QR_BYTES, contentType: "image/png", alt: "QR code linking to the synthetic employer dashboard demo",
    fit: "contain", position: { left: 1020, top: 582, width: 72, height: 72 },
  });
  addText(slide, "LIVE DEMO", { left: 1100, top: 591, width: 116, height: 20 }, { fontSize: 12.5, bold: true, color: C.teal });
  addText(slide, "Synthetic dashboard", { left: 1100, top: 616, width: 116, height: 38 }, { fontSize: 13.5, color: C.ink });

  const note = "화면의 수치는 ICLO 성과가 아니라 buyer가 metric 정의와 data quality를 검증하는 방식의 데모다. 직원 기준 참여 분모와 covered member-month 기준 비용 분모를 분리하고, 기준일, claims lag, completeness, suppression을 동시에 노출한다. employer는 개인 PHI나 개인별 routing 정보를 보지 않는다. 가로로 긴 원본 화면을 한 번만 크게 보여주고, 설명은 아래 가로 annotation strip으로 읽히게 배치했다.";
  const sources = [path.join(ROOT, "index.html"), path.join(ROOT, "README.md"), dashboardUrl];
  addNotes(slide, note, sources);
  slideData.push({ number: 6, title: "The Dashboard Makes Privacy and Data Quality Visible", note, sources });
}

// Slide 7
{
  const slide = presentation.slides.add();
  addHeader(slide, "The Opportunity Is Account-Specific - Not \"Delta\" or \"Blue\" as a Whole",
    "Procurement, workloads and incumbents must be validated at the legal-entity and business-unit level.",
    ["HYPOTHESIS / TO BE VALIDATED", "REQUEST TO SNOWFLAKE"], 7);

  addBox(slide, { left: 64, top: 201, width: 540, height: 54 }, { fill: C.paleTeal, line: C.teal, lineWidth: 1.5 });
  addText(slide, "Delta Dental: 39 independent companies", { left: 84, top: 216, width: 500, height: 25 }, { fontSize: 17, bold: true, color: C.teal, alignment: "center" });
  addBox(slide, { left: 628, top: 201, width: 588, height: 54 }, { fill: C.paleSky, line: C.sky, lineWidth: 1.5 });
  addText(slide, "BCBS: 33 independent, locally operated companies", { left: 648, top: 216, width: 548, height: 25 }, { fontSize: 16.5, bold: true, color: C.navy, alignment: "center" });

  const values = [
    ["Organization / unit", "Public incumbent signal", "Dental data in Snowflake", "Potential ICLO whitespace"],
    ["Delta Dental of Washington", "Dentistry.One", "VALIDATE", "VALIDATE"],
    ["Parts of the Delta ecosystem", "Toothpic / quip (historical)", "VALIDATE", "VALIDATE"],
    ["BCBS Massachusetts", "Teledentistry.com; Toothpic (historical)", "VALIDATE", "VALIDATE"],
  ];
  const table = slide.tables.add({
    rows: 4, columns: 4, left: 64, top: 282, width: 1152, height: 274,
    columnWidths: [290, 330, 240, 292], values,
  });
  styleTable(table, 4, 4, C.navy);
  table.cells.block({ row: 1, column: 2, rowCount: 3, columnCount: 2 }).assign({
    fill: C.paleAmber,
    textStyle: { fontFamily: FONT, fontSize: 14, bold: true, color: C.amber },
    margins: { left: 8, right: 8, top: 7, bottom: 7 },
    anchor: "middle",
  });
  addBox(slide, { left: 64, top: 579, width: 1152, height: 66 }, { fill: C.paleCoral, line: C.coral, lineWidth: 1.5 });
  addText(slide, "No Snowflake dental workload is assumed. Public vendor presence does not prove enterprise-wide capability or eliminate ICLO whitespace.", {
    left: 84, top: 596, width: 1112, height: 32,
  }, { fontSize: 16.5, bold: true, color: C.coral, alignment: "center" });

  const note = "Delta Dental은 39개 독립 회사, Blue는 33개 독립·지역 운영 회사 구조다. association 또는 parent 관계만으로 실제 procurement, dental workload, region, vendor 관계를 추정하지 않는다. 공개된 incumbent 사례는 account-specific signal일 뿐이며, 기능 범위와 ICLO whitespace는 diligence question으로 남긴다.";
  const sources = [
    "https://www.deltadental.com/about-us/delta-dental-member-companies/",
    "https://www.deltadental.com/about-us/terms-of-use/",
    "https://www.bcbs.com/about-us/blue-cross-blue-shield-system",
    "https://www.deltadentalwa.com/our-company/community/DentistryOne-Press-Release",
    "https://www.prnewswire.com/news-releases/quip-acquires-teledentistry-company-toothpic-to-become-first-360-degree-oral-health-service-and-improve-dental-care-access-for-over-40-million-people-301528398.html",
    "https://home.bluecrossma.com/collateral/sites/g/files/csphws1571/files/acquiadam-assets/55-003112164_Dental_Blue_Teledentistry.com_Member_Fact_Sheet.pdf",
  ];
  addNotes(slide, note, sources);
  slideData.push({ number: 7, title: "The Opportunity Is Account-Specific - Not Delta or Blue as a Whole", note, sources });
}

// Slide 8
{
  const slide = presentation.slides.add();
  addHeader(slide, "What We Need from Snowflake GTM",
    "We need industry fit, internal coordination and account-path sponsorship - not generic introductions.",
    ["REQUEST TO SNOWFLAKE"], 8);

  const asks = [
    { num: "01", name: "FIT", body: "Which HLS sales play fits naturally: payer claims analytics, benefits navigation, healthtech applications or secure collaboration?" },
    { num: "02", name: "PEOPLE", body: "Name the HLS architect, solution engineer, security/compliance owner and startup/partner lead." },
    { num: "03", name: "ACCOUNTS", body: "Select one payer/TPA account team to validate dental data and unmet need before any introduction." },
    { num: "04", name: "PATH", body: "Provide written credits/support scope and readiness criteria for partner, co-sell and application paths." },
  ];
  asks.forEach((a, i) => {
    const top = 220 + i * 94;
    addBox(slide, { left: 64, top, width: 1152, height: 72 }, { fill: i % 2 ? C.lighter : C.white, line: C.line, lineWidth: 1 });
    addBox(slide, { left: 64, top, width: 8, height: 72 }, { geometry: "rect", fill: C.sky, line: C.sky, lineWidth: 0, borderRadius: 0 });
    addText(slide, a.num, { left: 92, top: top + 17, width: 50, height: 30 }, { fontSize: 22, bold: true, color: C.sky });
    addText(slide, a.name, { left: 160, top: top + 19, width: 130, height: 26 }, { fontSize: 18, bold: true, color: C.navy });
    addText(slide, a.body, { left: 308, top: top + 16, width: 876, height: 44 }, { fontSize: 16.5, color: C.ink });
  });
  addBox(slide, { left: 64, top: 613, width: 1152, height: 42 }, { fill: C.paleCoral, line: C.coral, lineWidth: 1 });
  addText(slide, "Not asking Snowflake for: legal opinions, compliance certification, generic customer introductions or a savings guarantee.", {
    left: 80, top: 623, width: 1120, height: 22,
  }, { fontSize: 15, bold: true, color: C.coral, alignment: "center" });

  const note = "GTM specialist에게 구현을 맡기는 것이 아니라 industry fit, 내부 조정과 account-path sponsorship을 요청한다. 특히 '고객 소개'를 먼저 요구하지 않는다. 한 payer/TPA account team이 dental eligibility 또는 claim-line data의 실재, architecture 적합성과 unmet need를 확인하는 순서를 요청한다.";
  const sources = [internalReport, "https://www.snowflake.com/en/why-snowflake/startup-program/", "https://www.snowflake.com/en/why-snowflake/startup-program/startup-accelerator/", "https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about"];
  addNotes(slide, note, sources);
  slideData.push({ number: 8, title: "What We Need from Snowflake GTM", note, sources });
}

// Slide 9
{
  const slide = presentation.slides.add();
  addHeader(slide, "A 90-Day Joint Validation Plan",
    "The outcome is a validated architecture and one account-team use-case review, not a co-sell commitment.",
    ["REQUEST TO SNOWFLAKE"], 9);

  const stages = [
    { time: "DAYS 0-30", title: "ALIGN", body: "Sales play\nNamed stakeholders\nU.S. account / region / BAA path\nArchitecture workshop", color: C.teal, fill: C.paleTeal },
    { time: "DAYS 31-60", title: "DESIGN", body: "Ingestion pattern\n2.5K / 10K / 25K sizing\nSecurity reference\nAccount matrix v1", color: C.sky, fill: C.paleSky },
    { time: "DAYS 61-90", title: "VALIDATE", body: "One payer/TPA account-team review\nPartner checklist\nNext / no-go decision", color: C.coral, fill: C.paleCoral },
    { time: "CONDITIONAL", title: "EXPAND", body: "Native App\nMulti-party Clean Room\nFederated learning\nJoint story / design partner", color: C.amber, fill: C.paleAmber },
  ];
  const nodes = stages.map((s, i) => addBox(slide, { left: 64 + i * 291, top: 218, width: 252, height: 226 }, { fill: s.fill, line: s.color, lineWidth: 2 }));
  for (let i = 0; i < nodes.length - 1; i += 1) connect(slide, nodes[i], nodes[i + 1], { color: C.muted, width: 2 });
  stages.forEach((s, i) => {
    const left = 64 + i * 291;
    addText(slide, s.time, { left: left + 18, top: 239, width: 216, height: 22 }, { fontSize: 12, bold: true, color: s.color });
    addText(slide, s.title, { left: left + 18, top: 274, width: 216, height: 30 }, { fontSize: 22, bold: true, color: C.navy });
    addText(slide, s.body, { left: left + 18, top: 322, width: 216, height: 104 }, { fontSize: 15, color: C.muted });
  });
  addBox(slide, { left: 64, top: 482, width: 1152, height: 158 }, { fill: C.navy, line: C.navy, lineWidth: 0 });
  addText(slide, "We are not asking Snowflake to validate our dental AI or make ICLO compliant. We are asking Snowflake to help us determine whether this can become a repeatable, governed payer/TPA data-collaboration pattern—and what ICLO must prove to make that partnership commercially real.", {
    left: 96, top: 516, width: 1088, height: 90,
  }, { fontSize: 18, bold: true, color: C.white, alignment: "center" });

  const note = "90일 후 남아야 하는 것은 소개 약속이 아니라 reference architecture, sizing, account matrix, one-account validation과 partner criteria다. Native App, Clean Room, federated learning과 공동 발표는 핵심 ingestion·governance 패턴과 고객 증거가 확인된 뒤에만 검토한다.";
  const sources = [internalReport, "https://docs.snowflake.com/en/user-guide/data-sharing-intro", "https://docs.snowflake.com/en/user-guide/cleanrooms/introduction", "https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about"];
  addNotes(slide, note, sources);
  slideData.push({ number: 9, title: "A 90-Day Joint Validation Plan", note, sources });
}

// Appendix A
{
  const slide = presentation.slides.add();
  addHeader(slide, "Data and Responsibility Matrix",
    "Platform responsibility, operating responsibility and legal judgment remain separate.",
    ["ICLO PRODUCT DESIGN PRINCIPLE", "REQUEST TO SNOWFLAKE"], 10, true);
  const values = [
    ["Domain", "ICLO", "Employer / TPA / partner", "Snowflake", "Outside Snowflake scope"],
    ["Employee navigation", "Product, events, consent UX", "Employee action; operational support", "Govern event data by purpose", "Licensure / referral-law analysis"],
    ["Eligibility + plan + network", "Map and use context", "Provide under contract", "Canonical model + reconciliation", "Data-rights determination"],
    ["Claims + outcomes", "Attribution logic", "Claims, run-out, completion", "Aggregate calculation + access", "Savings validation"],
    ["Raw images + models", "Vault, inference, validation", "Clinical role as applicable", "URI + metadata + approved signal", "Model endpoint validation"],
    ["Governance + compliance", "App controls + incident operations", "Source-system controls", "RBAC, masking, row policy, history", "ICLO-wide compliance conclusion"],
  ];
  const table = slide.tables.add({
    rows: 6, columns: 5, left: 64, top: 205, width: 1152, height: 430,
    columnWidths: [168, 214, 250, 252, 268], values,
  });
  styleTable(table, 6, 5, C.teal, { headerFontSize: 11, bodyFontSize: 10.5, margin: 2 });
  table.cells.block({ row: 1, column: 4, rowCount: 5, columnCount: 1 }).assign({
    fill: C.paleCoral,
    textStyle: { fontFamily: FONT, fontSize: 10.5, bold: true, color: C.coral },
    margins: { left: 8, right: 8, top: 2, bottom: 2 },
    anchor: "middle",
  });
  const note = "ICLO, employer/TPA/clinical partner, Snowflake, 외부 법률·규제 자문의 책임을 분리한다. Snowflake에 FDA status, consent sufficiency, data rights 또는 ICLO incident response 전체를 요구하지 않는다.";
  const sources = [internalReport, "https://docs.snowflake.com/en/user-guide/intro-editions", "https://docs.snowflake.com/en/user-guide/security-row-intro"];
  addNotes(slide, note, sources);
  slideData.push({ number: 10, title: "Data and Responsibility Matrix", note, sources });
}

// Appendix B
{
  const slide = presentation.slides.add();
  addHeader(slide, "Detailed Snowflake Technical Questions",
    "Resolve the pilot pattern first; treat application packaging and multi-party ML as conditional.",
    ["REQUEST TO SNOWFLAKE"], 11, true);

  addText(slide, "PRIORITY NOW", { left: 64, top: 209, width: 220, height: 25 }, { fontSize: 16, bold: true, color: C.teal });
  const priority = [
    "What is the practical U.S. account, cloud/region, Business Critical and BAA path?",
    "When should we use same-region Direct Share versus controlled SFTP/API staging?",
    "What tenancy, purpose-access, masking, row-policy and access-history pattern do you recommend?",
    "How should we size 2.5K / 10K / 25K populations and measure post-credit unit economics?",
    "What must ICLO prove for startup, partner, Powered by Snowflake or co-sell readiness?",
  ];
  priority.forEach((text, i) => {
    addDot(slide, 64, 250 + i * 70, i + 1, C.teal);
    addText(slide, text, { left: 108, top: 250 + i * 70, width: 520, height: 52 }, { fontSize: 15.5, color: C.ink });
  });

  addBox(slide, { left: 660, top: 202, width: 556, height: 430 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1.5 });
  addText(slide, "CONDITIONAL / LATER", { left: 686, top: 222, width: 250, height: 25 }, { fontSize: 16, bold: true, color: C.amber });
  addText(slide, "Native App", { left: 686, top: 270, width: 160, height: 24 }, { fontSize: 17, bold: true, color: C.navy });
  addText(slide, "When does customer-account execution create repeatability beyond a connector pattern?", { left: 686, top: 302, width: 500, height: 46 }, { fontSize: 15, color: C.muted });
  addText(slide, "Clean Room", { left: 686, top: 365, width: 160, height: 24 }, { fontSize: 17, bold: true, color: C.navy });
  addText(slide, "What real multi-party payer / TPA / employer collaboration would justify it?", { left: 686, top: 397, width: 500, height: 40 }, { fontSize: 15, color: C.muted });
  addText(slide, "Federated learning", { left: 686, top: 458, width: 200, height: 24 }, { fontSize: 17, bold: true, color: C.navy });
  addText(slide, "Does this mean true local training and parameter aggregation, or collaborative ML inside a Clean Room, Native App or customer-account execution pattern?", {
    left: 686, top: 490, width: 500, height: 92,
  }, { fontSize: 15, color: C.muted });
  addText(slide, "Not required for the first employer pilot.", { left: 686, top: 590, width: 500, height: 24 }, { fontSize: 14, bold: true, color: C.amber });

  const note = "현재 pilot의 우선순위는 ingestion, canonical data, aggregate views와 반복 가능한 TPA integration이다. Clean Room은 단일 employer/TPA pilot의 기본 구조가 아니며, federated learning도 복수 기관의 이미지 데이터 파트너가 생긴 뒤 검토할 future option이다. 정확한 질문: When Snowflake refers to federated learning for this use case, does it mean true local model training and parameter aggregation across institutions, or collaborative ML inside a Snowflake-controlled environment such as a Clean Room, Native App or customer-account execution pattern?";
  const sources = [
    "https://docs.snowflake.com/en/user-guide/intro-editions",
    "https://docs.snowflake.com/en/user-guide/data-sharing-intro",
    "https://docs.snowflake.com/en/user-guide/secure-data-sharing-across-regions-plaforms.html",
    "https://docs.snowflake.com/en/user-guide/cleanrooms/introduction",
    "https://docs.snowflake.com/en/developer-guide/native-apps/native-apps-about",
    "https://docs.snowflake.com/en/user-guide/cost-controlling",
  ];
  addNotes(slide, note, sources);
  slideData.push({ number: 11, title: "Detailed Snowflake Technical Questions", note, sources });
}

// Appendix C
{
  const slide = presentation.slides.add();
  addHeader(slide, "Employer J-Curve Simulation - Inputs and Outputs",
    "A governed planning heuristic should expose assumptions, scenario versions and uncertainty.",
    ["HYPOTHESIS / TO BE VALIDATED"], 12, true);

  const inputs = [
    { title: "POPULATION", body: "Employee/dependent age distribution\nTurnover + average tenure", color: C.navy, fill: C.paleNavy },
    { title: "ACCESS", body: "Workforce geography\nNetwork overlap + provider availability", color: C.sky, fill: C.paleSky },
    { title: "PLAN", body: "Plan design + annual maximum\nEmployer contribution + paid/OOP split", color: C.coral, fill: C.paleCoral },
    { title: "BASELINE + TIMING", body: "Utilization + historical claims\nUntreated need/incidence + run-out", color: C.amber, fill: C.paleAmber },
  ];
  inputs.forEach((item, i) => {
    const top = 216 + i * 96;
    addBox(slide, { left: 64, top, width: 450, height: 78 }, { fill: item.fill, line: item.color, lineWidth: 1.5 });
    addText(slide, item.title, { left: 82, top: top + 12, width: 160, height: 20 }, { fontSize: 13, bold: true, color: item.color });
    addText(slide, item.body, { left: 240, top: top + 10, width: 252, height: 56 }, { fontSize: 14.5, color: C.ink });
  });
  const model = addBox(slide, { left: 558, top: 326, width: 214, height: 146 }, { fill: C.navy, line: C.navy, lineWidth: 0 });
  addText(slide, "GOVERNED\nSCENARIO MODEL", { left: 578, top: 352, width: 174, height: 55 }, { fontSize: 20, bold: true, color: C.white, alignment: "center" });
  addText(slide, "Lineage + version + uncertainty", { left: 578, top: 423, width: 174, height: 32 }, { fontSize: 13.5, color: "#D9E2F0", alignment: "center" });
  const leftNode = addBox(slide, { left: 524, top: 376, width: 10, height: 10 }, { geometry: "ellipse", fill: C.white, line: C.white, lineWidth: 0, borderRadius: 0 });
  connect(slide, leftNode, model, { fromSide: "right", toSide: "left", color: C.muted, width: 2 });
  const output = addBox(slide, { left: 816, top: 216, width: 400, height: 398 }, { fill: C.paleTeal, line: C.teal, lineWidth: 2 });
  connect(slide, model, output, { color: C.teal, width: 2 });
  addText(slide, "OUTPUTS", { left: 842, top: 239, width: 180, height: 24 }, { fontSize: 16, bold: true, color: C.teal });
  const outputs = [
    "Preventive utilization increase",
    "Newly discovered treatment spend",
    "Allowed / plan-paid / employee OOP separation",
    "Year 1 / Year 2 / Year 3 scenarios",
    "Turnover sensitivity",
    "Network-access sensitivity",
    "Expected data uncertainty",
  ];
  outputs.forEach((o, i) => {
    addBox(slide, { left: 842, top: 285 + i * 41, width: 8, height: 8 }, { geometry: "ellipse", fill: C.teal, line: C.teal, lineWidth: 0, borderRadius: 0 });
    addText(slide, o, { left: 864, top: 278 + i * 41, width: 320, height: 28 }, { fontSize: 15, color: C.ink });
  });
  addBox(slide, { left: 64, top: 632, width: 1152, height: 32 }, { fill: C.paleAmber, line: C.amber, lineWidth: 1 });
  addText(slide, "Planning heuristic - calibrate with customer data; not an ICLO outcome.", { left: 80, top: 640, width: 1120, height: 18 }, { fontSize: 14, bold: true, color: C.amber, alignment: "center" });

  const note = "시뮬레이션은 고객별 planning heuristic이다. 초기 내부 가정이나 고정 상승률을 외부 예측으로 쓰지 않는다. Snowflake에서 입력 lineage, scenario version, uncertainty와 claims run-out을 추적하는 분석 use case로 제안한다.";
  const sources = [internalEmail, internalReport];
  addNotes(slide, note, sources);
  slideData.push({ number: 12, title: "Employer J-Curve Simulation - Inputs and Outputs", note, sources });
}

// Appendix D
{
  const slide = presentation.slides.add();
  addHeader(slide, "Named-Account Diligence Template",
    "Replace market-level assumptions with legal-entity, workload and readiness evidence.",
    ["REQUEST TO SNOWFLAKE"], 13, true);

  addText(slide, "ACCOUNT IDENTITY + DATA", { left: 64, top: 205, width: 300, height: 24 }, { fontSize: 15, bold: true, color: C.teal });
  const identityValues = [
    ["Organization / legal entity", "Account type", "Self-funded dental admin?", "Dental eligibility in Snowflake?", "Claim-line data in Snowflake?", "Cloud / region"],
    ["", "", "", "", "", ""],
    ["", "", "", "", "", ""],
  ];
  const identityTable = slide.tables.add({
    rows: 3, columns: 6, left: 64, top: 238, width: 1152, height: 168,
    columnWidths: [230, 170, 180, 210, 210, 152], values: identityValues,
  });
  styleTable(identityTable, 3, 6, C.teal, { headerFontSize: 12.5, bodyFontSize: 11.5, margin: 4 });

  addText(slide, "COMMERCIAL + TECHNICAL READINESS", { left: 64, top: 438, width: 360, height: 24 }, { fontSize: 15, bold: true, color: C.sky });
  const readinessValues = [
    ["Current navigation / teledentistry vendor", "Potential ICLO whitespace", "Snowflake account owner", "Technical validation ready?", "Customer introduction ready?"],
    ["", "", "", "", ""],
  ];
  const readinessTable = slide.tables.add({
    rows: 2, columns: 5, left: 64, top: 471, width: 1152, height: 132,
    columnWidths: [260, 246, 210, 218, 218], values: readinessValues,
  });
  styleTable(readinessTable, 2, 5, C.sky, { headerFontSize: 12.5, bodyFontSize: 11.5, margin: 4 });
  addText(slide, "No statement that 'many TPAs are on Snowflake' should be used before this matrix contains account evidence.", {
    left: 64, top: 642, width: 1152, height: 24,
  }, { fontSize: 14, bold: true, color: C.coral, alignment: "center" });

  const note = "'Snowflake 고객인 TPA가 많다'는 추정 대신 account evidence를 쌓는 템플릿이다. 데이터 실재와 기술 검증 준비도가 먼저이며 customer introduction readiness는 별도 필드로 둔다.";
  const sources = [internalReport, "https://www.deltadental.com/about-us/delta-dental-member-companies/", "https://www.bcbs.com/about-us/blue-cross-blue-shield-system"];
  addNotes(slide, note, sources);
  slideData.push({ number: 13, title: "Named-Account Diligence Template", note, sources });
}

const meetingPack = {
  openingStatement: `ICLO is building an employee dental-benefit navigation and claims-verified evidence layer.

In the front, we help employees understand eligibility, plan rules and network context; prepare for care; and request provider search or appointment support. Oral-image capture is optional, and early model outputs remain in shadow mode. They do not automatically determine urgency, provider choice or treatment pathways.

In the back, we connect that employee journey to eligibility and dental claims so an employer can see aggregate, claims-confirmed evidence - not individual health information. We separate allowed, plan-paid and employee out-of-pocket amounts, and we are deliberately not promising year-one savings. Utilization and plan-paid claims may rise before any longer-term treatment-mix change becomes measurable.

We believe Snowflake could be the governed evidence and collaboration plane behind this workflow: structured eligibility, plan context, app events and claims in Snowflake; raw oral images in separate controlled U.S. storage; and aggregate employer views governed by purpose and role.

Today we are asking for three things: agreement on the most natural HLS sales play, a sponsored technical working session, and an account-by-account path to determine whether a payer or TPA actually holds dental eligibility or claim-line data in Snowflake. We are not asking for generic customer introductions. We want to learn what ICLO must prove before an account team or partner program would support us.`,
  agenda: [
    ["0-5 min", "Opening and desired decisions", "Confirm the three meeting outcomes and participant roles."],
    ["5-12 min", "Business fit", "Place ICLO in the most natural HLS sales play; test application vs evidence-layer framing."],
    ["12-20 min", "Account ecosystem", "Separate employer, carrier-ASO and TPA roles; define account evidence before introductions."],
    ["20-32 min", "Architecture", "Review ingestion, image boundary, canonical model, aggregate output and platform prerequisites."],
    ["32-40 min", "Partnership path", "Compare startup, partner, Powered by Snowflake and potential Native App routes."],
    ["40-45 min", "Next actions", "Assign named owners and due dates; confirm workshop and one account-team validation candidate."],
  ],
  actions: [
    ["Confirm HLS sales play and named internal stakeholders", "HLS GTM specialist", "Jangwoo Kim / Strategy", "D+2 business days", "Written sales-play recommendation and stakeholder map"],
    ["Schedule technical architecture working session", "Named HLS architect + solution engineer", "ICLO Product / Data lead", "D+5 business days", "Calendar invite, attendee list and input checklist"],
    ["Confirm U.S. account, region, Business Critical, BAA and credit/support path", "SE + security/compliance + startup lead", "ICLO Operations / Security", "D+10 business days", "Written decision path, dependencies and support scope"],
    ["Run 2.5K / 10K / 25K employee workload sizing", "Solution engineer", "ICLO Data lead", "D+15 business days", "Assumptions, architecture, credit range and post-credit unit economics"],
    ["Recommend tenancy, security and data-transfer decision pattern", "HLS architect + security/compliance owner", "ICLO Product / Security", "D+15 business days", "Reference architecture; same-region share versus controlled SFTP/API decision tree"],
    ["Build named-account matrix v1", "HLS GTM + relevant account owners", "ICLO GTM lead", "D+20 business days", "Account-level data/workload evidence and readiness status"],
    ["Select one payer or TPA account-team validation", "HLS GTM specialist", "Jangwoo Kim / Strategy", "D+30 business days", "Technical/use-case validation readout; no introduction commitment required"],
    ["Provide partner-path and co-sell readiness criteria", "Startup / Partner / ISV lead", "ICLO Strategy + Product", "D+30 business days", "Checklist for startup, SPN, Powered by Snowflake and Native App options"],
    ["Decide whether Snowflake employee benefits merits design-partner diligence", "HLS GTM + relevant benefits stakeholder", "ICLO Strategy", "Conditional after architecture review", "Fit / no-fit memo based on funding structure and data-rights verification"],
  ],
  selfReview: [
    "ICLO does not appear as another teledentistry app.",
    "Snowflake's role is more specific than database hosting.",
    "Employer, TPA, carrier and employee roles are separated.",
    "No first-year savings promise is made.",
    "Turnover and the J-curve connect to a Snowflake analytics use case.",
    "Raw images and structured claims are separated.",
    "Business Critical is not presented as automatic HIPAA compliance.",
    "Federated learning is a conditional future option.",
    "Delta Dental and Blue are not treated as single accounts.",
    "Incumbent presence and whitespace diligence remain separate.",
    "Snowflake GTM asks are feasible sponsor, coordination, evidence and path questions.",
    "Named owners and required outputs are designed into the close.",
  ],
};

await fs.mkdir(path.dirname(FINAL), { recursive: true });
await fs.mkdir(path.join(TMP, "rendered"), { recursive: true });

for (const [index, slide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.layout.json`), await layout.text());
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(TMP, "rendered", "deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const inspect = await presentation.inspect({ kind: "slide,textbox,shape,image,table,chart,notes", maxChars: 60000 });
await fs.writeFile(path.join(TMP, "rendered", "deck-inspect.txt"), inspect.ndjson);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(FINAL);
await fs.writeFile(path.join(TMP, "notes-data.txt"), JSON.stringify({ slides: slideData, meetingPack }, null, 2));

const meetingPackPath = path.join(ROOT, "output/ICLO-Snowflake-HLS-Meeting-Pack-v2.md");
const agendaRows = meetingPack.agenda.map((row) => `| ${row.join(" | ")} |`).join("\n");
const immediateActionRows = meetingPack.actions.slice(0, 5).map((row) => `| ${row.join(" | ")} |`).join("\n");
const nextActionRows = meetingPack.actions.slice(5).map((row) => `| ${row.join(" | ")} |`).join("\n");
const reviewRows = meetingPack.selfReview.map((item) => `| Yes | ${item} |`).join("\n");
const meetingPackMarkdown = `# ICLO × Snowflake HLS Meeting Pack\n\n` +
`External proposal companion · discussion material\n\n` +
`## 90-second opening statement\n\n${meetingPack.openingStatement}\n\n` +
`## 45-minute meeting agenda\n\n` +
`| Time | Topic | Intended outcome |\n|---|---|---|\n${agendaRows}\n\n` +
`## Action register — Immediate\n\n` +
`| Action | Snowflake owner | ICLO owner | Due date | Required output |\n|---|---|---|---|---|\n${immediateActionRows}\n\n` +
`<div style="break-before: page"></div>\n\n` +
`## Action register — Next / Conditional\n\n` +
`| Action | Snowflake owner | ICLO owner | Due date | Required output |\n|---|---|---|---|---|\n${nextActionRows}\n\n` +
`## Optional design-partner question\n\nWould Snowflake's own employee-benefits organization be relevant as a design-partner candidate, subject to funding structure and data-rights verification? This is an optional diligence question, not an assumption about fit.\n\n` +
`<div style="break-before: page"></div>\n\n` +
`## Internal review notes / 내부 검토 메모\n\n- 외부 대화에서는 Snowflake에 법률·FDA·HIPAA 최종 판단을 요구하지 않는다.\n- Business Critical과 적절한 BAA는 Snowflake 내 PHI 처리의 플랫폼 전제이며 ICLO 전체의 HIPAA 준수를 자동 완성하지 않는다.\n- 고객 소개보다 sales-play fit, architecture decision support, named-account evidence와 readiness criteria를 먼저 남긴다.\n- Native App, Clean Room, federated learning은 현재 employer pilot의 필수 조건이 아니다.\n\n` +
`<div style="break-before: page"></div>\n\n` +
`## Self-review\n\n| Result | Check |\n|---|---|\n${reviewRows}\n`;
await fs.writeFile(meetingPackPath, meetingPackMarkdown);

console.log(`Created ${FINAL}`);
console.log(`Created ${meetingPackPath}`);
console.log(`Slides: ${presentation.slides.items.length}`);
