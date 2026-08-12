import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-v2");
const SOURCE = path.join(WORK, "template-starter.pptx");
const OUTPUT = path.join(
  ROOT,
  "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-A-Main-BPrime-Opening-Bilingual-v2.pptx",
);
const PREVIEW_DIR = path.join(WORK, "final-render");
const LAYOUT_DIR = path.join(WORK, "final-layout");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,notes",
  include: "id,slide,text,textPreview,bbox",
  maxChars: 160000,
});
const records = inspection.ndjson
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function findTextObject(slide, fullText) {
  const matches = records.filter(
    (record) =>
      (record.kind === "textbox" || record.kind === "shape") &&
      record.slide === slide &&
      record.text === fullText,
  );
  if (matches.length !== 1) {
    throw new Error(
      `Expected one text object on slide ${slide} for ${JSON.stringify(fullText)}; found ${matches.length}`,
    );
  }
  return presentation.resolve(matches[0].id);
}

function rewrite(slide, oldText, newText) {
  findTextObject(slide, oldText).text.replace(oldText, newText);
}

function rewriteWhole(slide, oldText, newText) {
  findTextObject(slide, oldText).text = newText;
}

function rewriteParts(slide, fullText, replacements) {
  const target = findTextObject(slide, fullText);
  for (const [oldPart, newPart] of replacements) {
    target.text.replace(oldPart, newPart);
  }
}

// Slide 1: make dental insurance explicit and remove translation-like Korean.
rewriteWhole(
  1,
  "MAKE DENTAL BENEFITS\nMORE ACCESSIBLE.",
  "MAKE DENTAL INSURANCE\nMORE ACCESSIBLE.",
);
rewrite(
  1,
  "보험이 있어도 치과 진료 이용은 여전히 복잡합니다.",
  "치아보험이 있어도 실제 진료를 받기는 여전히 어렵습니다.",
);
rewrite(
  1,
  "직원은 진료를 탐색하고, 회사는 청구로 확인된 집계 근거를 봅니다.",
  "직원은 필요한 진료를 찾고, 회사는 청구 데이터에 근거한 집계 결과를 확인합니다.",
);
rewrite(
  1,
  "Employee access · Claims-verified evidence on Snowflake / 직원 접근성 · Snowflake 기반 청구 검증 근거",
  "Employee access · Claims-verified evidence on Snowflake / 직원 진료 접근 · Snowflake 기반 청구 검증",
);

// Slide 2: say dental coverage and use natural booking language.
rewrite(2, "Coverage is not the same as access.", "Dental coverage is not the same as access.");
rewrite(
  2,
  "보험 가입만으로 실제 이용이 쉬워지지는 않습니다.",
  "치아보험에 가입했어도 실제 이용이 쉬워지는 것은 아닙니다.",
);
rewrite(2, "내 플랜에 맞는 네트워크 치과", "내 치아보험 네트워크에 포함된 치과");
rewrite(2, "디렉터리가 아닌 실제 예약 가능성", "실제로 예약할 수 있는지 확인");

// Slide 3: preserve the architecture while replacing unfamiliar Korean labels.
rewrite(
  3,
  "앞에서는 내비게이션. 뒤에서는 증거.",
  "앞에서는 이용을 돕고, 뒤에서는 근거를 만듭니다.",
);
rewriteParts(
  3,
  "Benefit understanding\n혜택 이해\nNetwork context\n네트워크 맥락\nRequested support\n직원 요청 지원",
  [
    ["네트워크 맥락", "네트워크 정보"],
    ["직원 요청 지원", "직원 요청에 따른 지원"],
  ],
);
rewriteParts(
  3,
  "ELIGIBILITY + PLAN\n자격·플랜\nAPP EVENTS + CLAIMS\n앱 이벤트·청구",
  [
    ["자격·플랜", "가입 자격·치아보험 조건"],
    ["앱 이벤트·청구", "앱 이용 기록·청구 데이터"],
  ],
);
rewrite(3, "기업 집계 근거", "기업용 집계 결과");
rewriteParts(
  3,
  "Claims-confirmed use\n청구로 확인된 이용\nAllowed · paid · OOP\n비용 주체별 구분\nAggregate employer view\n기업 집계 전용",
  [
    ["청구로 확인된 이용", "청구 데이터로 확인된 이용"],
    ["비용 주체별 구분", "허용액·지급액·본인부담금"],
    ["기업 집계 전용", "기업에는 집계 결과만"],
  ],
);
rewrite(
  3,
  "이미지 신호는 자동 임상 라우팅과 분리합니다.",
  "이미지 신호와 자동 임상 경로 결정을 분리합니다.",
);

