import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const TMP = path.join(ROOT, "tmp/iclo-ceo-review-v1");
const FINAL = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-CEO-Review-Discussion-v2.pptx");
const W = 1280;
const H = 720;
const FONT = "Noto Sans KR";
const C = {
  ink: "#12243A",
  ink2: "#24364C",
  muted: "#5E6A75",
  teal: "#55C5C8",
  tealDark: "#167D82",
  pale: "#E8F7F7",
  paper: "#F5F7F6",
  line: "#D7DEDF",
  white: "#FFFFFF",
  warning: "#D7922C",
  rose: "#A94A55",
  paleRose: "#F9ECEE",
};

const GUIDE = "/Users/jk0307/Downloads/[스타트업 프로그램 코호트사용] 260827 Snowflake World Tour - Seoul - Startup Village Guide Deck (1).pdf";
const LOOP_PDF = path.join(ROOT, "output/pdf/ICLO-Snowflake-World-Tour-Booth-Loop-Bilingual-v1.pdf");
const LOOP_PPTX = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Booth-Loop-Bilingual-v1.pptx");
const WALL = path.join(ROOT, "output/booth/ICLO-Snowflake-World-Tour-Backwall-850x300mm-Bilingual-v1.png");
const PHOTO = path.join(ROOT, "output/imagegen/ICLO-World-Tour-Photoreal-Collaboration-v1.png");
const LOGO = path.join(ROOT, "output/booth/ICLO-Logo-Color-Transparent.png");
const SNOWFLAKE_LOCKUP = path.join(ROOT, "tmp/iclo-world-tour-v1/brand/snowflake-world-tour-lockup.png");
const SLIDE_1 = path.join(ROOT, "tmp/iclo-world-tour-v1/rendered/slide-01.png");
const SLIDE_4 = path.join(ROOT, "tmp/iclo-world-tour-v1/rendered/slide-04.png");
const SLIDE_7 = path.join(ROOT, "tmp/iclo-world-tour-v1/rendered/slide-07.png");
const GUIDE_BOOTH = path.join(TMP, "assets/guide-booth-layout.png");
const HOMEDEN_LOGO = path.join(TMP, "homeden-assets/홈덴로고-removebg-preview.png");
const HOMEDEN_PMS = path.join(TMP, "assets/homeden-pms-ui.png");
const HOMEDEN_EMR = path.join(TMP, "assets/homeden-emr-ui2.png");
const HOMEDEN_CRM = path.join(TMP, "assets/homeden-crm-ui.png");

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
    fontSize: options.fontSize ?? 18,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "left",
    italic: options.italic ?? false,
  };
  return shape;
}

function addBox(slide, position, options = {}) {
  const geometry = options.geometry ?? "rect";
  const config = {
    geometry,
    position,
    fill: options.fill ?? C.white,
    line: { style: options.lineStyle ?? "solid", fill: options.line ?? "none", width: options.lineWidth ?? 0 },
  };
  if (geometry === "roundRect") config.borderRadius = "rounded-sm";
  return slide.shapes.add(config);
}

function addRule(slide, x, y, width, color = C.line, height = 1) {
  return addBox(slide, { left: x, top: y, width, height }, { fill: color, line: color });
}

function addImage(slide, blob, position, alt, fit = "cover") {
  return slide.images.add({ blob, contentType: "image/png", alt, fit, position, geometry: "rect" });
}

function addLogo(slide, logo, snowflake, dark = false) {
  addImage(slide, logo, { left: 897, top: 26, width: 92, height: 34 }, "ICLO logo", "contain");
  addText(slide, "×", { left: 997, top: 30, width: 28, height: 28 }, { fontSize: 18, bold: true, color: dark ? C.white : C.muted, alignment: "center" });
  addImage(slide, snowflake, { left: 1032, top: 24, width: 192, height: 38 }, "Snowflake World Tour logo", "contain");
  if (dark) addText(slide, "INTERNAL", { left: 1010, top: 76, width: 210, height: 20 }, { fontSize: 10.5, bold: true, color: "#B6C4CE", alignment: "right" });
}

function addFooter(slide, number, dark = false) {
  addRule(slide, 48, 682, 1184, dark ? "#33485D" : C.line, 1);
  addText(slide, "ICLO · CEO REVIEW DISCUSSION · INTERNAL", { left: 48, top: 691, width: 420, height: 18 }, { fontSize: 10.5, color: dark ? "#B6C4CE" : C.muted });
  addText(slide, String(number).padStart(2, "0"), { left: 1178, top: 691, width: 54, height: 18 }, { fontSize: 10.5, color: dark ? "#B6C4CE" : C.muted, alignment: "right" });
}

function addHeader(slide, title, number, options = {}) {
  const dark = options.dark ?? false;
  slide.background.fill = dark ? C.ink : options.background ?? C.white;
  addText(slide, title, { left: 54, top: 52, width: 820, height: options.titleHeight ?? 92 }, { fontSize: options.fontSize ?? 35, bold: true, color: dark ? C.white : C.ink });
  if (options.subtitle) addText(slide, options.subtitle, { left: 56, top: options.subtitleTop ?? 142, width: 960, height: 38 }, { fontSize: 17, color: dark ? "#C4D0D9" : C.muted });
  addLogo(slide, options.logo, options.snowflake, dark);
  addRule(slide, 54, options.ruleTop ?? 181, 1172, dark ? "#33485D" : C.line, 1);
  addRule(slide, 54, options.ruleTop ?? 181, 108, C.teal, 4);
  addFooter(slide, number, dark);
}

function addNotes(slide, note, sources = []) {
  const sourceLines = sources.map((s) => `- ${s}`).join("\n");
  slide.speakerNotes.textFrame.setText(`${note}\n\n[Sources]\n${sourceLines}`);
  slide.speakerNotes.setVisible(true);
}

