import fs from "node:fs/promises";
import path from "node:path";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const V5 = path.join(ROOT, "tmp/iclo-snowflake-proposal-v5-template");
const V6 = path.join(ROOT, "tmp/iclo-snowflake-proposal-v6-template");

const plan = [
  { old: 1, source: 1, role: "U.S. self-funded employer dental-benefit PoC scope and value" },
  { old: 2, source: 2, role: "restored employee dental-benefit navigation problem" },
  { old: 4, source: 3, role: "restored ICLO employee journey and evidence model" },
  { old: 2, source: 2, role: "new Korea-U.S. context and self-funded employer problem" },
  { old: 3, source: 5, role: "new U.S. dental-benefit ecosystem and actor pipeline" },
  { old: 5, source: 5, role: "governed evidence architecture" },
  { old: 6, source: 4, role: "J-curve economics" },
  { old: 7, source: 6, role: "synthetic employer dashboard proof" },
  { old: 8, source: 8, role: "Snowflake GTM and architecture requests" },
  { old: 9, source: 9, role: "90-day joint validation plan" },
  { old: 10, source: 10, role: "data and responsibility boundary" },
  { old: 11, source: 11, role: "technical decision questions" },
  { old: 12, source: 12, role: "J-curve simulation inputs and outputs" },
  { old: 13, source: 13, role: "account-level diligence template" },
];

// These six stale anchors were carried in the v5 plan but are not present in
// the current source-slide-4 inspection. They are excluded before validation.
const staleSource4Anchors = new Set([
  "sh/elwba54j",
  "sh/18nu50nu",
  "sh/rilczq5s",
  "sh/qhcb6l47",
  "sh/sjut8vmd",
  "sh/3elcv65w",
]);

for (const lang of ["en", "ko"]) {
  const oldPath = path.join(V5, `template-frame-map-${lang}.json`);
  const oldMap = JSON.parse(await fs.readFile(oldPath, "utf8"));
  const byOutput = new Map(oldMap.outputSlides.map((item) => [item.outputSlide, item]));
  const outputSlides = plan.map((item, index) => {
    const inherited = byOutput.get(item.old);
    if (!inherited) throw new Error(`Missing v5 output slide ${item.old}`);
    const editTargets = item.source === 4
      ? inherited.editTargets.filter((target) => !staleSource4Anchors.has(target.sourceElementId))
      : inherited.editTargets;
    return {
      ...inherited,
      outputSlide: index + 1,
      sourceSlide: item.source,
      narrativeRole: lang === "ko" ? `${item.role} - 국문 내부 검토` : item.role,
      editTargets,
    };
  });
  const result = {
    outputSlides,
    omittedSourceSlides: [
      {
        sourceSlide: 7,
        reason: "The former Delta/Blue account slide remains omitted; account-specific validation is handled in the diligence appendix.",
      },
    ],
  };
  await fs.writeFile(path.join(V6, `template-frame-map-${lang}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
