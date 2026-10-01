// Copy scan (WRITING.md): fails on em dashes and the banned words. No dependencies.
// Usage: node scripts/scan-copy.mjs <file or folder> [...]
// Phase 2 wires this as `npm run scan:copy`. Until then run it with node directly.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const BANNED = [
  'honestly', 'genuinely', 'worth noting', 'i want to flag', 'for what it\'s worth', 'let me',
  'here\'s the thing', 'seamless', 'leverage', 'empower', 'unlock', 'elevate', 'robust', 'cutting-edge'
];
const EXT = new Set(['.md', '.txt', '.html', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.py', '.json']);

function files(path) {
  const st = statSync(path);
  if (st.isFile()) return [path];
  return readdirSync(path).flatMap((n) => {
    if (n === 'node_modules' || n.startsWith('.')) return [];
    const p = join(path, n);
    return statSync(p).isDirectory() ? files(p) : (EXT.has(extname(n)) ? [p] : []);
  });
}

let problems = 0;
let scanned = 0;
for (const root of process.argv.slice(2)) {
  for (const f of files(root)) {
    scanned += 1;
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (line.includes('—')) { problems += 1; console.log(`${f}:${i + 1}: em dash`); }
      const low = line.toLowerCase();
      for (const w of BANNED) {
        const re = new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])');
        if (re.test(low)) { problems += 1; console.log(`${f}:${i + 1}: banned word "${w}"`); }
      }
    });
  }
}
console.log(`${scanned} files scanned, ${problems} problems`);
process.exit(problems ? 1 : 0);
