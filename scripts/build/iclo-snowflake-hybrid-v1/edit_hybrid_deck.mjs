import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-v1");
const SOURCE = path.join(WORK, "template-starter.pptx");
const OUTPUT = path.join(
  ROOT,
  "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-A-Main-BPrime-Opening-Bilingual-v1.pptx",
);
const PREVIEW_DIR = path.join(WORK, "final-render");
const LAYOUT_DIR = path.join(WORK, "final-layout");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));

const inspection = await presentation.inspect({
  kind: "slide,textbox,notes",
  include: "id,slide,text,textPreview,bbox",
  maxChars: 120000,
});

const records = inspection.ndjson
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function findTextbox(slide, oldText) {
  const matches = records.filter(
    (record) => record.kind === "textbox" && record.slide === slide && record.text === oldText,
  );
  if (matches.length !== 1) {
    throw new Error(
      `Expected one textbox on slide ${slide} for ${JSON.stringify(oldText)}; found ${matches.length}`,
    );
  }
  return presentation.resolve(matches[0].id);
}

function rewrite(slide, oldText, newText) {
  const target = findTextbox(slide, oldText);
  if (oldText.includes("\n")) {
    target.text = newText;
  } else {
    target.text.replace(oldText, newText);
  }
}

rewrite(
  1,
  "EMPLOYEE DENTAL BENEFITS / 직원 치과 복지",
  "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치과보험·임직원 복지",
);
rewrite(
  1,
  "MAKE DENTAL BENEFITS\nEASIER TO USE.",
  "MAKE DENTAL BENEFITS\nMORE ACCESSIBLE.",
);
rewrite(
  1,
  "직원이 치과 혜택을 더 쉽게 이해하고 이용하도록.",
  "보험이 있어도 치과 진료 이용은 여전히 복잡합니다.",
);
rewrite(
  1,
  "Employee navigation · Claims-verified evidence / 직원 내비게이션 · 청구 검증 근거",
  "Employee access · Claims-verified evidence on Snowflake / 직원 접근성 · Snowflake 기반 청구 검증 근거",
);

rewrite(2, "Coverage does not solve navigation.", "Coverage is not the same as access.");
rewrite(
  2,
  "보험이 있어도, 이용은 여전히 어렵습니다.",
  "보험 가입만으로 실제 이용이 쉬워지지는 않습니다.",
);

rewrite(
  7,
  "Looking for HR, Benefits and Data teams at technology and financial-services companies.",
  "For HR, Benefits and Data leaders at technology and financial-services companies.",
);
rewrite(
  7,
  "테크·금융 기업의 HR · Benefits · Data 팀을 찾습니다.",
  "테크·금융 기업의 HR · 복지 · 데이터 의사결정자를 찾습니다.",
);
rewrite(
  7,
  "Help validate the governed evidence pattern on Snowflake.",
  "Let's validate a governed evidence pattern on Snowflake—together.",
);
rewrite(
  7,
  "Snowflake에서 구현할 관리형 증거 패턴을 함께 검증합니다.",
  "Snowflake 기반 관리형 증거 패턴을 함께 검증합니다.",
);

