// Writes docs/schema.md from the latest drizzle snapshot (drizzle/meta/*_snapshot.json), so the
// documented schema is the migrated schema (stories/E1-2, acceptance 5). `--write` writes;
// without it, sync-status.mjs compares and fails when the file is stale.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
export const DOC = 'docs/schema.md';

const ORDER = ['workspace', 'workspace_member', 'workspace_invite', 'project', 'item_set', 'item', 'instrument', 'invite', 'response', 'answer', 'missing_item', 'insight', 'ai_run', 'upload', 'workspace_mapping', 'user', 'session', 'account', 'verification'];
const PURPOSE = {
  workspace: 'organisation: members, AI budget, branding defaults (accent and logo); deleted_at starts the 24-hour removal (E11)',
  workspace_member: 'who belongs to a workspace and as what (owner, member); user_id is better-auth\'s',
  workspace_invite: 'an open invitation by email (E2-4); becomes a workspace_member row on the invitee\'s first signed-in request',
  workspace_mapping: 'a column mapping remembered per workspace (E3-3), keyed by the sorted headers; the next file with the same headers maps itself',
  upload: 'a file a PM uploaded for a project (E3-2): the object key under uploads/<workspace id>/, the sheet and header row chosen, a ten-row preview and the column mapping in jsonb',
  project: 'one validation effort; the AI context (decision 0011); is_sample marks the watermarked sample',
  item_set: 'one imported or pasted version of the list (decision 0010); version is unique per project',
  item: 'one requirement: original_text is never overwritten, reader_text sits beside it (E4); area, proposed value, custom fields, flags',
  instrument: 'how one set version is shown to respondents: method, proposed value shown or not, layout, intro, respondent fields, closing (decisions 0014, 0016, 0018)',
  invite: 'a public link or a personal link per email; opens and closes; passcode; revoked; reminders. token is 128-bit random',
  response: 'one respondent\'s session against one instrument, pinned to the set version it was given; fields, confidence, sign-off, submitted_at',
  answer: 'one answer per item per response: kind (agree, change, disagree, unclear, pick), value, reason, comment',
  missing_item: 'what a respondent said was missing, with the area they suggested',
  insight: 'an AI-written action on a project with the answers it cites and its cost',
  ai_run: 'every call to the model: purpose, tokens, cost in euro cents, duration (E4 budget)',
  user: 'better-auth: the signed-in person',
  session: 'better-auth: a browser session',
  account: 'better-auth: a sign-in method (magic link, Google, Microsoft) attached to a user',
  verification: 'better-auth: one-time tokens for magic links and email checks',
};

