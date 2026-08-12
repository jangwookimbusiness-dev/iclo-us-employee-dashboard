import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard";
const WORK = path.join(ROOT, "tmp/iclo-snowflake-hybrid-logo-fix-v4");
const SOURCE = path.join(ROOT, "output/pptx/ICLO-Snowflake-World-Tour-Hybrid-Booth-Bilingual-v3.pptx");

const presentation = await PresentationFile.importPptx(await FileBlob.load(SOURCE));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,notes,layout",
  include: "id,slide,name,text,textPreview,bbox,alt,isPlaceholder,placeholders",
  maxChars: 1000000,
});
await fs.writeFile(path.join(WORK, "template-inspect-full.ndjson"), inspection.ndjson, "utf8");
console.log(path.join(WORK, "template-inspect-full.ndjson"));