// Slide 4: make dashboard definitions read like natural Korean.
rewrite(4, "증거는 숫자보다 먼저, 정의가 보여야 합니다.", "숫자보다 먼저, 데이터의 기준이 보여야 합니다.");
rewrite(4, "기준일·청구 지연", "데이터 기준일·청구 지연");
rewrite(4, "집계 전용·개인 PHI 없음", "집계 결과만·개인 PHI 없음");
rewrite(
  4,
  "성과가 아닌 데이터 기준과 프라이버시 설계 예시입니다.",
  "성과가 아니라 데이터 기준과 프라이버시 설계를 보여주는 화면입니다.",
);

// Slide 5: remove awkward PDF hyphenation and Korean translation artifacts.
rewrite(5, "Plan-paid claims / 보험자 지급 청구액", "Dental plan-paid claims / 치아보험 지급액");
rewrite(5, "예방 이용 + 미치료 상태 발견", "예방진료 이용 + 미치료 상태 발견");
rewrite(
  5,
  "Preventive use and discovered treatment can raise plan-paid claims.",
  "Prevention and newly discovered treatment can increase claims.",
);
rewrite(
  5,
  "예방진료와 발견된 치료로 보험자 지급액이 늘 수 있습니다.",
  "예방진료 이용과 미치료 상태 발견으로 치아보험 지급액이 늘 수 있습니다.",
);
rewrite(
  5,
  "치료 믹스 변화는 시간이 지나야 측정할 수 있습니다.",
  "치료 구성의 변화는 시간이 지나야 측정할 수 있습니다.",
);
rewrite(
  5,
  "근속기간에 따라 비용·직원 경험의 가치 논리가 달라집니다.",
  "근속기간에 따라 비용과 직원 경험의 가치가 달라집니다.",
);

// Slide 6: keep both confirmed selections and use natural Korean.
rewriteParts(
  6,
  "Collaboration scoping and validation in progress\n협업 과제 발굴·검증 진행 중",
  [["협업 과제 발굴·검증 진행 중", "협업 과제 발굴 및 검증 진행 중"]],
);

// Slide 7: close on dental insurance, the confirmed primary audience, and a natural ask.
rewriteParts(
  7,
  "CAN YOUR COMPANY PROVE\nHOW DENTAL BENEFITS ARE USED?",
  [["DENTAL BENEFITS ARE", "DENTAL INSURANCE IS"]],
);
rewrite(
  7,
  "회사의 치과 혜택 이용을 근거로 설명할 수 있나요?",
  "우리 회사의 치아보험 이용 현황을 데이터로 설명할 수 있나요?",
);
rewrite(
  7,
  "테크·금융 기업의 HR · 복지 · 데이터 의사결정자를 찾습니다.",
  "테크·금융 기업의 HR·복지·데이터 리더와 협업하고자 합니다.",
);
rewrite(
  7,
  "Snowflake 기반 관리형 증거 패턴을 함께 검증합니다.",
  "Snowflake 기반의 데이터 협업 모델을 함께 검증합니다.",
);
rewrite(7, "합성 데이터 · 집계 전용 · 개인 PHI 없음", "합성 데이터 · 집계 결과만 · 개인 PHI 없음");
rewriteParts(
  7,
  "ASK FOR A WALK-THROUGH / 데모 설명 요청",
  [["데모 설명 요청", "데모 안내 받기"]],
);
rewriteParts(
  7,
  "SCAN TO OPEN / 스캔하여 열기",
  [["스캔하여 열기", "스캔해 보기"]],
);

// Keep the panel notes aligned with the user's dental-insurance emphasis.
for (const record of records.filter((item) => item.kind === "notes")) {
  let updated = record.text;
  if (record.slide === 1) updated = updated.replace("보험 보유", "치아보험 가입");
  if (record.slide === 6) updated = updated.replace("보험상품 제조", "치아보험 상품 제조");
  if (record.slide === 7) updated = updated.replace("미국 임직원 복지 도입", "미국 임직원 치아복지 도입");
  if (updated !== record.text) presentation.resolve(record.id).setText(updated);
}

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });
await fs.mkdir(LAYOUT_DIR, { recursive: true });

for (let index = 0; index < presentation.slides.count; index += 1) {
  const slide = presentation.slides.getItem(index);
  const n = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 1.5 });
  await fs.writeFile(path.join(PREVIEW_DIR, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await presentation.export({ slide, format: "layout" });
  await fs.writeFile(
    path.join(LAYOUT_DIR, `slide-${n}.layout.json`),
    new Uint8Array(await layout.arrayBuffer()),
  );
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 0.8 });
await fs.writeFile(path.join(WORK, "final-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const finalInspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  include: "id,slide,text,textPreview,bbox,name,isPlaceholder,placeholders",
  maxChars: 200000,
});
await fs.writeFile(path.join(WORK, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUTPUT);

console.log(JSON.stringify({ output: OUTPUT, slides: presentation.slides.count }, null, 2));
