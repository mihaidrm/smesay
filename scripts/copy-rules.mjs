// The WRITING.md rules as code: em dashes and the banned words. Used by scan-copy.mjs and
// tested by copy-rules.test.mjs.
export const EM_DASH = String.fromCharCode(8212);

export const BANNED = [
  'honestly', 'genuinely', 'worth noting', 'i want to flag', 'for what it\'s worth', 'let me',
  'here\'s the thing', 'seamless', 'leverage', 'empower', 'unlock', 'elevate', 'robust', 'cutting-edge'
];

// Banned in the product's code only (src/): docs and stories quote them as the rule
// (docs/copy/errors.md, "Never 'invalid input'"; stories/E11-6, acceptance 4).
export const BANNED_IN_SRC = ['invalid input'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rule = (w) => ({ word: w, re: new RegExp('(^|[^a-z])' + escape(w) + '($|[^a-z])') });
const RULES = BANNED.map(rule);
const SRC_RULES = BANNED_IN_SRC.map(rule);

// Returns one problem per rule broken on the line: { kind: 'em dash' } or { kind: 'banned word', word }.
// src: the line is from the product's code, where BANNED_IN_SRC applies too.
export function scanLine(line, { src = false } = {}) {
  const problems = [];
  if (line.includes(EM_DASH)) problems.push({ kind: 'em dash' });
  const low = line.toLowerCase();
  for (const r of src ? [...RULES, ...SRC_RULES] : RULES) if (r.re.test(low)) problems.push({ kind: 'banned word', word: r.word });
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
