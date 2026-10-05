// npm run legal:markers (stories/E11-3, acceptance 4): every "[LAWYER: ...]" marker in
// docs/legal/, per page, with its count, for the lawyer's review (docs/accounts.md step 12).
// The pages show the markers until Mihai says they are confirmed; then one commit removes them.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "docs/legal";
// The same pattern as src/lib/legal.ts MARKER: one level of brackets inside a marker.
const MARKER = /\[LAWYER:(?:[^[\]]|\[[^[\]]*\])*\]/g;
let total = 0;
for (const file of readdirSync(DIR).filter((f) => f.endsWith(".md")).sort()) {
  const markers = readFileSync(join(DIR, file), "utf8").match(MARKER) ?? [];
  total += markers.length;
  console.log(`${file}: ${markers.length}`);
  for (const m of markers) console.log(`  ${m}`);
}
console.log(`${total} markers in ${DIR}`);
