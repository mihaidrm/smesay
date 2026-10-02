// After `next build`, no client bundle may carry the Anthropic key name or the SDK package
// name (stories/E4-1, acceptance 1). The client bundles are the files under .next/static
// (nextjs.org/docs/app/api-reference/config/next-config-js/output lists the build output).
// Exit 1 names every file that does. Run by CI after the build and by `npm run check:bundle`;
// scan() is tested by scripts/check-ai-bundle.test.mjs.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const NEEDLES = ["ANTHROPIC_API_KEY", "@anthropic-ai/sdk"];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) yield* walk(file);
    else yield file;
  }
}

// Every file under root that carries a needle, as "relative path: needle", and the count of
// files read.
export function scan(root) {
  let files = 0;
  const hits = [];
  for (const file of walk(root)) {
    files += 1;
    const text = readFileSync(file, "utf8");
    for (const needle of NEEDLES) if (text.includes(needle)) hits.push(`${path.relative(root, file)}: ${needle}`);
  }
  return { files, hits };
}

// Run directly (not imported by the test): the two paths compare as the platform writes them
// (fileURLToPath, nodejs.org/api/url.html#urlfileurltopathurl-options), so Windows and a
// folder with a space in its name work too.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(process.cwd(), ".next", "static");
  try {
    statSync(root);
  } catch {
    console.error(`${root} does not exist. Run npm run build first.`);
    process.exit(1);
  }
  const { files, hits } = scan(root);
  if (hits.length > 0) {
    console.error(`${hits.length} client bundle file(s) carry the AI key name or the SDK name:\n${hits.join("\n")}`);
    process.exit(1);
  }
  console.log(`check-ai-bundle: ${files} files under .next/static, none carry ${NEEDLES.join(" or ")}.`);
}
