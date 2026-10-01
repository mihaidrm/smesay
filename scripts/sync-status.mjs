// One source for project status: the Phase tables in docs/plan-steps.md.
// `node scripts/sync-status.mjs --write` writes the derived status into the Roadmap board and
// docs/context.md. `node scripts/sync-status.mjs` (check) fails when any of them is stale, when a
// retired term (docs/retired-terms.md) appears in a current file, or when a "decision NNNN" or
// "note NN" reference points at a file that does not exist. The pre-commit hook runs the check.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { render as renderStories, BOARD as STORIES_BOARD } from './stories-board.mjs';
import { render as renderSchema, DOC as SCHEMA_DOC } from './schema-doc.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const WRITE = process.argv.includes('--write');
const rd = (p) => readFileSync(join(ROOT, p), 'utf8');
let problems = 0;
const problem = (msg) => { problems += 1; console.log('STALE  ' + msg); };

// ---------- 1. read the plan ----------
function readPlan() {
  const lines = rd('docs/plan-steps.md').split('\n');
  const phases = [];
  let phase = null; let cols = null;
  for (const line of lines) {
    const h = line.match(/^## Phase (\d+)\.\s*(.*)$/);
    if (h) { phase = { n: Number(h[1]), title: h[2].trim(), steps: [] }; phases.push(phase); cols = null; continue; }
    if (!phase || !line.startsWith('|')) { if (!line.startsWith('|')) cols = null; continue; }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells[0] === '#' || cells[0] === 'Epic') { cols = cells; continue; }
    if (!cols || cells.every((c) => /^-*$/.test(c))) continue;
    const row = {}; cols.forEach((c, i) => { row[c] = cells[i] || ''; });
    if (!row.Status) continue;
    if (row.Epic) {
      const m = row.Epic.match(/^(E\d+)\s+(.*)$/);
      phase.steps.push({ id: m ? m[1] : row.Epic, short: m ? m[2].trim() : row.Epic, detail: row['What ships'] || '', who: 'Claude', status: row.Status.toLowerCase() });
      continue;
    }
    const [short, ...rest] = row.Step.split(':');
    phase.steps.push({ id: row['#'], short: short.trim(), detail: rest.join(':').trim(), who: row.Who, status: row.Status.toLowerCase() });
  }
  return phases.filter((p) => p.steps.length);
}
const STATUS = new Set(['done', 'drafted', 'open', 'mihai', 'building']);

const phases = readPlan();
if (!phases.length) { console.log('No phase table with a Status column in docs/plan-steps.md'); process.exit(1); }
for (const p of phases) for (const s of p.steps) if (!STATUS.has(s.status)) problem(`plan-steps ${s.id}: status "${s.status}" is not one of done, drafted, open, mihai`);

const summary = (p) => {
  const claude = p.steps.filter((s) => s.status !== 'mihai');
  const done = claude.filter((s) => s.status === 'done' || s.status === 'drafted');
  const left = claude.filter((s) => s.status === 'open' || s.status === 'building');
  const leftText = left.length > 4 ? left.length + ' steps' : left.map((s) => s.short).join(', ');
  const waiting = claude.filter((s) => s.status === 'drafted');
  return {
    label: `Done ${done.length} of ${claude.length} steps.`,
    left: left.length ? 'Left: ' + leftText + (waiting.length ? `. ${waiting.length} drafted, waits for Mihai` : '') : (waiting.length ? `${waiting.length} drafted, waits for Mihai` : 'Phase complete'),
    doneList: (done.length ? 'Done: ' + done.map((s) => s.short).join(', ') + '. ' : '') + (left.length ? 'Left: ' + leftText : 'Nothing left') + (claude.some((s) => s.status === 'building') ? '. Building: ' + claude.filter((s) => s.status === 'building').map((s) => s.short).join(', ') : ''),
    bar: Math.round((done.length / claude.length) * 100) + '%',
    complete: left.length === 0
  };
};
const current = phases.find((p) => !summary(p).complete) || phases[phases.length - 1];
const today = new Date();
const nowLabel = `Now: ${today.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][today.getUTCMonth()]}, Phase ${current.n}`;

// ---------- 2. decisions and notes on disk ----------
const decisionFiles = readdirSync(join(ROOT, 'docs/decisions')).filter((f) => /^\d{4}-/.test(f));
const decisions = new Set(decisionFiles.map((f) => f.slice(0, 4)));
const latestDecision = decisionFiles.map((f) => f.slice(0, 4)).sort().pop();
const noteFiles = readdirSync(join(ROOT, 'docs/design-notes')).filter((f) => /^\d{4}-\d{2}-\d{2}-\d{2}-/.test(f));
const notes = new Set(noteFiles.map((f) => f.slice(11, 13)));