export function render() {
  const dir = join(ROOT, 'drizzle', 'meta');
  const snapFile = readdirSync(dir).filter((f) => f.endsWith('_snapshot.json')).sort().pop();
  const snap = JSON.parse(readFileSync(join(dir, snapFile), 'utf8'));
  const migrations = readdirSync(join(ROOT, 'drizzle')).filter((f) => f.endsWith('.sql')).sort();
  const journal = JSON.parse(readFileSync(join(dir, '_journal.json'), 'utf8'));
  const last = journal.entries[journal.entries.length - 1];
  const date = new Date(last.when).toISOString().slice(0, 10);
  const tables = Object.values(snap.tables);
  const byName = Object.fromEntries(tables.map((t) => [t.name, t]));
  const names = [...ORDER.filter((n) => byName[n]), ...tables.map((t) => t.name).filter((n) => !ORDER.includes(n))];
  const problems = tables.map((t) => t.name).filter((n) => !PURPOSE[n]).map((n) => `docs/schema.md: table ${n} has no purpose line in scripts/schema-doc.mjs`);
  const lines = [];
  lines.push('# Schema v1 (generated)', '', `v1, ${date} (the date of the latest migration, ${last.tag}).`, '',
    `Generated from the snapshot of the ${migrations.length} migration${migrations.length === 1 ? '' : 's'} in drizzle/ (${snapFile}) by`,
    '`node scripts/schema-doc.mjs --write`; the pre-commit hook fails when this file is stale. The design',
    'is in stories/E1-2-schema-v1.md and the enums in INTERFACES.md. Column types are Postgres types;',
    'fk = foreign key, pk = primary key. Triggers live in the custom migration',
    '(drizzle/0001_item_text_and_version_immutable.sql), not in the snapshot.', '',
    '## Rules', '',
    '- Every application table carries workspace_id with a foreign key to workspace. Child rows reference',
    '  their parent on (parent_id, workspace_id), so a row cannot point at another workspace\'s parent.',
    '  The better-auth tables (user, session, account, verification) are the exception: a user exists',
    '  before any workspace; workspace_member is the bridge. src/db/schema.test.ts checks it on every run.',
    '- Item text is never overwritten: original_text is kept beside reader_text, cannot be blank, and a',
    '  trigger refuses any update that changes it. item_set.version is never renumbered (trigger).',
    '- A response is pinned to the set version its instrument was built from: (instrument_id,',
    '  item_set_id) references instrument; its invite belongs to that instrument; an answer names an',
    '  item of that set version (answer.item_set_id); an instrument is built on a set of its own project.',
    '  Instruments, invites, set versions and items with responses or answers under them cannot be',
    '  deleted (on delete restrict). Deleting a workspace deletes everything in it (cascade); deleting',
    '  a project deletes its sets, items, instruments, invites, insights and runs, and is refused while',
    '  responses exist (decision 0028).',
    '- Enum columns are text with a check constraint, so adding a value is a plain migration.',
    '- Tokens (invite.token, response.device_token) are at least 32 characters; crypto.randomBytes(16)',
    '  as hex gives exactly 32.', '');
  for (const n of names) {
    const t = byName[n];
    lines.push(`## ${n}`, '', PURPOSE[n] ? PURPOSE[n] + '.' : '', '', '| Column | Type | Notes |', '|---|---|---|');
    const fks = Object.values(t.foreignKeys || {});
    const uniques = new Set(Object.values(t.indexes || {}).filter((i) => i.isUnique && i.columns.length === 1).map((i) => i.columns[0].expression));
    for (const c of Object.values(t.columns)) {
      const notes = [];
      if (c.primaryKey) notes.push('pk');
      for (const fk of fks.filter((f) => f.columnsFrom[0] === c.name)) {
        const rest = fk.columnsFrom.slice(1);
        notes.push(`fk ${fk.tableTo}.${fk.columnsTo[0]}${rest.length ? ' with ' + rest.join(', ') : ''}${fk.onDelete && fk.onDelete !== 'no action' ? ', on delete ' + fk.onDelete : ''}`);
      }
      if (c.notNull && !c.primaryKey) notes.push('not null');
      if (c.default !== undefined) notes.push('default ' + String(c.default).replace(/'/g, '').replace(/::\w+(\[\])?/g, ''));
      if (uniques.has(c.name) || c.isUnique) notes.push('unique');
      lines.push(`| ${c.name} | ${c.type} | ${notes.join(', ')} |`);
    }
    const pk = t.compositePrimaryKeys ? Object.values(t.compositePrimaryKeys) : [];
    for (const p of pk) lines.push('', `Primary key: (${p.columns.join(', ')}).`);
    const uqs = t.uniqueConstraints ? Object.values(t.uniqueConstraints) : [];
    if (uqs.length) lines.push('', 'Unique: ' + uqs.map((u) => `${u.name} on ${u.columns.join(', ')}`).join('; ') + '.');
    const composite = fks.filter((f) => f.columnsFrom.length > 1);
    if (composite.length) lines.push('', 'Foreign keys: ' + composite.map((f) => `${f.name} (${f.columnsFrom.join(', ')}) references ${f.tableTo} (${f.columnsTo.join(', ')})${f.onDelete && f.onDelete !== 'no action' ? ' on delete ' + f.onDelete : ''}`).join('; ') + '.');
    const checks = Object.values(t.checkConstraints || {});
    const idx = Object.values(t.indexes || {});
    const extra = [];
    if (idx.length) extra.push('Indexes: ' + idx.map((i) => `${i.name}${i.isUnique ? ' (unique)' : ''} on ${i.columns.map((c) => c.expression).join(', ')}`).join('; ') + '.');
    if (checks.length) extra.push('Checks: ' + checks.map((c) => `${c.name}: ${c.value.replace(/"/g, '')}`).join('; ') + '.');
    if (extra.length) lines.push('', ...extra);
    lines.push('');
  }
  return { text: lines.join('\n'), problems, tables: tables.length };
}

if (process.argv[1] && process.argv[1].endsWith('schema-doc.mjs')) {
  const { text, problems, tables } = render();
  for (const p of problems) console.log('STALE  ' + p);
  const path = join(ROOT, DOC);
  let current = ''; try { current = readFileSync(path, 'utf8'); } catch { current = ''; }
  if (process.argv.includes('--write')) { writeFileSync(path, text); console.log(`wrote  ${DOC}: ${tables} tables`); }
  else if (current !== text) { console.log(`STALE  ${DOC} does not match drizzle/meta. Run: node scripts/schema-doc.mjs --write`); process.exit(1); }
  else console.log(`${DOC} is current: ${tables} tables`);
  if (problems.length) process.exit(1);
}
