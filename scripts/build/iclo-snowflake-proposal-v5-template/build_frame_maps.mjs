import fs from "node:fs/promises";

const root = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/tmp/iclo-snowflake-proposal-v5-template";
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

const sourceOrder = [1, 2, 5, 3, 5, 4, 6, 8, 9, 10, 11, 12, 13];
const rolesEn = [
  "U.S. self-funded employer dental-benefit PoC scope and value",
  "Korea contrast and U.S. self-funded employer problem",
  "U.S. dental-benefit market ecosystem and actor pipeline",
  "ICLO employee journey",
  "governed evidence architecture",
  "honest J-curve economics",
  "dashboard proof of design",
  "Snowflake GTM and architecture requests",
  "90-day joint validation close",
  "responsibility boundaries",
  "technical decision questions",
  "simulation inputs and outputs",
  "named-account diligence template",
];
const rolesKo = [
  "미국 self-funded employer 치아보험 PoC 범위와 가치",
  "한국 대비 미국 치아보험 특성과 임직원·기업 문제",
  "미국 치아보험 시장 전체 액터와 흐름",
  "ICLO 임직원 이용 흐름",
  "Snowflake 근거 레이어 구조",
  "첫해 절감 미보장과 J-curve 설명",
  "대시보드 설계 증거",
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
    omittedSourceSlides: [
      { sourceSlide: 7, reason: "The former Delta/Blue account slide is replaced by an earlier market-wide ecosystem explanation." },
    ],
  };
}

await fs.writeFile(`${root}/template-frame-map-en.json`, JSON.stringify(build(rolesEn), null, 2));
await fs.writeFile(`${root}/template-frame-map-ko.json`, JSON.stringify(build(rolesKo), null, 2));