const notes = [
  `패널과 부스의 공통 오프닝입니다. 첫 문장은 치아 사진 AI가 아니라 미국 임직원 치과보험·복지의 접근성 문제로 시작합니다. 보험 보유가 실제 이용을 보장하지는 않으며, 직원은 network, cost sharing, 실제 예약 가능성을 함께 이해해야 합니다. ICLO는 앞단에서 employee navigation을 제공하고, 뒷단에서 Snowflake 기반 claims-verified aggregate evidence를 만드는 협업 모델을 제안합니다. 대표님은 이 장에서 "A가 메인이고 B′는 문제 제기"라는 내부 구성을 언급하지 않고, 문제에서 협업 방향으로 자연스럽게 전환합니다.

[Sources]
- User-provided CEO and CMO email feedback, 2026-08-05
- ${ROOT}/output/pptx/ICLO-Snowflake-World-Tour-Option-A-Collaboration-Bilingual-v3.pptx
- ${ROOT}/output/pptx/ICLO-Snowflake-World-Tour-BPrime-US-Access-Bilingual-v3.pptx`,
  `미국 치과보험 friction을 세 질문으로 압축합니다. ① 내 plan에 맞는 in-network provider는 어디인가, ② deductible·coinsurance·annual maximum을 고려하면 비용이 얼마인가, ③ directory가 아니라 실제 예약이 가능한가. "미국에서는 network 밖에 갈 수 없다"고 단정하지 않고, provider choice may be constrained or economically penalized by network and plan rules라는 수준으로 설명합니다.

[Sources]
- ICLO Snowflake external briefing source material
- User-provided CMO email feedback, 2026-08-05`,
  `여기서 B′의 문제 제기에서 A의 Snowflake 협업 모델로 전환합니다. 직원은 혜택을 이해하고 network context를 확인한 뒤 본인이 요청한 지원을 받습니다. Snowflake는 eligibility, plan, app events, claims를 연결하는 governed evidence plane입니다. 원본 구강 이미지는 별도 통제 저장소에 두고, 승인된 structured data와 signal만 Snowflake에 저장합니다. employer에는 employee-level health signal이나 routing을 노출하지 않습니다.

[Sources]
- ICLO Snowflake external briefing source material
- ${ROOT}/output/pptx/ICLO-Snowflake-World-Tour-Option-A-Collaboration-Bilingual-v3.pptx`,
  `이 화면은 성과 주장이 아니라 구매자가 데이터 정의와 한계를 확인하는 방법의 데모입니다. synthetic data, Employees/Members lens, eligibility 기준일, claims lag, completeness, aggregate only, n≥20 suppression, no individual PHI를 짚습니다. 부스에서는 QR 데모를 열어 denominator와 freshness가 바뀌는 위치를 30초 안에 보여줍니다.

[Sources]
- ICLO Employer Dashboard synthetic demo
- ICLO Snowflake external briefing source material`,
  `첫해 절감을 약속하지 않는 이유를 설명합니다. 예방진료 이용과 미치료 상태 발견이 늘면 year-one plan-paid claims가 먼저 오를 수 있습니다. allowed, plan-paid, employee OOP를 분리하고, turnover와 claims run-out을 포함해 year 1/2/3 시나리오를 검증해야 합니다. 그래프는 hypothesis, not outcome입니다.

[Sources]
- ICLO Snowflake external briefing source material
- Illustrative J-curve; not an ICLO outcome`,
  `핀테크지원센터 Fintech Cube 9기와 Shinhan Future’s Lab 12기는 이미 선정 완료된 사실입니다. 지원 또는 후보라고 표현하지 않습니다. 현재는 금융사 협업 과제를 발굴·검증하는 단계이며, 이 이력은 보험상품 제조나 자동 인수·심사 기능을 이미 제공한다는 뜻이 아닙니다. 대표님 패널 참여 시에는 "금융사의 HR·복지·데이터 관점에서 실증 가능한 문제를 찾고 있다"는 수준으로 연결합니다.

[Sources]
- User-provided confirmation: Fintech Cube Cohort 9 and Shinhan Future’s Lab Cohort 12 selected
- User-provided CEO email feedback, 2026-08-05`,
  `마지막 요청은 막연한 고객 소개가 아닙니다. 1차 청중은 국내 대기업·금융사의 HR·복지·데이터 의사결정자이며, 미국 임직원 복지 도입 잠재 고객이자 데이터 협업 파트너입니다. 2차 청중은 Snowflake 생태계 파트너와 투자자입니다. 부스와 패널에서 architecture working session, workload sizing, 한 개 account-team validation, partner readiness 기준을 요청합니다. Snowflake가 ICLO의 AI를 검증하거나 ICLO 전체를 compliant하게 만들어 달라는 요청이 아님을 명확히 합니다.

[Sources]
- User-provided CEO and CMO email feedback, 2026-08-05
- ICLO Snowflake external briefing source material`,
];

for (let index = 0; index < presentation.slides.count; index += 1) {
  const slide = presentation.slides.getItem(index);
  slide.speakerNotes.textFrame.setText(notes[index]);
  slide.speakerNotes.setVisible(true);
}

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });
await fs.mkdir(LAYOUT_DIR, { recursive: true });

for (let index = 0; index < presentation.slides.count; index += 1) {
  const slide = presentation.slides.getItem(index);
  const n = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 1.5 });
  await fs.writeFile(
    path.join(PREVIEW_DIR, `slide-${n}.png`),
    new Uint8Array(await png.arrayBuffer()),
  );
  const layout = await presentation.export({ slide, format: "layout" });
  await fs.writeFile(
    path.join(LAYOUT_DIR, `slide-${n}.layout.json`),
    new Uint8Array(await layout.arrayBuffer()),
  );
}

const montage = await presentation.export({ format: "png", montage: true, scale: 0.8 });
await fs.writeFile(
  path.join(WORK, "final-montage.png"),
  new Uint8Array(await montage.arrayBuffer()),
);

const finalInspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  include: "id,slide,text,textPreview,bbox,name,isPlaceholder,placeholders",
  maxChars: 180000,
});
await fs.writeFile(path.join(WORK, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUTPUT);

console.log(JSON.stringify({ output: OUTPUT, slides: presentation.slides.count, previewDir: PREVIEW_DIR }, null, 2));
