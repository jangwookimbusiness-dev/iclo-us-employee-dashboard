import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

// v5 of the World Tour booth deck. Three corrections over v4:
//
//  slide 5  The J-curve was drawn as a four-point line descending through
//           Years 2-3, which promises the recovery the joint-validation
//           proposal explicitly refuses to claim ("Direction unknown"). Chart
//           removed; the three text blocks it sat beside carry the slide.
//  slide 6  "Dental-benefit collaboration validation in progress" is not
//           supported by any source. Replaced with the guardrail the Korean
//           report uses: the cohort selections are selections, nothing more.
//  slide 4  Dashboard screenshot was cut off at its own right edge (the
//           .wrap padding bug in index.html, since fixed). Re-captured.

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-v5");
const SHOT = path.join(ROOT, "tmp/iclo-snowflake-proposal-v10/dashboard-overview-v10.png");
const OUT_PPTX = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v5.pptx");

const deck = await PresentationFile.importPptx(await FileBlob.load(path.join(WORK, "starter.pptx")));
const inspection = await deck.inspect({
  kind: "slide,textbox,shape,image,table",
  include: "id,slide,text,bbox",
  maxChars: 1000000,
});
const records = inspection.ndjson.trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));

const on = (slide) => records.filter((r) => r.slide === slide);
const at = (slide, bbox) => {
  const hit = on(slide).find((r) => Array.isArray(r.bbox) && r.bbox.join(",") === bbox.join(","));
  if (!hit) throw new Error(`slide ${slide}: no shape at ${bbox.join(",")}`);
  return hit;
};
const byText = (slide, text) => {
  const hit = on(slide).find((r) => r.text === text);
  if (!hit) throw new Error(`slide ${slide}: no text ${JSON.stringify(text.slice(0, 40))}`);
  return hit;
};
const drop = (rec) => {
  const s = deck.resolve(rec.id);
  s.fill = "none";
  s.line = { style: "solid", fill: "none", width: 0 };
  s.shadow = "shadow-none";
  if (rec.text) s.text = "";
  s.position = { left: 0, top: 720, width: 1, height: 1 };
};

// ---- slide 5: remove the chart -------------------------------------------
const CHART_SHAPES = [
  [100, 530, 580, 2],   // x axis
  [100, 270, 2, 260],   // y axis
  [142, 430, 16, 16],   // markers
  [290, 320, 16, 16],
  [444, 365, 16, 16],
  [598, 398, 16, 16],
  [158, 328, 132, 110], // line segments
  [306, 328, 138, 45],
  [460, 373, 138, 33],
];
for (const bbox of CHART_SHAPES) drop(at(5, bbox));
for (const t of ["Dental plan-paid claims / 치아보험 지급액", "Baseline / 기준", "Year 1 / 1년",
                 "Year 2 / 2년", "Year 3 / 3년", "Prevention + discovered treatment",
                 "예방진료 이용 + 미치료 상태 발견"]) {
  drop(byText(5, t));
}

// Three columns rather than one right-hand stack: with the chart gone a single
// column leaves half the slide empty, and three abreast reads faster at booth
// distance.
const COLS = [56, 448, 840];
const COL_W = 360;
const BLOCKS = [
  ["Year 1 / 1년차",
   "Prevention and newly discovered treatment can increase claims.",
   "예방진료 이용과 미치료 상태 발견으로 치아보험 지급액이 늘 수 있습니다."],
  ["Years 2-3 / 2-3년차",
   "Treatment-mix change becomes measurable over time.",
   "치료 구성의 변화는 시간이 지나야 측정할 수 있습니다."],
  ["Turnover / 이직률",
   "Tenure changes the economic and employee-experience case.",
   "근속기간에 따라 비용과 직원 경험의 가치가 달라집니다."],
];
BLOCKS.forEach(([head, en, ko], i) => {
  deck.resolve(byText(5, head).id).position = { left: COLS[i], top: 268, width: COL_W, height: 26 };
  deck.resolve(byText(5, en).id).position = { left: COLS[i], top: 302, width: COL_W, height: 62 };
  deck.resolve(byText(5, ko).id).position = { left: COLS[i], top: 368, width: COL_W, height: 70 };
});
deck.resolve(at(5, [758, 594, 450, 3]).id).position = { left: 56, top: 508, width: 1168, height: 3 };
deck.resolve(byText(5, "Measure allowed, plan-paid and employee OOP separately.").id)
  .position = { left: 56, top: 524, width: 1168, height: 24 };
deck.resolve(byText(5, "허용액·보험자 지급액·직원 본인부담액을 구분해 측정합니다.").id)
  .position = { left: 56, top: 552, width: 1168, height: 24 };

// ---- slide 6: unsourced progress claim -----------------------------------
const claim = on(6).find((r) => (r.text || "").startsWith("Dental-benefit collaboration validation in progress"));
if (!claim) throw new Error("slide 6: progress claim not found");
deck.resolve(claim.id).text =
  "Program selection only — not a completed partnership, integration or outcome.\n선정 사실만 해당하며, 완료된 제휴·연동·성과를 의미하지 않습니다.";

// ---- slide 3: closing lines were centred inside a full-width box ---------
// Everything else on the slide is left-aligned to the x=58 column grid, so two
// centred lines under a two-column band read as floating rather than belonging
// to either column. They also started 5px under the right column's last line.
for (const [text, top] of [
  ["Individual routing and health signals stay outside employer views.", 632],
  ["직원별 진료 경로와 건강 신호는 기업에 제공하지 않습니다.", 656],
]) {
  const rec = byText(3, text);
  const s = deck.resolve(rec.id);
  s.position = { left: 58, top, width: 1164, height: 22 };
  s.text.style = { alignment: "left" };
}

// ---- slide 4: re-captured dashboard --------------------------------------
const shot = on(4).find((r) => r.kind === "image" && r.bbox && r.bbox[2] > 600);
if (!shot) throw new Error("slide 4: dashboard image not found");
const [sl, st, sw, sh] = shot.bbox;
console.log(JSON.stringify({ slide4ImageWas: shot.bbox }));
const img = deck.resolve(shot.id);
await img.replace(await FileBlob.load(SHOT));
// The re-capture is taller per unit width than the old crop, so hold the
// original bottom edge and narrow instead — growing downward would run the
// image under the "Not a performance claim" caption.
const w = Math.round((sh * 2880) / 1000);
img.position = { left: Math.round(sl + (sw - w) / 2), top: st, width: w, height: sh };

// ---- export ---------------------------------------------------------------
const renderDir = path.join(WORK, "render");
await fs.mkdir(renderDir, { recursive: true });
for (let i = 0; i < deck.slides.count; i += 1) {
  const png = await deck.export({ slide: deck.slides.getItem(i), format: "png", scale: 2 });
  await fs.writeFile(path.join(renderDir, `slide-${String(i + 1).padStart(2, "0")}.png`),
    new Uint8Array(await png.arrayBuffer()));
}
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(OUT_PPTX);
console.log(JSON.stringify({ slides: deck.slides.count, output: OUT_PPTX }));
