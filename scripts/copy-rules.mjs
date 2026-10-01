// The WRITING.md rules as code: em dashes and the banned words. Used by scan-copy.mjs and
// tested by copy-rules.test.mjs.
export const EM_DASH = String.fromCharCode(8212);

export const BANNED = [
  'honestly', 'genuinely', 'worth noting', 'i want to flag', 'for what it\'s worth', 'let me',
  'here\'s the thing', 'seamless', 'leverage', 'empower', 'unlock', 'elevate', 'robust', 'cutting-edge'
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RULES = BANNED.map((w) => ({ word: w, re: new RegExp('(^|[^a-z])' + escape(w) + '($|[^a-z])') }));

// Returns one problem per rule broken on the line: { kind: 'em dash' } or { kind: 'banned word', word }.
export function scanLine(line) {
  const problems = [];
  if (line.includes(EM_DASH)) problems.push({ kind: 'em dash' });
  const low = line.toLowerCase();
  for (const r of RULES) if (r.re.test(low)) problems.push({ kind: 'banned word', word: r.word });
  return problems;
}

// Returns [{ line: 1-based, ...problem }] for a whole text.
export function scanText(text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    for (const p of scanLine(line)) out.push({ line: i + 1, ...p });
  });
  return out;
}
