// Copy scan (WRITING.md): fails on em dashes and the banned words. No dependencies. Skips
// WRITING.md, which quotes the banned words.
// Usage: node scripts/scan-copy.mjs <file or folder> [...]
// Phase 2 wires this as `npm run scan:copy`. Until then run it with node directly.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

import { scanLine } from './copy-rules.mjs';
const EXT = new Set(['.md', '.txt', '.html', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.py', '.json']);

function files(path) {
  const st = statSync(path);
  if (st.isFile()) return (path.endsWith('WRITING.md') || path.endsWith('copy-rules.mjs') || path.endsWith('copy-rules.test.mjs')) ? [] : [path];
  return readdirSync(path).flatMap((n) => {
    if (n === 'node_modules' || n.startsWith('.') || n === 'WRITING.md' || n === 'copy-rules.mjs' || n === 'copy-rules.test.mjs') return [];
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
    const src = f.split(/[\\/]/)[0] === 'src';
    lines.forEach((line, i) => {
      for (const p of scanLine(line, { src })) { problems += 1; console.log(`${f}:${i + 1}: ${p.kind}${p.word ? ' "' + p.word + '"' : ''}`); }
    });
  }
}
console.log(`${scanned} files scanned, ${problems} problems`);
process.exit(problems ? 1 : 0);
