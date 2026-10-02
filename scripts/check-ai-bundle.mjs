// After `next build`, no client bundle may carry the Anthropic key name or the SDK package
// name (stories/E4-1, acceptance 1). The client bundles are the files under .next/static
// (nextjs.org/docs/app/api-reference/config/next-config-js/output lists the build output).
// Exit 1 names every file that does. Run by CI after the build and by `npm run check:bundle`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), ".next", "static");
const NEEDLES = ["ANTHROPIC_API_KEY", "@anthropic-ai/sdk"];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else yield file;
  }
}

let files = 0;
const hits = [];
try {
  statSync(ROOT);
} catch {
  console.error(`${ROOT} does not exist. Run npm run build first.`);
  process.exit(1);
}
for (const file of walk(ROOT)) {
  files += 1;
  const text = readFileSync(file, "utf8");
  for (const needle of NEEDLES) if (text.includes(needle)) hits.push(`${path.relative(process.cwd(), file)}: ${needle}`);
}
if (hits.length > 0) {
  console.error(`${hits.length} client bundle file(s) carry the AI key name or the SDK name:\n${hits.join("\n")}`);
  process.exit(1);
}
console.log(`check-ai-bundle: ${files} files under .next/static, none carry ${NEEDLES.join(" or ")}.`);
