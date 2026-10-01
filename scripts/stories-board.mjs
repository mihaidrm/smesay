// Writes the Stories board for the canvas from stories/*.md and stories/backlog.md.
// Each story file carries a "Status:" line (stories/README.md); the board is derived, never
// edited by hand. `node scripts/stories-board.mjs --write` writes
// docs/design-notes/prototype-01/Stories.dc.html; without --write it prints whether the file
// on disk matches (sync-status.mjs calls render() for the same check).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
export const BOARD = 'docs/design-notes/prototype-01/Stories.dc.html';

export const STATUSES = {
  ready: { label: 'Ready', bg: '#FFFFFF', fg: '#454A52', bd: '#C9C7C1', style: 'solid', hint: 'written, not started' },
  building: { label: 'Building', bg: '#FBF1DC', fg: '#7A5210', bd: '#FBF1DC', style: 'solid', hint: 'Claude is on it' },
  built: { label: 'Built', bg: '#E3F1EF', fg: '#0E6B63', bd: '#E3F1EF', style: 'solid', hint: 'reviewed, waits for Mihai' },
  accepted: { label: 'Accepted', bg: '#E6F4EC', fg: '#22643F', bd: '#E6F4EC', style: 'solid', hint: 'Mihai accepted' },
  done: { label: 'Done', bg: '#16181C', fg: '#FFFFFF', bd: '#16181C', style: 'solid', hint: 'done before the epic started' },
  deferred: { label: 'Deferred', bg: '#F0F0EE', fg: '#454A52', bd: '#F0F0EE', style: 'solid', hint: 'waits for a gate' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function readStories() {
  const dir = join(ROOT, 'stories');
  const epics = readFileSync(join(dir, 'backlog.md'), 'utf8').split('\n')
    .map((l) => l.match(/^(E\d+)\s+([^:]+):\s*(.*)$/)).filter(Boolean)
    .map((m) => ({ id: m[1], name: m[2].trim(), text: m[3].trim(), stories: [] }));
  const files = readdirSync(dir).filter((f) => /^E\d+-\d+-.*\.md$/.test(f)).sort((a, b) => {
    const [ea, na] = a.match(/^E(\d+)-(\d+)/).slice(1).map(Number); const [eb, nb] = b.match(/^E(\d+)-(\d+)/).slice(1).map(Number);
    return ea - eb || na - nb;
  });
  const problems = [];
  for (const f of files) {
    const text = readFileSync(join(dir, f), 'utf8');
    const h1 = text.match(/^# (E\d+)-(\d+)\s+(.*)$/m);
    const status = (text.match(/^Status:\s*(\w+)/m) || [])[1];
    if (!h1) { problems.push(`${f}: no "# E<n>-<n> Title" heading`); continue; }
    if (!status || !STATUSES[status]) { problems.push(`${f}: Status line missing or not one of ${Object.keys(STATUSES).join(', ')}`); continue; }
    const section = (name) => { const m = text.match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm')); return m ? m[1] : ''; };
    const criteria = (section('Acceptance criteria').match(/^\d+\./gm) || []).length;
    const questions = (section('Open questions').match(/^- (?!None)/gm) || []).length;
    const story = { id: `${h1[1]}-${h1[2]}`, epic: h1[1], title: h1[3].trim(), status, criteria, questions, file: f };
    const epic = epics.find((e) => e.id === h1[1]);
    if (!epic) { problems.push(`${f}: epic ${h1[1]} is not in stories/backlog.md`); continue; }
    epic.stories.push(story);
  }
  return { epics, problems };
}

export function render() {
  const { epics, problems } = readStories();
  const all = epics.flatMap((e) => e.stories);
  const count = (s) => all.filter((x) => x.status === s).length;
  const written = epics.filter((e) => e.stories.length).length;
  const rowH = 44, epicHead = 58, epicGap = 20, headerH = 170, footerH = 60, pad = 44;
  const bodyH = epics.reduce((h, e) => h + epicHead + (e.stories.length ? e.stories.length * rowH : rowH) + epicGap, 0);
  const H = Math.ceil((headerH + bodyH + footerH + pad * 2) / 10) * 10;
  const pill = (s) => { const st = STATUSES[s]; return `<span style="display: inline-flex; align-items: center; height: 22px; padding: 0 10px; border-radius: 999px; background: ${st.bg}; color: ${st.fg}; border: 1px ${st.style} ${st.bd}; font-size: 12px; font-weight: 500; white-space: nowrap">${st.label}</span>`; };
  const legend = Object.entries(STATUSES).map(([k, st]) => `<div style="display: flex; align-items: center; gap: 8px">${pill(k)}<span style="color: #5B6069">${st.hint}</span></div>`).join('\n');
  const rows = epics.map((e) => {
    const stories = e.stories.length ? e.stories.map((s) => `
<div style="display: grid; grid-template-columns: 72px 1fr 110px 120px 120px; gap: 16px; align-items: center; height: ${rowH}px; padding: 0 16px; border-top: 1px solid #F0EFEB">
<span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069">${s.id}</span>
<span style="font-size: 14px">${esc(s.title)}</span>
<span>${pill(s.status)}</span>
<span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069">${s.criteria} criteria</span>
<span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: ${s.questions ? '#7A5210' : '#5B6069'}">${s.questions ? s.questions + ' open question' + (s.questions > 1 ? 's' : '') : 'no questions'}</span>
</div>`).join('') : `
<div style="display: flex; align-items: center; height: ${rowH}px; padding: 0 16px; border-top: 1px dashed #C9C7C1; color: #5B6069; font-size: 13px">Stories not written yet. They are written when the epic before it is accepted (plan step 2.4 pattern).</div>`;
    const done = e.stories.filter((s) => ['done', 'accepted'].includes(s.status)).length;
    return `
<div style="border: 1px solid #E6E4DF; border-radius: 12px; overflow: hidden; flex-shrink: 0">
<div style="display: flex; align-items: baseline; gap: 12px; height: ${epicHead}px; padding: 0 16px; background: #F6F6F4">
<span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069; width: 72px">${e.id}</span>
<span style="font-size: 16px; font-weight: 500; white-space: nowrap">${esc(e.name)}</span>
<span style="font-size: 13px; color: #5B6069; flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${esc(e.text)}</span>
<span style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069; white-space: nowrap">${e.stories.length ? done + ' of ' + e.stories.length + ' accepted' : ''}</span>
</div>${stories}
</div>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>R1 stories</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;font-family:'Geist','Segoe UI',system-ui,sans-serif;background:#FFFFFF;color:#16181C}
</style>
</helmet>
<div style="width: 1440px; height: ${H}px; box-sizing: border-box; background: #FFFFFF; color: #16181C; padding: ${pad}px 56px; display: flex; flex-direction: column; gap: 20px; font-size: 14px; line-height: 1.45">
<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px">
<div style="display: flex; flex-direction: column; gap: 6px">
<div style="font-family: 'Geist Mono', monospace; font-size: 12px; color: #5B6069; text-transform: uppercase; letter-spacing: 0.04em">Generated from stories/ by scripts/stories-board.mjs</div>
<h1 style="margin: 0; font-size: 32px; font-weight: 500; letter-spacing: -0.03em">R1 stories: ${all.length} written in ${written} of ${epics.length} epics</h1>
<div style="color: #454A52">${count('done')} done before their epic, ${count('accepted')} accepted, ${count('built')} built, ${count('building')} building, ${count('ready')} ready, ${count('deferred')} deferred. Status comes from the Status line in each story file; the pre-commit hook refuses a commit when this board is stale.</div>
</div>
<div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px">${legend}</div>
</div>
${rows}
<div style="margin-top: auto; color: #5B6069; font-size: 12px">A story is ready when it has at least three acceptance criteria and no open question that blocks building (stories/README.md). Open questions are Mihai's to answer; they are listed in docs/context.md.</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":${H}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
  return { html, height: H, problems, stories: all.length, epics: epics.length };
}

if (process.argv[1] && process.argv[1].endsWith('stories-board.mjs')) {
  const { html, height, problems, stories, epics } = render();
  for (const p of problems) console.log('STALE  stories: ' + p);
  const path = join(ROOT, BOARD);
  let current = ''; try { current = readFileSync(path, 'utf8'); } catch { current = ''; }
  if (process.argv.includes('--write')) { writeFileSync(path, html); console.log(`wrote  ${BOARD}: ${stories} stories, ${epics} epics, height ${height}`); }
  else if (current !== html) { console.log(`STALE  ${BOARD} does not match stories/. Run: node scripts/stories-board.mjs --write`); process.exit(1); }
  else console.log(`${BOARD} is current: ${stories} stories, ${epics} epics, height ${height}`);
  if (problems.length) process.exit(1);
}
