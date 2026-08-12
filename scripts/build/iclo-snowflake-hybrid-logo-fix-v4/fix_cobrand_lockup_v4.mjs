import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-logo-fix-v4");
const SOURCE = path.join(WORK, "template-starter.pptx");
const OUTPUT = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v4.pptx");
const RENDER_DIR = path.join(WORK, "final-render-2560x1440");
const LAYOUT_DIR = path.join(WORK, "final-layout");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));

const ICLO_FRAME = { left: 936, top: 48, width: 126, height: 45.99 };
const MULTIPLY_FRAME = { left: 1072, top: 56, width: 20, height: 24 };
const SNOWFLAKE_FRAME = { left: 1102, top: 32, width: 118, height: 66.4 };

const currentInspection = await presentation.inspect({
  kind: "textbox,image",
  include: "id,slide,text,bbox",
  maxChars: 1000000,
});
const records = currentInspection.ndjson.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));

for (let slideNumber = 1; slideNumber <= presentation.slides.count; slideNumber += 1) {
  const topImages = records.filter((record) =>
    record.kind === "image" &&
    record.slide === slideNumber &&
    Array.isArray(record.bbox) &&
    record.bbox[1] < 100 &&
    record.bbox[2] < 250
  );
  const icloRecord = topImages.find((record) => record.bbox[2] / record.bbox[3] > 2.3);
  const snowflakeRecord = topImages.find((record) => record.bbox[2] / record.bbox[3] < 2.1);
  const multiplyRecord = records.find((record) =>
    record.kind === "textbox" && record.slide === slideNumber && record.text === "×"
  );
  if (!icloRecord || !snowflakeRecord || !multiplyRecord) {
    throw new Error(`Could not resolve co-brand lockup on slide ${slideNumber}`);
  }
  presentation.resolve(icloRecord.id).position = ICLO_FRAME;
  presentation.resolve(multiplyRecord.id).position = MULTIPLY_FRAME;
  presentation.resolve(snowflakeRecord.id).position = SNOWFLAKE_FRAME;
}

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.mkdir(RENDER_DIR, { recursive: true });
await fs.mkdir(LAYOUT_DIR, { recursive: true });

for (let index = 0; index < presentation.slides.count; index += 1) {
  const slide = presentation.slides.getItem(index);
  const n = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 2 });
  await fs.writeFile(path.join(RENDER_DIR, `slide-${n}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await presentation.export({ slide, format: "layout" });
  await fs.writeFile(path.join(LAYOUT_DIR, `slide-${n}.layout.json`), new Uint8Array(await layout.arrayBuffer()));
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 0.8 });
await fs.writeFile(path.join(WORK, "final-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const finalInspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  include: "id,slide,name,text,textPreview,bbox,alt,isPlaceholder,placeholders",
  maxChars: 1000000,
});
await fs.writeFile(path.join(WORK, "final-inspect.ndjson"), finalInspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUTPUT);
console.log(JSON.stringify({ output: OUTPUT, slides: presentation.slides.count }, null, 2));