async function bytes(p) {
  const b = await fs.readFile(p);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

const logo = await bytes(LOGO);
const snowflake = await bytes(SNOWFLAKE_LOCKUP);
const photo = await bytes(PHOTO);
const wall = await bytes(WALL);
const slide1 = await bytes(SLIDE_1);
const slide4 = await bytes(SLIDE_4);
const slide7 = await bytes(SLIDE_7);
const guideBooth = await bytes(GUIDE_BOOTH);
const homedenLogo = await bytes(HOMEDEN_LOGO);
const homedenPms = await bytes(HOMEDEN_PMS);
const homedenEmr = await bytes(HOMEDEN_EMR);
const homedenCrm = await bytes(HOMEDEN_CRM);
const deck = Presentation.create({ slideSize: { width: W, height: H } });

// 1. Cover and review request
{
  const slide = deck.slides.add();
  slide.background.fill = C.ink;
  addBox(slide, { left: 0, top: 0, width: 690, height: H }, { fill: C.ink });
  addImage(slide, photo, { left: 690, top: 0, width: 590, height: H }, "Photoreal collaboration scene for the booth review");
  addBox(slide, { left: 0, top: 0, width: 12, height: H }, { fill: C.teal });
  addImage(slide, logo, { left: 62, top: 50, width: 150, height: 55 }, "ICLO logo", "contain");
  addText(slide, "×", { left: 224, top: 60, width: 30, height: 30 }, { fontSize: 20, bold: true, color: C.white, alignment: "center" });
  addImage(slide, snowflake, { left: 270, top: 47, width: 286, height: 56 }, "Snowflake World Tour logo", "contain");
  addText(slide, "INTERNAL DISCUSSION MATERIAL", { left: 64, top: 145, width: 420, height: 22 }, { fontSize: 12, bold: true, color: C.teal });
  addText(slide, "Snowflake World Tour Seoul\n부스안 CEO 검토 요청", { left: 58, top: 192, width: 570, height: 160 }, { fontSize: 48, bold: true, color: C.white });
  addText(slide, "메시지 · 표현 수위 · CTA 승인", { left: 64, top: 382, width: 540, height: 34 }, { fontSize: 23, bold: true, color: "#D6E0E7" });
  addRule(slide, 64, 456, 104, C.teal, 5);
  addText(slide, "권장안", { left: 64, top: 492, width: 120, height: 25 }, { fontSize: 15, bold: true, color: C.teal });
  addText(slide, "‘MAKE DENTAL BENEFITS EASIER TO USE.’를 전면에 두고,\n한국어는 ‘직원이 치과 혜택을 제대로 누리도록.’으로 보조합니다.", { left: 64, top: 530, width: 570, height: 76 }, { fontSize: 18, bold: true, color: C.white });
  addText(slide, "2026.08.05 · 내부 검토용", { left: 64, top: 654, width: 300, height: 22 }, { fontSize: 12, color: "#AAB9C5" });
  addNotes(slide, "대표에게 부스 디자인 취향을 묻는 자료가 아니라, 시장에 어떤 ICLO를 보여줄지 네 가지 결정을 요청하는 자료다. 권장안은 employee benefits navigation과 claims-verified evidence를 lead positioning으로 두는 것이다.", [GUIDE, LOOP_PPTX, PHOTO]);
}

// 2. Review frame
{
  const slide = deck.slides.add();
  addHeader(slide, "공통 베이스라인을 지킨 채, A/B 중 어떤 대화를 부스 전면에 둘지 결정합니다.", 2, { logo, snowflake, titleHeight: 92, ruleTop: 160 });
  const items = [
    ["1", "공통 메시지", "Employee benefits를 lead로 두고 dental AI는 보조 역량으로 설명"],
    ["2", "A안", "Snowflake 기반 governed evidence와 data collaboration을 부스 전면에 배치"],
    ["3", "B안", "HomeDen PMS·EMR·CRM을 보험상품·인수·예방·심사 workflow와 연결"],
    ["4", "현장 운영", "메인 wall·loop와 보험사 심화 대화를 같은 화면에 섞을지 분리할지 결정"],
    ["5", "표현 경계", "선정은 확정 사실, 보험 인수·심사 모델은 검증할 hypothesis로 구분"],
  ];
  items.forEach(([num, title, body], i) => {
    const top = 190 + i * 73;
    addText(slide, num, { left: 60, top: top + 9, width: 56, height: 44 }, { fontSize: 30, bold: true, color: C.tealDark, alignment: "center" });
    addText(slide, title, { left: 136, top: top + 7, width: 184, height: 34 }, { fontSize: 23, bold: true });
    addText(slide, body, { left: 330, top: top + 7, width: 615, height: 48 }, { fontSize: 16.5, color: C.ink2 });
    addRule(slide, 60, top + 60, 885, C.line, 1);
  });
  addBox(slide, { left: 985, top: 203, width: 238, height: 374 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  addText(slide, "가이드상 고정 조건", { left: 1008, top: 228, width: 192, height: 30 }, { fontSize: 20, bold: true });
  addRule(slide, 1008, 276, 64, C.teal, 4);
  const facts = ["40″ · 16:9 display", "Backwall 850 × 300mm", "Promo video ≤ 2 min", "Lead scanner 미제공"];
  facts.forEach((f, i) => addText(slide, f, { left: 1008, top: 315 + i * 55, width: 192, height: 34 }, { fontSize: 16.5, bold: i === 3, color: i === 3 ? C.rose : C.ink2 }));
  addText(slide, "제안: 8/7 CEO 승인\n8/10 백월 제출", { left: 985, top: 607, width: 238, height: 54 }, { fontSize: 16, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "A와 B는 그래픽 취향이 아니라 현장에서 시작할 대화의 차이다. A는 행사 적합성과 확장성이 높고, B는 보험사 방문객에게 차별화가 강하지만 검증 전 가설이 더 많다. 행사 물리 규격과 제출 조건은 공통이다.", [GUIDE]);
}

// 3. Positioning choice
{
  const slide = deck.slides.add();
  addHeader(slide, "권장 포지셔닝은 employee benefits를 앞에, dental AI를 뒤에 둡니다.", 3, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  const cols = { option: 60, message: 190, understand: 480, tradeoff: 835 };
  addText(slide, "선택지", { left: cols.option, top: 176, width: 100, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "Lead copy", { left: cols.message, top: 176, width: 255, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "방문자가 이해하는 ICLO", { left: cols.understand, top: 176, width: 310, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "효과와 리스크", { left: cols.tradeoff, top: 176, width: 370, height: 24 }, { fontSize: 14, bold: true, color: C.muted });

  const rows = [
    { top: 213, h: 128, key: "A", fill: C.pale, line: C.teal, message: "MAKE DENTAL BENEFITS\nEASIER TO USE.", understand: "직원의 benefit navigation과\n회사의 claims-verified evidence", tradeoff: "영문을 전면에 두어 행사 맥락과 정합\n한국어는 의미 보조로 사용", rec: "권장" },
    { top: 354, h: 112, key: "B", fill: C.white, line: C.line, message: "스마트폰\n치과 AI", understand: "구강 이미지 분석 스타트업", tradeoff: "데모는 즉시 이해\n‘또 하나의 dental AI’로 보일 위험", rec: "보조" },
    { top: 479, h: 112, key: "C", fill: C.white, line: C.line, message: "금융사 협업\n추진", understand: "오픈이노베이션 참가 기업", tradeoff: "선정 이력은 신뢰를 보강\n제품보다 프로그램이 앞서는 위험", rec: "증거" },
  ];
  rows.forEach((r) => {
    addBox(slide, { left: 52, top: r.top, width: 1175, height: r.h }, { fill: r.fill, line: r.line, lineWidth: r.key === "A" ? 2 : 1 });
    addText(slide, r.key, { left: 72, top: r.top + 33, width: 54, height: 42 }, { fontSize: 30, bold: true, color: r.key === "A" ? C.tealDark : C.muted, alignment: "center" });
    addText(slide, r.message, { left: 190, top: r.top + 22, width: 250, height: 72 }, { fontSize: r.key === "A" ? 20 : 24, bold: true });
    addText(slide, r.understand, { left: 480, top: r.top + 26, width: 310, height: 62 }, { fontSize: 17.5, color: C.ink2 });
    addText(slide, r.tradeoff, { left: 835, top: r.top + 22, width: 300, height: 70 }, { fontSize: 16.5, color: C.ink2 });
    addText(slide, r.rec, { left: 1150, top: r.top + 42, width: 62, height: 28 }, { fontSize: 15.5, bold: true, color: r.key === "A" ? C.tealDark : C.muted, alignment: "center" });
  });
  addText(slide, "CEO 결정 질문: A를 lead positioning으로 승인할까요?", { left: 60, top: 625, width: 1160, height: 34 }, { fontSize: 22, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "A가 권장안이다. B는 실제 제품 역량이지만 부스 첫 문장으로 쓰면 Snowflake 고객사와의 business relevance가 약해진다. C는 신뢰 신호로는 유효하지만 아직 협업 결과가 아니므로 제품 포지셔닝을 대체할 수 없다.", [LOOP_PDF, "User-provided cohort selection confirmation"]);
}

// 4. Visitor journey
{
  const slide = deck.slides.add();
  addHeader(slide, "현재 제작된 56초 루프는 A안—Snowflake collaboration first—에 해당합니다.", 4, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  const phases = [
    { x: 58, w: 190, time: "0–15s", ko: "공감", en: "Benefit friction", color: C.tealDark },
    { x: 248, w: 250, time: "15–31s", ko: "구조", en: "Navigation + evidence", color: C.ink2 },
    { x: 498, w: 190, time: "31–39s", ko: "정직한 경제성", en: "No savings promise", color: C.warning },
    { x: 688, w: 210, time: "39–46s", ko: "신뢰", en: "Selection evidence", color: C.tealDark },
    { x: 898, w: 324, time: "46–56s", ko: "대화 요청", en: "Demo + conversation CTA", color: C.ink },
  ];
  phases.forEach((p) => {
    addBox(slide, { left: p.x, top: 190, width: p.w, height: 116 }, { fill: p.color, line: p.color });
    addText(slide, p.time, { left: p.x + 14, top: 206, width: p.w - 28, height: 22 }, { fontSize: 13, bold: true, color: C.white });
    addText(slide, p.ko, { left: p.x + 14, top: 239, width: p.w - 28, height: 30 }, { fontSize: 21, bold: true, color: C.white });
    addText(slide, p.en, { left: p.x + 14, top: 275, width: p.w - 28, height: 24 }, { fontSize: 12.5, color: "#E0E7EC" });
  });
  const previews = [
    { blob: slide1, x: 60, label: "첫 8초: 직원 문제" },
    { blob: slide4, x: 441, label: "중간: dashboard evidence" },
    { blob: slide7, x: 822, label: "마지막 12초: QR + 대화" },
  ];
  previews.forEach((p) => {
    addBox(slide, { left: p.x, top: 350, width: 350, height: 210 }, { fill: C.white, line: C.line, lineWidth: 1 });
    addImage(slide, p.blob, { left: p.x + 5, top: 355, width: 340, height: 191 }, p.label, "contain");
    addText(slide, p.label, { left: p.x, top: 574, width: 350, height: 24 }, { fontSize: 14.5, bold: true, color: C.muted, alignment: "center" });
  });
  addText(slide, "토론 질문: 대표님이 현장 첫 10초에 강조하고 싶은 것은 ‘복지 사용’입니까, ‘AI 기술’입니까?", { left: 60, top: 625, width: 1160, height: 34 }, { fontSize: 20, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "루프는 56초 무음 MP4로 제작되었다. 첫 화면과 마지막 CTA의 체류시간을 길게 두고, 중간에는 구조와 실제 dashboard proof를 배치했다. 현장에서는 어느 장에서 대화가 시작돼도 전체 논리를 설명할 수 있다.", [LOOP_PDF, path.join(ROOT, "output/booth/ICLO-Snowflake-World-Tour-Booth-Loop-Bilingual-v1.mp4")]);
}

// 5. Claim guardrails
{
  const slide = deck.slides.add();
  addHeader(slide, "외부 문구는 선정·데모·비용·규제의 선을 넘지 않게 통제합니다.", 5, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addText(slide, "외부에서 말할 표현", { left: 310, top: 178, width: 390, height: 30 }, { fontSize: 20, bold: true, color: C.tealDark });
  addText(slide, "말하지 않을 표현", { left: 795, top: 178, width: 390, height: 30 }, { fontSize: 20, bold: true, color: C.rose });
  const guardrails = [
    ["프로그램", "Selected — Fintech Cube 9 · Shinhan Future’s Lab 12\nFinancial collaboration scoping and validation in progress", "신한과 파트너십 체결\n금융사 고객 확보"],
    ["대시보드", "Synthetic data — illustrative only\n분모·기준일·lag·completeness를 보여주는 데모", "ICLO 성과 데이터\n고객 절감 실적"],
    ["경제성", "Year-one utilization과 plan-paid가 오를 수 있음\nNo year-one savings promise", "첫해 비용 절감 보장\n고정 절감률"],
    ["Snowflake / 규제", "Governed evidence plane으로 검증할 구조\nRaw image와 employer aggregate output 분리", "Snowflake가 HIPAA/FDA 대응을 완성\nSnowflake가 ICLO를 보증"],
  ];
  guardrails.forEach(([topic, say, avoid], i) => {
    const top = 222 + i * 98;
    addText(slide, topic, { left: 60, top: top + 12, width: 190, height: 34 }, { fontSize: 20, bold: true });
    addRule(slide, 260, top, 1, C.line, 76);
    addText(slide, say, { left: 310, top: top + 6, width: 410, height: 66 }, { fontSize: 16, color: C.ink2 });
    addRule(slide, 750, top, 1, C.line, 76);
    addText(slide, avoid, { left: 795, top: top + 6, width: 410, height: 66 }, { fontSize: 16, color: C.rose });
    addRule(slide, 60, top + 86, 1150, C.line, 1);
  });
  addBox(slide, { left: 60, top: 625, width: 1150, height: 38 }, { fill: C.pale, line: C.teal, lineWidth: 1 });
  addText(slide, "CEO 결정 질문: 이 표현 경계를 부스 운영팀의 공통 답변 기준으로 승인할까요?", { left: 78, top: 633, width: 1114, height: 24 }, { fontSize: 18, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "선정 이력은 신뢰를 보강하지만 partnership claim으로 확대하지 않는다. Dashboard는 synthetic proof이고, J-curve는 hypothesis다. Snowflake는 data collaboration plane으로 설명하되 ICLO 전체의 HIPAA/FDA 판단이나 보증 주체로 두지 않는다.", [LOOP_PDF, path.join(ROOT, "output/pdf/ICLO-Snowflake-External-Briefing-Addendum-v1.pdf")]);
}

// 6. Visual and spec proof
{
  const slide = deck.slides.add();
  addHeader(slide, "비주얼은 실사와 실제 화면만 사용하고, 기술은 배경으로 남겼습니다.", 6, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addBox(slide, { left: 54, top: 184, width: 870, height: 307 }, { fill: C.white, line: C.line, lineWidth: 1 });
  addImage(slide, wall, { left: 62, top: 193, width: 854, height: 289 }, "850 by 300 millimeter ICLO booth backwall", "contain");
  addBox(slide, { left: 956, top: 184, width: 270, height: 307 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  addText(slide, "규격 검증", { left: 980, top: 208, width: 220, height: 30 }, { fontSize: 22, bold: true });
  addRule(slide, 980, 253, 68, C.teal, 4);
  const specs = ["Backwall 850.1 × 300.0mm", "16:9 · 7 slides", "MP4 56s · 1080p H.264", "PPTX overflow 0"];
  specs.forEach((s, i) => addText(slide, s, { left: 980, top: 286 + i * 48, width: 220, height: 32 }, { fontSize: 16.5, bold: i === 0, color: C.ink2 }));
  const principles = [
    ["실사", "실제 오피스처럼 보이는 인물 장면. 치과·구강 클로즈업 없음."],
    ["공동 락업", "ICLO × Snowflake World Tour를 한 줄로 묶고 역할은 분리."],
    ["증거", "실제 synthetic dashboard 화면 사용. 추상 AI 그래픽·가짜 수치 없음."],
  ];
  principles.forEach(([title, body], i) => {
    const left = 58 + i * 390;
    addText(slide, title, { left, top: 530, width: 110, height: 30 }, { fontSize: 21, bold: true, color: C.tealDark });
    addText(slide, body, { left, top: 570, width: 350, height: 60 }, { fontSize: 16, color: C.ink2 });
  });
  addNotes(slide, "kill-ai-slop 원칙에 따라 3D 아이콘, 과밀 카드, 보라색 gradient, floating AI network, fake stat row를 배제했다. 공식 가이드의 Snowflake World Tour 락업과 ICLO 로고를 함께 사용하되, ICLO는 제품 주체이고 Snowflake는 행사·데이터 협업 맥락임을 문구와 배치로 구분한다.", [GUIDE, WALL, LOOP_PPTX]);
}

// 7. Common baseline
{
  const slide = deck.slides.add();
  addHeader(slide, "A/B 어느 쪽을 택해도 유지해야 할 공통 운영 베이스라인입니다.", 7, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addText(slide, "승인 항목", { left: 58, top: 174, width: 230, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "권장안", { left: 320, top: 174, width: 610, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "CEO 회신", { left: 1000, top: 174, width: 200, height: 24 }, { fontSize: 14, bold: true, color: C.muted, alignment: "center" });
  const decisions = [
    ["1. 대표 문구", "‘MAKE DENTAL BENEFITS EASIER TO USE.’ 승인", "승인 / 수정"],
    ["2. 타깃", "테크·금융 기업의 HR · Benefits · Data 팀 우선", "승인 / 수정"],
    ["3. 브랜드 락업", "ICLO × Snowflake World Tour 공동 노출", "승인 / 수정"],
    ["4. 선정 표현", "Selection confirmed / collaboration scoping in progress", "승인 / 수정"],
    ["5. 현장 CTA", "데모 QR 유지 + 스태프 태블릿·명함으로 리드 수집", "승인 / 수정"],
    ["6. 제출 정보", "POC · 전화 · 이메일 · 회사 홈페이지 확정", "정보 입력"],
  ];
  decisions.forEach(([item, rec, response], i) => {
    const top = 204 + i * 62;
    addBox(slide, { left: 52, top, width: 1175, height: 53 }, { fill: i % 2 ? C.paper : C.white, line: C.line, lineWidth: 1 });
    addText(slide, item, { left: 68, top: top + 12, width: 230, height: 28 }, { fontSize: 17, bold: true });
    addText(slide, rec, { left: 320, top: top + 11, width: 620, height: 30 }, { fontSize: 16, color: C.ink2 });
    addText(slide, response, { left: 1000, top: top + 12, width: 200, height: 26 }, { fontSize: 15.5, bold: true, color: C.tealDark, alignment: "center" });
  });
  addRule(slide, 58, 590, 1160, C.teal, 4);
  addText(slide, "제안 일정", { left: 60, top: 614, width: 120, height: 26 }, { fontSize: 17, bold: true, color: C.tealDark });
  addText(slide, "8/7 CEO 승인 · 8/10 백월 제출 · 8/21 영상 제출 · 8/26 현장 리허설", { left: 190, top: 614, width: 820, height: 28 }, { fontSize: 17, bold: true });
  addText(slide, "A/B 선택 후", { left: 1028, top: 603, width: 174, height: 22 }, { fontSize: 13, bold: true, color: C.muted, alignment: "center" });
  addText(slide, "최종 CTA와 자산만 교체", { left: 1000, top: 631, width: 228, height: 26 }, { fontSize: 15, bold: true, color: C.rose, alignment: "center" });
  addNotes(slide, "이 슬라이드는 이미 만든 공통 베이스라인이다. 공동 락업은 Snowflake의 제품 보증 또는 partnership claim이 아니라 World Tour 참가 맥락을 명확히 하는 용도다. A/B 선택 이후에는 wall, loop, tabletop CTA의 일부 자산만 교체한다.", [GUIDE, path.join(ROOT, "output/booth/ICLO-Snowflake-World-Tour-Submission-Copy-Bilingual-v1.md")]);
}

// 8. Exact booth specifications and common asset placement
{
  const slide = deck.slides.add();
  addHeader(slide, "공식 규격과 제안 규격을 구분해, 각 자산의 실제 자리를 먼저 고정합니다.", 8, { logo, snowflake, titleHeight: 72, ruleTop: 146 });

  addBox(slide, { left: 54, top: 174, width: 305, height: 420 }, { fill: C.ink, line: C.ink });
  addImage(slide, guideBooth, { left: 72, top: 188, width: 269, height: 314 }, "Snowflake Startup Village booth reference layout from the guide", "contain");
  addText(slide, "가이드의 2025 시안", { left: 72, top: 514, width: 269, height: 26 }, { fontSize: 17, bold: true, color: C.white, alignment: "center" });
  addText(slide, "전체 구조·가구는 TBD / 주최측 최종 도면 확인 필요", { left: 72, top: 548, width: 269, height: 38 }, { fontSize: 13, color: "#C5D0D9", alignment: "center" });

  addText(slide, "Guide-confirmed / 안내 자료 기재", { left: 392, top: 178, width: 350, height: 28 }, { fontSize: 19, bold: true, color: C.tealDark });
  const fixed = [
    ["Backwall", "850 × 300 mm", "제출 디자인 영역"],
    ["Display", "40″ · 16:9", "백월 아래 부착"],
    ["Booth / title zone", "1,000W×2,500H / 750×170", "2025 시안 기준 · TBD"],
    ["Counter / stools", "600W / 950H", "2025 시안 기준 · TBD"],
    ["Infrastructure", "유선 1회선 + 전원", "Lead scanner 미제공"],
  ];
  fixed.forEach(([name, value, status], i) => {
    const top = 220 + i * 62;
    addText(slide, name, { left: 392, top, width: 145, height: 24 }, { fontSize: 15.5, bold: true });
    addText(slide, value, { left: 536, top, width: 190, height: 24 }, { fontSize: 16.5, bold: true, color: C.ink2 });
    addText(slide, status, { left: 392, top: top + 27, width: 334, height: 21 }, { fontSize: 12.5, color: name === "Infrastructure" ? C.rose : C.muted });
    addRule(slide, 392, top + 53, 338, C.line, 1);
  });

  addText(slide, "ICLO-proposed / 제작·운영 규격", { left: 770, top: 178, width: 432, height: 28 }, { fontSize: 19, bold: true, color: C.tealDark });
  const proposed = [
    ["Backwall file", "850×300mm · 20mm safe margin", "AI + proof PDF; linked image 300dpi 권장"],
    ["Screen loop", "1920×1080 · H.264 · 56s", "무음 자동 루프; ≤2분 조건 충족"],
    ["Table QR card", "A5 · 148×210mm", "데모 QR 1개; 화면 QR과 동일 목적"],
    ["Lead capture", "Staff tablet / laptop", "명함·수기 의존 대신 별도 lead form"],
    ["Extra banner", "사용하지 않음", "필요 시 1개만 사전 협의"],
  ];
  proposed.forEach(([name, value, status], i) => {
    const top = 220 + i * 62;
    addText(slide, name, { left: 770, top, width: 155, height: 24 }, { fontSize: 15.5, bold: true });
    addText(slide, value, { left: 930, top, width: 282, height: 24 }, { fontSize: 16.5, bold: true, color: C.ink2 });
    addText(slide, status, { left: 770, top: top + 27, width: 442, height: 21 }, { fontSize: 12.5, color: C.muted });
    addRule(slide, 770, top + 53, 442, C.line, 1);
  });

  addBox(slide, { left: 392, top: 552, width: 820, height: 66 }, { fill: C.pale, line: C.teal, lineWidth: 1 });
  addText(slide, "운영 원칙", { left: 412, top: 570, width: 100, height: 26 }, { fontSize: 16, bold: true, color: C.tealDark });
  addText(slide, "좁은 1m 폭에서 wall은 한 문장, display는 한 서사, table은 한 CTA만 맡깁니다.", { left: 518, top: 568, width: 670, height: 30 }, { fontSize: 17.5, bold: true });
  addText(slide, "※ 20mm safe margin·A5 card는 ICLO 제안값이며, 주최측 제작 템플릿 수령 후 재확인", { left: 58, top: 636, width: 1154, height: 24 }, { fontSize: 13.5, color: C.muted, alignment: "center" });
  addNotes(slide, "가이드에서 확정적으로 읽히는 제출 영역은 backwall 850×300mm와 40인치 16:9 display다. 전체 1,000×2,500mm 구조, 750mm title zone, 600mm counter와 950mm stool은 2025년 참고 시안이며 이번 행사 최종 도면이 아니다. A5 카드와 20mm safe margin은 제작 안전을 위한 ICLO 제안이다.", [GUIDE]);
}

// 9. Option A
{
  const slide = deck.slides.add();
  addHeader(slide, "A안 — Snowflake collaboration을 wall에, product proof를 screen에 둡니다.", 9, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addBox(slide, { left: 54, top: 174, width: 750, height: 292 }, { fill: C.white, line: C.line, lineWidth: 1 });
  addText(slide, "BACKWALL · 850 × 300mm", { left: 72, top: 188, width: 280, height: 22 }, { fontSize: 13, bold: true, color: C.muted });
  addImage(slide, wall, { left: 72, top: 218, width: 714, height: 226 }, "Option A backwall preview", "contain");
  addText(slide, "20–390mm: co-brand + English lead copy", { left: 72, top: 446, width: 344, height: 22 }, { fontSize: 12.5, color: C.tealDark });
  addText(slide, "390–830mm: photoreal employee context", { left: 425, top: 446, width: 361, height: 22 }, { fontSize: 12.5, color: C.tealDark, alignment: "right" });

  addBox(slide, { left: 830, top: 174, width: 394, height: 292 }, { fill: C.paper, line: C.line, lineWidth: 1 });
  addText(slide, "A의 자산 배열", { left: 854, top: 196, width: 330, height: 28 }, { fontSize: 21, bold: true });
  addRule(slide, 854, 238, 72, C.teal, 4);
  const aAssets = [
    ["Wall", "영문 headline + 실사 employee"],
    ["Display", "navigation → evidence → dashboard"],
    ["Table", "A5 demo QR + architecture 1-pager"],
    ["Staff tablet", "HR / Benefits / Data lead form"],
  ];
  aAssets.forEach(([label, desc], i) => {
    const top = 266 + i * 43;
    addText(slide, label, { left: 854, top, width: 88, height: 24 }, { fontSize: 15, bold: true, color: C.tealDark });
    addText(slide, desc, { left: 944, top, width: 252, height: 26 }, { fontSize: 14.5, color: C.ink2 });
  });
  addText(slide, "RECOMMENDED MAIN ROUTE", { left: 854, top: 432, width: 340, height: 23 }, { fontSize: 13, bold: true, color: C.rose, alignment: "center" });

  addText(slide, "DISPLAY LOOP · 1920 × 1080 · 56s", { left: 54, top: 493, width: 430, height: 24 }, { fontSize: 15, bold: true, color: C.muted });
  const aLoop = [
    ["0–7", "Employee friction"],
    ["7–15", "Benefit navigation"],
    ["15–25", "Snowflake evidence plane"],
    ["25–35", "Synthetic dashboard proof"],
    ["35–43", "J-curve / no savings promise"],
    ["43–50", "Confirmed selections"],
    ["50–56", "Demo + conversation CTA"],
  ];
  let x = 54;
  aLoop.forEach(([time, label], i) => {
    const width = i === 2 || i === 3 || i === 4 ? 180 : 148;
    addBox(slide, { left: x, top: 529, width, height: 86 }, { fill: i % 2 ? C.paper : C.pale, line: i === 2 ? C.teal : C.line, lineWidth: i === 2 ? 2 : 1 });
    addText(slide, `${time}s`, { left: x + 10, top: 541, width: width - 20, height: 20 }, { fontSize: 12.5, bold: true, color: C.tealDark });
    addText(slide, label, { left: x + 10, top: 568, width: width - 20, height: 40 }, { fontSize: 13.5, bold: true, color: C.ink2 });
    x += width + 8;
  });
  addText(slide, "현장 대화: ‘Snowflake에 무엇을 올리나?’ → eligibility·plan·event·claims / raw image는 별도 경로", { left: 54, top: 636, width: 1170, height: 24 }, { fontSize: 14.5, bold: true, color: C.tealDark, alignment: "center" });
  addNotes(slide, "A는 World Tour 행사와 가장 직접적으로 맞는다. wall은 멀리서 읽는 한 문장과 실사 맥락만 맡고, 화면이 Snowflake evidence plane과 실제 dashboard proof를 설명한다. table은 QR과 lead capture만 담당한다. co-brand는 행사 참가 맥락이며 제품 보증이나 공식 공동 솔루션 출시를 뜻하지 않는다.", [GUIDE, WALL, LOOP_PDF]);
}

// 10. Option B
{
  const slide = deck.slides.add();
  addHeader(slide, "B안 — HomeDen 운영 데이터를 보험 업무와 연결하는 모델을 전면에 둡니다.", 10, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addText(slide, "NOT A PHOTO-APP STORY", { left: 58, top: 174, width: 260, height: 22 }, { fontSize: 13, bold: true, color: C.rose });
  addImage(slide, homedenLogo, { left: 58, top: 204, width: 136, height: 60 }, "HomeDen logo", "contain");
  addText(slide, "PMS · EMR · CRM supplies the longitudinal operational context.", { left: 205, top: 217, width: 436, height: 34 }, { fontSize: 18, bold: true, color: C.ink2 });

  const ui = [
    { blob: homedenPms, x: 58, label: "PMS · 예약·체어·치료계획" },
    { blob: homedenEmr, x: 257, label: "EMR · 기록·영상 맥락" },
    { blob: homedenCrm, x: 456, label: "CRM · recall·안내·consent" },
  ];
  ui.forEach((u) => {
    addBox(slide, { left: u.x, top: 276, width: 184, height: 172 }, { fill: C.white, line: C.line, lineWidth: 1 });
    addImage(slide, u.blob, { left: u.x + 8, top: 284, width: 168, height: 124 }, u.label, "cover");
    addText(slide, u.label, { left: u.x + 8, top: 415, width: 168, height: 27 }, { fontSize: 12.5, bold: true, color: C.ink2, alignment: "center" });
  });

  addBox(slide, { left: 680, top: 174, width: 544, height: 274 }, { fill: C.ink, line: C.ink });
  addText(slide, "B BACKWALL CONCEPT · 850 × 300mm", { left: 702, top: 191, width: 450, height: 20 }, { fontSize: 11.5, bold: true, color: C.teal });
  addImage(slide, logo, { left: 962, top: 184, width: 72, height: 27 }, "ICLO logo inside option B backwall", "contain");
  addText(slide, "×", { left: 1036, top: 187, width: 20, height: 20 }, { fontSize: 12, bold: true, color: C.white, alignment: "center" });
  addImage(slide, snowflake, { left: 1058, top: 182, width: 142, height: 30 }, "Snowflake World Tour lockup inside option B backwall", "contain");
  addText(slide, "CONNECT DENTAL OPERATIONS\nTO INSURANCE WORKFLOWS.", { left: 702, top: 226, width: 470, height: 84 }, { fontSize: 29, bold: true, color: C.white });
  addText(slide, "HomeDen PMS·EMR·CRM과 보험 업무를 연결합니다.", { left: 704, top: 326, width: 468, height: 30 }, { fontSize: 16, bold: true, color: "#D6E0E7" });
  addImage(slide, homedenLogo, { left: 702, top: 378, width: 108, height: 44 }, "HomeDen product logo in option B wall concept", "contain");
  addText(slide, "ICLO × Snowflake World Tour lockup: 상단 20–155mm\nHeadline: 20–560mm · HomeDen proof: 570–830mm", { left: 830, top: 376, width: 360, height: 48 }, { fontSize: 11.5, color: "#B9C8D2", alignment: "right" });

  addText(slide, "HomeDen operational layer", { left: 58, top: 486, width: 260, height: 24 }, { fontSize: 15.5, bold: true, color: C.tealDark });
  addText(slide, "→", { left: 318, top: 505, width: 50, height: 36 }, { fontSize: 26, bold: true, color: C.muted, alignment: "center" });
  addText(slide, "Snowflake governed collaboration", { left: 370, top: 486, width: 276, height: 24 }, { fontSize: 15.5, bold: true, color: C.tealDark });
  addText(slide, "→", { left: 648, top: 505, width: 50, height: 36 }, { fontSize: 26, bold: true, color: C.muted, alignment: "center" });
  addText(slide, "Insurer workflow · HYPOTHESIS / TO BE VALIDATED", { left: 700, top: 486, width: 504, height: 24 }, { fontSize: 15.5, bold: true, color: C.rose });

  addBox(slide, { left: 58, top: 522, width: 260, height: 88 }, { fill: C.pale, line: C.teal, lineWidth: 1 });
  addText(slide, "PMS · EMR · CRM", { left: 76, top: 538, width: 224, height: 24 }, { fontSize: 17, bold: true, alignment: "center" });
  addText(slide, "authorized operational context", { left: 76, top: 571, width: 224, height: 22 }, { fontSize: 12.5, color: C.muted, alignment: "center" });
  addBox(slide, { left: 370, top: 522, width: 276, height: 88 }, { fill: C.ink2, line: C.ink2 });
  addText(slide, "Purpose · access · lineage", { left: 388, top: 538, width: 240, height: 24 }, { fontSize: 16.5, bold: true, color: C.white, alignment: "center" });
  addText(slide, "share / ingest / aggregate evidence", { left: 388, top: 571, width: 240, height: 22 }, { fontSize: 12.5, color: "#CED9E0", alignment: "center" });
  const insurer = [
    ["1", "Product design", "상품 설계·개발"],
    ["2", "Case underwriting*", "개별 계약 인수"],
    ["3", "Monitoring & prevention", "계약 후 예방"],
    ["4", "Claim review*", "개별 청구 심사"],
  ];
  insurer.forEach(([n, en, ko], i) => {
    const x = 700 + i * 128;
    addBox(slide, { left: x, top: 522, width: 118, height: 88 }, { fill: i === 1 || i === 3 ? C.paleRose : C.paper, line: i === 1 || i === 3 ? C.rose : C.line, lineWidth: 1 });
    addText(slide, n, { left: x + 8, top: 532, width: 22, height: 20 }, { fontSize: 12, bold: true, color: C.tealDark, alignment: "center" });
    addText(slide, en, { left: x + 8, top: 554, width: 102, height: 30 }, { fontSize: 11.2, bold: true, color: C.ink2, alignment: "center" });
    addText(slide, ko, { left: x + 8, top: 586, width: 102, height: 18 }, { fontSize: 10.5, color: C.muted, alignment: "center" });
  });
  addText(slide, "* Human insurer decision; no automated approval, denial or clinical routing. Data rights·jurisdiction·policy validation required.", { left: 58, top: 632, width: 1165, height: 26 }, { fontSize: 13.5, bold: true, color: C.rose, alignment: "center" });
  addNotes(slide, "B의 핵심은 스마트폰 사진이 아니라 치과 운영의 longitudinal context다. PMS는 예약·치료계획·청구 행정, EMR은 허용된 범위의 진료기록·영상 맥락, CRM은 recall·안내·consent event를 제공한다. 보험상품 설계는 aggregate use case로 설명할 수 있지만, 개별 인수와 청구 심사는 사람의 의사결정을 지원하는 가설로만 표시한다. 이미지나 모델이 자동 승인·거절을 결정한다는 표현은 금지한다.", [path.join(TMP, "homeden-assets/KakaoTalk_20260727_154427448_01.png"), path.join(TMP, "homeden-assets/KakaoTalk_20260727_154427448_02.png")]);
}

// 11. Option comparison and deployment recommendation
{
  const slide = deck.slides.add();
  addHeader(slide, "권고는 ‘A를 벽에, B를 대화에’—한 화면에 두 서사를 섞지 않는 방식입니다.", 11, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addText(slide, "비교 기준", { left: 58, top: 174, width: 186, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "A · Snowflake collaboration first", { left: 284, top: 174, width: 408, height: 24 }, { fontSize: 17, bold: true, color: C.tealDark });
  addText(slide, "B · Insurer workflow via HomeDen", { left: 730, top: 174, width: 478, height: 24 }, { fontSize: 17, bold: true, color: C.rose });
  const compare = [
    ["첫 3초 이해", "Dental benefits navigation + evidence", "Dental operations → insurance workflow"],
    ["강한 청중", "Snowflake · tech · employer · data", "Insurer · bancassurance · claims · product"],
    ["주요 증거", "Architecture + synthetic employer dashboard", "실제 HomeDen PMS·EMR·CRM 화면"],
    ["차별화", "행사 fit와 broad conversation", "운영 데이터의 깊이와 금융사 use case"],
    ["리스크", "Snowflake endorsement로 오해 가능", "인수·심사 자동화/규제 claim으로 오해 가능"],
    ["외부 준비도", "현재 wall·loop·MP4 제작 완료", "문구 승인·insurer validation·전용 CTA 필요"],
  ];
  compare.forEach(([label, a, b], i) => {
    const top = 207 + i * 58;
    addBox(slide, { left: 52, top, width: 1175, height: 50 }, { fill: i % 2 ? C.paper : C.white, line: C.line, lineWidth: 1 });
    addText(slide, label, { left: 66, top: top + 12, width: 176, height: 24 }, { fontSize: 15.5, bold: true });
    addText(slide, a, { left: 284, top: top + 11, width: 402, height: 27 }, { fontSize: 15, color: C.ink2 });
    addText(slide, b, { left: 730, top: top + 11, width: 466, height: 27 }, { fontSize: 15, color: C.ink2 });
  });

  addBox(slide, { left: 52, top: 578, width: 1175, height: 73 }, { fill: C.ink, line: C.ink });
  addText(slide, "RECOMMENDED DEPLOYMENT", { left: 72, top: 592, width: 245, height: 21 }, { fontSize: 12.5, bold: true, color: C.teal });
  addText(slide, "Main wall + passive loop = A", { left: 72, top: 620, width: 300, height: 24 }, { fontSize: 18, bold: true, color: C.white });
  addText(slide, "Qualified insurer visitor", { left: 437, top: 592, width: 220, height: 21 }, { fontSize: 12.5, bold: true, color: C.teal });
  addText(slide, "→ Staff-triggered B deck / one-pager", { left: 437, top: 620, width: 360, height: 24 }, { fontSize: 18, bold: true, color: C.white });
  addText(slide, "Why", { left: 856, top: 592, width: 70, height: 21 }, { fontSize: 12.5, bold: true, color: C.teal });
  addText(slide, "두 서사를 분리해 메시지·claim risk 통제", { left: 856, top: 618, width: 344, height: 24 }, { fontSize: 13.5, bold: true, color: C.white });
  addNotes(slide, "권고는 A를 포기하고 B로 전환하는 것이 아니다. A는 wall과 passive loop의 public message로 유지하고, 보험사·금융사 중 적합한 방문객이 왔을 때 staff가 B deck 또는 one-pager를 열어 깊은 대화로 전환한다. B는 더 강한 차별화가 있지만 현재 상태에서 public wall에 올리면 인수·심사 자동화로 과해석될 가능성이 있다.", [GUIDE, LOOP_PDF]);
}

// 12. Final CEO decision register
{
  const slide = deck.slides.add();
  addHeader(slide, "CEO 검토에서는 A/B 선택보다 ‘어디까지 공개할지’를 여섯 행으로 닫습니다.", 12, { logo, snowflake, titleHeight: 72, ruleTop: 146 });
  addText(slide, "결정", { left: 58, top: 174, width: 220, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "권장안", { left: 300, top: 174, width: 650, height: 24 }, { fontSize: 14, bold: true, color: C.muted });
  addText(slide, "CEO 회신", { left: 1005, top: 174, width: 200, height: 24 }, { fontSize: 14, bold: true, color: C.muted, alignment: "center" });
  const decisions = [
    ["1. 메인 부스안", "A: Snowflake collaboration first를 wall·passive loop에 사용", "승인 / B로 전환"],
    ["2. 보험사 심화안", "B: staff-triggered deck 또는 1-page handout으로만 사용", "승인 / 제외"],
    ["3. B안 표현", "Product design은 use case; underwriting·claim review는 hypothesis", "승인 / 수정"],
    ["4. HomeDen 화면", "마스킹된 PMS·EMR·CRM product screen의 외부 사용 승인", "승인 / 교체"],
    ["5. CTA 분리", "Demo QR 1개 + insurer working-session lead form 1개", "승인 / 통합"],
    ["6. 최종 제작", "A 제출 유지, B는 선택 후 전용 56s loop·A5 card 제작", "담당 / 일정"],
  ];
  decisions.forEach(([item, rec, response], i) => {
    const top = 204 + i * 62;
    addBox(slide, { left: 52, top, width: 1175, height: 53 }, { fill: i % 2 ? C.paper : C.white, line: C.line, lineWidth: 1 });
    addText(slide, item, { left: 68, top: top + 12, width: 215, height: 28 }, { fontSize: 16.5, bold: true });
    addText(slide, rec, { left: 300, top: top + 11, width: 660, height: 30 }, { fontSize: 15.5, color: C.ink2 });
    addText(slide, response, { left: 1005, top: top + 12, width: 200, height: 26 }, { fontSize: 15, bold: true, color: C.tealDark, alignment: "center" });
  });
  addBox(slide, { left: 52, top: 592, width: 1175, height: 66 }, { fill: C.pale, line: C.teal, lineWidth: 1 });
  addText(slide, "권고 결론", { left: 72, top: 611, width: 112, height: 26 }, { fontSize: 17, bold: true, color: C.tealDark });
  addText(slide, "A를 공식 부스안으로 유지하고, B는 보험사·금융사 방문객에게만 여는 HomeDen 기반 심화 conversation asset으로 제작합니다.", { left: 194, top: 608, width: 1004, height: 33 }, { fontSize: 18, bold: true, color: C.ink });
  addNotes(slide, "회의 종료 시 여섯 행에 승인·수정·담당을 남긴다. B를 public asset으로 확대하려면 insurer design partner, data rights, 관할별 규제 검토, 인간 의사결정 boundary가 먼저 필요하다. Snowflake에는 이러한 법률 판단이 아니라 data collaboration architecture와 account path 지원을 요청한다.", [GUIDE]);
}

await fs.mkdir(path.dirname(FINAL), { recursive: true });
await fs.mkdir(path.join(TMP, "rendered"), { recursive: true });
for (const [index, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await deck.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(TMP, "rendered", `${stem}.layout.json`), await layout.text());
}
const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(TMP, "rendered", "ceo-review-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const inspect = await deck.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 40000 });
await fs.writeFile(path.join(TMP, "rendered", "ceo-review-inspect.txt"), inspect.ndjson);
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(FINAL);
console.log(`Created ${FINAL}`);
