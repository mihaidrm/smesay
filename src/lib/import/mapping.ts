// Column mapping (stories/E3-3): each column of an upload maps to one role; the mapping is
// keyed by the column's header name (its letter when the file has no header) so the same
// headers in another order still map, and remembered per workspace under the sorted headers
// (headersKey). Pure; the storage is src/lib/uploads.ts. Copy: docs/copy/app.md and errors.md.
import type { ColumnMapping, ColumnRole } from "@/db/types";

export const ROLES: { value: ColumnRole; label: string }[] = [
  { value: "text", label: "Item text" },
  { value: "area", label: "Area" },
  { value: "value", label: "Proposed value" },
  { value: "ref", label: "Reference" },
  { value: "custom", label: "Custom field" },
  { value: "skip", label: "Do not import" },
];
export const CUSTOM_MAX = 5;
export const SINGLE_ROLES: ColumnRole[] = ["text", "area", "value", "ref"];

export const MAPPING_COPY = {
  noText: "Pick the column that holds the requirement text. Without it there is nothing to import.",
  customLimit: "Up to five custom fields",
  remembered: (date: string) => `Mapping remembered from ${date}`,
  footer: "This mapping is remembered for files with the same headers.",
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

// A mapping as the form sends it: unknown keys and roles dropped, one column per single role
// (the first wins), at most CUSTOM_MAX custom fields (the rest become skip).
export function cleanMapping(columns: Column[], raw: Record<string, unknown>): ColumnMapping {
  const mapping: ColumnMapping = {};
  const taken = new Set<ColumnRole>();
  let custom = 0;
  for (const key of columnKeys(columns)) {
    const value = raw[key];
    let role: ColumnRole = ROLES.some((r) => r.value === value) ? (value as ColumnRole) : "skip";
    if (SINGLE_ROLES.includes(role)) {
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
