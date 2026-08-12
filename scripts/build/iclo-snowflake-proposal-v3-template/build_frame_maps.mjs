import fs from "node:fs/promises";

const root = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/tmp/iclo-snowflake-proposal-v3-template";
const lines = (await fs.readFile(`${root}/template-inspect-full.ndjson`, "utf8"))
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

const editableBySlide = new Map();
for (const record of lines) {
  if (!record.slide || !["textbox", "table"].includes(record.kind)) continue;
  const items = editableBySlide.get(record.slide) ?? [];
  items.push({
    sourceElementId: record.id,
    action: "rewrite",
    purpose: record.kind === "table" ? "updated proposal table" : "updated or localized proposal copy",
  });
  editableBySlide.set(record.slide, items);
}

const sourceOrder = [1, 2, 3, 5, 4, 6, 7, 8, 9, 10, 11, 12, 13];
const rolesEn = [
  "opening thesis",
  "U.S. dental-insurance access friction",
  "ICLO employee journey",
  "governed evidence architecture",
  "honest J-curve economics",
  "dashboard proof of design",
  "account-specific diligence",
  "Snowflake GTM and architecture requests",
  "90-day joint validation close",
  "responsibility boundaries",
  "technical decision questions",
  "simulation inputs and outputs",
  "named-account diligence template",
];
const rolesKo = [
  "내부 검토용 핵심 제안",
  "미국 치아보험 이용 장벽 설명",
  "ICLO 임직원 이용 흐름",
  "Snowflake 근거 레이어 구조",
  "첫해 절감 미보장과 J-curve 설명",
  "대시보드 설계 증거",
  "계정 단위 검증 필요성",
  "Snowflake 요청사항",
  "90일 공동 검증안",
  "역할과 책임 경계",
  "기술 의사결정 질문",
  "시뮬레이션 입력과 출력",
  "계정 검증 템플릿",
];

function build(roles) {
  return {
    outputSlides: sourceOrder.map((sourceSlide, index) => ({
      outputSlide: index + 1,
      sourceSlide,
      narrativeRole: roles[index],
      reuseMode: "duplicate-slide",
      editTargets: editableBySlide.get(sourceSlide) ?? [],
    })),
    omittedSourceSlides: [],
  };
}

await fs.writeFile(`${root}/template-frame-map-en.json`, JSON.stringify(build(rolesEn), null, 2));
await fs.writeFile(`${root}/template-frame-map-ko.json`, JSON.stringify(build(rolesKo), null, 2));
