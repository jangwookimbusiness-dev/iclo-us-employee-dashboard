import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = new URL("./en/template-starter.pptx", import.meta.url).pathname;
const deck = await PresentationFile.importPptx(await FileBlob.load(source));
const inspected = await deck.inspect({ kind: "table", maxChars: 100000 });
for (const line of inspected.ndjson.split(/\r?\n/).filter(Boolean)) {
  const record = JSON.parse(line);
  if (record.kind !== "table") continue;
  const table = deck.resolve(record.id);
  const values = [];
  for (let r = 0; r < record.rows; r += 1) {
    const row = [];
    for (let c = 0; c < record.cols; c += 1) {
      row.push(table.getCell(r, c).value ?? table.getCell(r, c).text?.text ?? "");
    }
    values.push(row);
  }
  console.log(JSON.stringify({ slide: record.slide, id: record.id, values }, null, 2));
}
