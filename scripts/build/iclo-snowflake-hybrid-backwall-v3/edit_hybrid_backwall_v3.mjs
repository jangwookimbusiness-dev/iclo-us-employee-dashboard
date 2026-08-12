import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-backwall-v3");
const SOURCE = path.join(WORK, "template-starter.pptx");
const OUTPUT = path.join(ROOT, "output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Backwall-850x300mm-Bilingual-v3.pptx");
const HERO = path.join(ROOT, "output/imagegen/ICLO-World-Tour-Photoreal-Hero-v1.png");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));

function rewrite(anchorId, oldText, newText) {
  const target = presentation.resolve(anchorId);
  if (target.text.toString() !== oldText) {
    throw new Error(`Unexpected text in ${anchorId}: ${JSON.stringify(target.text.toString())}`);
  }
  target.text = newText;
}

rewrite(
  "sh/sryl4zqx",
  "U.S. DENTAL INSURANCE & EMPLOYEE BENEFITS / 미국 치과보험·직원 복지",
  "PROPOSED DATA COLLABORATION / 미국 치아보험 이용 접근성",
);
rewrite(
  "sh/fu94fe98",
  "MAKE DENTAL INSURANCE\nAND BENEFITS\nMORE ACCESSIBLE.",
  "EMPLOYEE DENTAL BENEFITS.\nCLAIMS-VERIFIED EVIDENCE\nON SNOWFLAKE.",
);
rewrite(
  "sh/utg3698n",
  "미국의 치과보험과 복지 혜택을\n더 쉽게 이해하고 이용하도록.",
  "임직원의 치아보험 이용을 돕고, 기업에는\n청구 데이터로 검증한 집계 근거를 제공합니다.",
);
rewrite(
  "sh/hofulsf2",
  "Employee navigation in front · Claims-verified aggregate evidence in back",
  "Make dental insurance and employee benefits easier to use.",
);
rewrite(
  "sh/ul4vaxgb",
  "앞에서는 직원 내비게이션 · 뒤에서는 청구로 검증된 기업 집계 근거",
  "임직원 혜택 안내 · Snowflake 기반 치아보험 청구 데이터 검증",
);
rewrite(
  "sh/vmdcj2xw",
  "ICLO @ Snowflake World Tour Seoul 2026",
  "ICLO @ Snowflake World Tour Seoul 2026 · EMPLOYEE DENTAL BENEFITS",
);

const image = presentation.resolve("im/bmxw3ido");
const oldFrame = image.frame;
const oldCrop = image.crop;
const oldFit = image.fit;
const oldGeometry = image.geometry;
const oldBorderRadius = image.borderRadius;
const oldRotation = image.rotation;
const oldFlipHorizontal = image.flipHorizontal;
const oldFlipVertical = image.flipVertical;
const oldLockAspectRatio = image.lockAspectRatio;
const replacement = await fs.readFile(HERO);
image.replace({
  blob: replacement.buffer.slice(replacement.byteOffset, replacement.byteOffset + replacement.byteLength),
  contentType: "image/png",
  alt: "Korean employee reviewing dental-benefit information in a modern office",
  ...(oldFit ? { fit: oldFit } : {}),
});
image.frame = oldFrame;
image.crop = oldCrop;
image.geometry = oldGeometry;
image.borderRadius = oldBorderRadius;
image.rotation = oldRotation;
image.flipHorizontal = oldFlipHorizontal;
image.flipVertical = oldFlipVertical;
image.lockAspectRatio = oldLockAspectRatio;

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
const png = await presentation.export({ slide: presentation.slides.getItem(0), format: "png", scale: 2 });
const pngBytes = new Uint8Array(await png.arrayBuffer());
await fs.writeFile(path.join(WORK, "hybrid-backwall-6426x2268.png"), pngBytes);
await fs.writeFile(
  path.join(ROOT, "output/booth/hybrid/ICLO-Snowflake-World-Tour-Hybrid-Backwall-850x300mm-Bilingual-v3.png"),
  pngBytes,
);
const layout = await presentation.export({ slide: presentation.slides.getItem(0), format: "layout" });
await fs.writeFile(path.join(WORK, "hybrid-backwall.layout.json"), new Uint8Array(await layout.arrayBuffer()));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,layout",
  include: "id,slide,text,textPreview,bbox,name,isPlaceholder,placeholders",
  maxChars: 1000000,
});
await fs.writeFile(path.join(WORK, "final-inspect.ndjson"), inspection.ndjson, "utf8");
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(OUTPUT);
console.log(JSON.stringify({ output: OUTPUT, slides: presentation.slides.count }, null, 2));
