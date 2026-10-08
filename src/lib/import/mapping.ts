// Column mapping (stories/E3-3): each column of an upload maps to one role; the mapping is
// keyed by the column's header name (its letter when the file has no header) so the same
// headers in another order still map, and remembered per workspace under the sorted headers
// (headersKey). Pure; the storage is src/lib/uploads.ts. Copy: docs/copy/app.md and errors.md.
import type { ColumnMapping, ColumnRole } from "@/db/types";

// Each role with what it means, shown in the select as "label: hint" (Mihai, 2026-10-08: "make
// the items in this dropdown much more intuitive"; design note 120).
export const ROLES: { value: ColumnRole; label: string; hint: string }[] = [
  { value: "text", label: "Item text", hint: "the requirement itself, one per row" },
  { value: "area", label: "Area", hint: "the group or section the item belongs to" },
  { value: "value", label: "Proposed value", hint: "your priority for it, such as Must or Should" },
  { value: "ref", label: "Reference", hint: "the item's own id, such as CL-04" },
  { value: "context", label: "Context for the AI", hint: "background the AI reads when it shapes the list and writes actions; respondents never see it" },
  { value: "custom", label: "Custom field", hint: "extra detail kept with the item and shown to respondents under it" },
  { value: "skip", label: "Do not import", hint: "this column is left out" },
];
export const CUSTOM_MAX = 5;
export const SINGLE_ROLES: ColumnRole[] = ["text", "area", "value", "ref", "context"];

export const MAPPING_COPY = {
  intro: "Say what each column holds. One column must be the item text; the others are optional.",
  single: "Only one column can be the item text, the area, the proposed value, the reference or the context for the AI: picking one of these moves it here from the column that had it.",
  noText: "Pick the column that holds the requirement text. Without it there is nothing to import.",
  customLimit: "Up to five custom fields",
  remembered: (date: string) => `Mapping remembered from ${date}`,
  footer: "This mapping is remembered for files with the same headers.",
  // Several sheets (stories/E3-7, acceptance 4 and 5).
  sheetNoText: (sheets: string[], column: string) =>
    sheets.length === 1
      ? `Sheet ${sheets[0]} has no column ${column}. Untick it, or map the item text to a column every ticked sheet has.`
      : `Sheets ${sheets.slice(0, -1).join(", ")} and ${sheets[sheets.length - 1]} have no column ${column}. Untick them, or map the item text to a column every ticked sheet has.`,
  sheetAreas: "Use the sheet names as areas",
  sheetAreasHint: "Each item's area is the name of the sheet it came from.",
  sheetAreasOff: "No area column is mapped; the items come in without an area.",
};

export type Column = { letter: string; name: string };

// The key of each column in a mapping: its header, or its letter when the header is empty. A
// header that repeats, or that reads like another column's letter, gets its own letter added
// ("Requirement (B)"), so two columns never share a key (E3-3 audit, finding 1).
export function columnKeys(columns: Column[]): string[] {
  const plain = columns.map((c) => c.name.trim() || c.letter);
  return plain.map((key, i) => {
    // An unnamed column keeps its letter; a named one that clashes with another key gets its
    // letter added.
    const clash = columns[i].name.trim() !== "" && plain.some((other, j) => j !== i && other === key);
    return clash ? `${key} (${columns[i].letter})` : key;
  });
}

export function headersKey(columns: Column[]): string {
  return [...columnKeys(columns)].sort((a, b) => a.localeCompare(b)).join("\u001f");
}

// A first guess from the header names, so the usual file maps itself; anything unrecognised is
// not imported until the PM says so.
const GUESSES: { role: ColumnRole; test: RegExp }[] = [
  { role: "ref", test: /^(ref|reference|id|key|#|no\.?|number|code)$/i },
  { role: "text", test: /^(requirement|requirements|item|items|text|description|title|need|user story|story|feature|statement)$/i },
  { role: "area", test: /^(area|module|category|group|section|theme|epic|topic|domain)$/i },
  { role: "value", test: /^(priority|proposed value|value|moscow|rating|importance|score)$/i },
  { role: "context", test: /^(notes?|comments?|context|details?|background|rationale|why|remarks?)$/i },
];

export function guessMapping(columns: Column[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const keys = columnKeys(columns);
  const taken = new Set<ColumnRole>();
  columns.forEach((column, i) => {
    const name = column.name.trim();
    const guess = name ? GUESSES.find((g) => g.test.test(name) && !taken.has(g.role))?.role : undefined;
    const role: ColumnRole = guess ?? "skip";
    if (guess) taken.add(guess);
    mapping[keys[i]] = role;
  });
  // A headerless file: the first column is the text until the PM says otherwise.
  if (!Object.values(mapping).includes("text") && columns.length > 0 && columns.every((c) => !c.name.trim())) mapping[keys[0]] = "text";
  return mapping;
}

// A mapping as the form sends it: unknown keys and roles dropped, one column per single role,
// at most CUSTOM_MAX custom fields (the rest become skip). The latest pick wins a single role
// (2026-10-08; Mihai: "selecting Reference ... changes back to do not import"): the column the
// PM just changed keeps its role and any other column asking for the same one is not imported;
// without a changed column (a remembered mapping, a guess) the first in file order keeps it.
export function cleanMapping(columns: Column[], raw: Record<string, unknown>, changed?: string): ColumnMapping {
  const mapping: ColumnMapping = {};
  const keys = columnKeys(columns);
  const roleOf = (key: string): ColumnRole => (ROLES.some((r) => r.value === raw[key]) ? (raw[key] as ColumnRole) : "skip");
  const taken = new Set<ColumnRole>();
  const winner = changed !== undefined && keys.includes(changed) && SINGLE_ROLES.includes(roleOf(changed)) ? changed : null;
  if (winner) taken.add(roleOf(winner));
  let custom = 0;
  for (const key of keys) {
    let role = roleOf(key);
    if (SINGLE_ROLES.includes(role) && key !== winner) {
      if (taken.has(role)) role = "skip";
      else taken.add(role);
    }
    if (role === "custom") {
      if (custom >= CUSTOM_MAX) role = "skip";
      else custom += 1;
    }
    mapping[key] = role;
  }
  return mapping;
}

export function customCount(mapping: ColumnMapping): number {
  return Object.values(mapping).filter((r) => r === "custom").length;
}

export function mappingError(mapping: ColumnMapping): string | null {
  return Object.values(mapping).includes("text") ? null : MAPPING_COPY.noText;
}

// The mapping applied to the columns of another file with the same headers: keys that are not
// there are dropped, columns it does not know are skipped.
export function applyMapping(columns: Column[], remembered: ColumnMapping): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const key of columnKeys(columns)) mapping[key] = remembered[key] ?? "skip";
  return mapping;
}

// Several sheets (stories/E3-7, acceptance 4): the ticked sheets whose header does not carry
// the column mapped as item text, with that column's key; null when every sheet has it or no
// column is the text.
export function sheetsMissingText(sheets: { name: string; columns: Column[] }[], mapping: ColumnMapping): { column: string; sheets: string[] } | null {
  const column = Object.keys(mapping).find((key) => mapping[key] === "text");
  if (!column) return null;
  const missing = sheets.filter((s) => !columnKeys(s.columns).includes(column)).map((s) => s.name);
  return missing.length > 0 ? { column, sheets: missing } : null;
}

export function sheetsMissingTextError(missing: { column: string; sheets: string[] } | null): string | null {
  return missing ? MAPPING_COPY.sheetNoText(missing.sheets, missing.column) : null;
}
