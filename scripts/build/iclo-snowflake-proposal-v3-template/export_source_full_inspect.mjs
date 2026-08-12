import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/output/pptx/ICLO-Snowflake-HLS-Proposal-External-Briefing-v2.pptx";
const out = "/Users/jk0307/Documents/GitHub/iclo/iclo-us-employee-dashboard/tmp/iclo-snowflake-proposal-v3-template/template-inspect-full.ndjson";

const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const inspected = await presentation.inspect({
  kind: "deck,slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 200000,
});
await fs.writeFile(out, inspected.ndjson, "utf8");
console.log(out);
