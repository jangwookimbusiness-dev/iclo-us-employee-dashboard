import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/output/pptx/ICLO-Snowflake-World-Tour-Hybrid-A-Main-BPrime-Opening-Bilingual-v2.pptx";
const output = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/tmp/iclo-snowflake-hybrid-booth-v3/template-inspect-full.ndjson";

const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const result = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart,notes,layout",
  include: "id,slide,name,text,textPreview,bbox,isPlaceholder,placeholders",
  maxChars: 1000000,
});
await fs.writeFile(output, result.ndjson, "utf8");
console.log(output);
