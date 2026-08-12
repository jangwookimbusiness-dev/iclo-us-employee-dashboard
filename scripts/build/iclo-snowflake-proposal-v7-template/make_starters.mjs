import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-proposal-v7-template");

const jobs = {
  en: path.join(ROOT, "output/proposal-v6/02_EN_External/ICLO-Snowflake-Joint-Validation-Proposal-v6-EN-External.pptx"),
  ko: path.join(ROOT, "output/proposal-v6/01_KO_Internal/ICLO-Snowflake-Joint-Validation-Proposal-v6-KO-Internal.pptx"),
};

for (const [lang, source] of Object.entries(jobs)) {
  const deck = await PresentationFile.importPptx(await FileBlob.load(source));
  const aboutSlide = deck.slides.getItem(11).duplicate();
  aboutSlide.moveTo(deck.slides.count - 1);

  const outDir = path.join(WORK, lang);
  const previewDir = path.join(outDir, "template-starter-preview");
  const layoutDir = path.join(outDir, "template-starter-layout");
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  for (let i = 0; i < deck.slides.count; i += 1) {
    const slide = deck.slides.getItem(i);
    const n = String(i + 1).padStart(2, "0");
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(previewDir, `starter-slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await deck.export({ slide, format: "layout" });
    await fs.writeFile(path.join(layoutDir, `starter-slide-${n}.layout.json`), new Uint8Array(await layout.arrayBuffer()));
  }

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(path.join(outDir, "template-starter.pptx"));
  console.log(JSON.stringify({ lang, slides: deck.slides.count }));
}