// ---------- 3. synced fragments ----------
function sync(file, re, want, name) {
  let text = rd(file);
  const m = text.match(re);
  if (!m) { problem(`${file}: marker "${name}" not found`); return; }
  if (m[1] === want) return;
  if (WRITE) { text = text.replace(re, (all, old) => all.replace(old, want)); writeFileSync(join(ROOT, file), text); console.log(`wrote  ${file}: ${name}`); }
  else problem(`${file}: ${name} says "${m[1]}", plan says "${want}". Run: node scripts/sync-status.mjs --write`);
}
const ROAD = 'docs/design-notes/prototype-01/Roadmap.dc.html';
sync(ROAD, /data-sync="decisions">([^<]*)</, `Phase 0 done, decisions 0001 to ${latestDecision}:`, 'decisions');
const roadText = rd(ROAD);
for (const p of phases) {
  const k = 'phase' + p.n;
  if (!roadText.includes(`data-sync="${k}-label"`)) continue;
  const sm = summary(p);
  sync(ROAD, new RegExp(`data-sync="${k}-label">([^<]*)<`), sm.label, k + '-label');
  sync(ROAD, new RegExp(`data-sync="${k}-left">([^<]*)<`), ' ' + sm.left, k + '-left');
  sync(ROAD, new RegExp(`data-sync="${k}-done">([^<]*)<`), sm.doneList, k + '-done');
  sync(ROAD, new RegExp(`data-sync="${k}-bar" style="width: ([^;]*);`), sm.bar, k + '-bar');
}
if (WRITE) sync(ROAD, /data-sync="now">([^<]*)</, nowLabel, 'now');

const block = ['<!-- sync:phases -->', 'Status, derived from the Phase tables in docs/plan-steps.md (run `node scripts/sync-status.mjs --write` after changing a Status cell):']
  .concat(phases.flatMap((p) => [`Phase ${p.n}, ${p.title}: ${summary(p).label} ${summary(p).left}`].concat(p.steps.map((s) => `- ${s.id} ${s.short}: ${{ done: 'done', drafted: "drafted, waits for Mihai's approval", open: 'open', mihai: 'Mihai, when ready', building: 'building' }[s.status]}.`))))
  .concat(['<!-- /sync:phases -->']).join('\n');
sync('docs/context.md', /(<!-- sync:phases -->[\s\S]*?<!-- \/sync:phases -->)/, block, 'phases block');

// ---------- 3b. the Stories board, generated from stories/ ----------
{
  const { html, problems: sp, stories, epics } = renderStories();
  for (const p of sp) problem('stories: ' + p);
  let current = ''; try { current = rd(STORIES_BOARD); } catch { current = ''; }
  if (current !== html) {
    if (WRITE) { writeFileSync(join(ROOT, STORIES_BOARD), html); console.log(`wrote  ${STORIES_BOARD}: ${stories} stories in ${epics} epics`); }
    else problem(`${STORIES_BOARD} does not match stories/. Run: node scripts/sync-status.mjs --write`);
  }
}

// ---------- 3c. docs/schema.md, generated from the migration snapshot ----------
{
  const { text, problems: sp, tables } = renderSchema();
  for (const p of sp) problem(p);
  let current = ''; try { current = rd(SCHEMA_DOC); } catch { current = ''; }
  if (current !== text) {
    if (WRITE) { writeFileSync(join(ROOT, SCHEMA_DOC), text); console.log(`wrote  ${SCHEMA_DOC}: ${tables} tables`); }
    else problem(`${SCHEMA_DOC} does not match drizzle/meta. Run: node scripts/sync-status.mjs --write`);
  }
}

// ---------- 4. retired terms ----------
const retired = rd('docs/retired-terms.md').split('\n')
  .filter((l) => l.startsWith('| ') && !l.startsWith('| Term') && !l.startsWith('|---'))
  .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
  .map((c) => ({ term: c[0].replace(/^`|`$/g, ''), by: c[1] }));
const EXEMPT = [/^drizzle\//, /^docs\/decisions\//, /^docs\/design-notes\/\d{4}-/, /^docs\/retired-terms\.md$/, /^MISTAKES\.md$/, /^scripts\//, /^docs\/business-plan\.pdf$/,
  /^docs\/design-notes\/prototype-01\/Landing(B|C|D)?\.dc\.html$/, /^docs\/design-notes\/prototype-01\/.*\.(png|js)$/, /^\.git\//, /^node_modules\//, /^assets\//];
function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n); const rel = relative(ROOT, p);
    if (EXEMPT.some((re) => re.test(rel)) || n.startsWith('.')) return [];
    return statSync(p).isDirectory() ? files(p) : (['.md', '.html', '.py', '.json', '.txt'].includes(extname(n)) ? [rel] : []);
  });
}
const current_files = files(ROOT);
for (const f of current_files) {
  const text = rd(f);
  const lines = text.split('\n');
  for (const r of retired) {
    lines.forEach((line, i) => { if (line.toLowerCase().includes(r.term.toLowerCase())) problem(`${f}:${i + 1}: retired term "${r.term}" (${r.by})`); });
  }
  // references
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\b(00\d\d)\b/g)) if (!decisions.has(m[1])) problem(`${f}:${i + 1}: decision ${m[1]} has no file in docs/decisions`);
    for (const m of line.matchAll(/\bnotes? (\d\d(?:(?:, | and | to )\d\d)*)\b/gi)) for (const n of m[1].split(/, | and | to /)) if (!notes.has(n)) problem(`${f}:${i + 1}: note ${n} has no file in docs/design-notes`);
  });
}

console.log(`${current_files.length} files checked, ${retired.length} retired terms, ${decisions.size} decisions, ${notes.size} notes, ${problems} problems${WRITE ? ' (write mode)' : ''}`);
process.exit(problems ? 1 : 0);
