// The respondent fields of an instrument (stories/E5-1, acceptance 2 and 4; INTERFACES.md,
// RespondentFieldSpec): the rule on labels, keys and options, with no database import so the
// Build form and the About you page can use it. A label is 1 to 60 characters, an instrument
// has 1 to 8 fields, a dropdown has 2 to 20 different options (each up to 60 characters), and
// the key is the label's slug, unique in the instrument (-2, -3 when two labels slug the
// same). Messages: docs/copy/errors.md, Build and Share.
import type { RespondentFieldSpec, ResponseFields } from "@/db/types";

export const FIELD_LABEL_MAX = 60;
export const FIELDS_MAX = 8;
export const OPTIONS_MIN = 2;
export const OPTIONS_MAX = 20;
export const FIELD_TYPES = ["text", "dropdown", "email"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABEL: Record<FieldType, string> = { text: "Text", dropdown: "Dropdown", email: "Email" };

export const FIELDS_COPY = {
  // The two the story names (docs/copy/errors.md).
  lastField: "Keep at least one field, so you can tell answers apart. Name is the usual one.",
  introHint: "Write one or two lines so respondents know what the list is for. They see this first.",
  startHint: "Fill in your name and role to start.",
  tooMany: `Up to ${FIELDS_MAX} fields. Remove one to add another.`,
  badLabel: `Give every field a label, up to ${FIELD_LABEL_MAX} characters.`,
  badOptions: `A dropdown needs ${OPTIONS_MIN} to ${OPTIONS_MAX} different options, one per line, each up to ${FIELD_LABEL_MAX} characters.`,
  badType: "Pick a type for every field: Text, Dropdown or Email.",
  badShape: "The fields did not reach the server as a list. Reload the page and try again.",
} as const;

// Name and Role, both text and required (stories/E5-1, acceptance 2). Role is text, not a
// dropdown, until the PM types the roles: nothing can guess them (design note 38).
export const DEFAULT_FIELDS: RespondentFieldSpec[] = [
  { key: "name", label: "Name", type: "text", mandatory: true },
  { key: "role", label: "Role", type: "text", mandatory: true },
];

// What the Build form posts, one per row, before the keys exist. options is one option per
// line when the row is a dropdown.
export type FieldInput = { label: string; type: string; mandatory: boolean; options?: string };

// The label in lower case, accents dropped, runs of anything but letters and digits as one
// hyphen (the slug rule of src/lib/workspace-name.ts); "field" when nothing is left.
export function fieldKey(label: string): string {
  const slug = label.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "field";
}

// Keys in order, each unique: the second "Role" becomes role-2.
export function uniqueKeys(labels: string[]): string[] {
  const taken = new Set<string>();
  return labels.map((label) => {
    const base = fieldKey(label);
    let key = base;
    for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
    taken.add(key);
    return key;
  });
}

const isFieldType = (value: unknown): value is FieldType => typeof value === "string" && (FIELD_TYPES as readonly string[]).includes(value);

// Options as the form posts them (one per line) or as stored (a list of strings); null when
// anything in them is not a string.
export function parseOptions(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) return [];
  if (typeof raw === "string") return raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!Array.isArray(raw) || raw.some((o) => typeof o !== "string")) return null;
  return raw.map((l) => l.trim()).filter(Boolean);
}

// The server-side rule (acceptance 4), run on what the form posted. The first problem wins;
// the message says what to change. The result carries the keys.
export function parseFields(raw: unknown): { error: string } | { fields: RespondentFieldSpec[] } {
  if (!Array.isArray(raw) || raw.some((r) => typeof r !== "object" || r === null)) return { error: FIELDS_COPY.badShape };
  const rows = raw as Record<string, unknown>[];
  if (rows.length === 0) return { error: FIELDS_COPY.lastField };
  if (rows.length > FIELDS_MAX) return { error: FIELDS_COPY.tooMany };
  const labels: string[] = [];
  const parsed: Omit<RespondentFieldSpec, "key">[] = [];
  for (const row of rows) {
    if (typeof row.label !== "string") return { error: FIELDS_COPY.badShape };
    const label = row.label.trim();
    if (label.length < 1 || label.length > FIELD_LABEL_MAX) return { error: FIELDS_COPY.badLabel };
    if (!isFieldType(row.type)) return { error: FIELDS_COPY.badType };
    const mandatory = row.mandatory === true || row.mandatory === "true" || row.mandatory === "on";
    if (row.type === "dropdown") {
      const options = parseOptions(row.options);
      if (options === null) return { error: FIELDS_COPY.badShape };
      const distinct = new Set(options.map((o) => o.toLowerCase()));
      if (options.length < OPTIONS_MIN || options.length > OPTIONS_MAX || distinct.size !== options.length || options.some((o) => o.length > FIELD_LABEL_MAX)) return { error: FIELDS_COPY.badOptions };
      parsed.push({ label, type: "dropdown", mandatory, options });
    } else {
      parsed.push({ label, type: row.type, mandatory });
    }
    labels.push(label);
  }
  const keys = uniqueKeys(labels);
  return { fields: parsed.map((f, i) => ({ key: keys[i], ...f })) };
}

// The one-line summary of a field on the Build card (the PM app board: "Dropdown, 4
// options, mandatory").
export function fieldSummary(field: RespondentFieldSpec): string {
  const type = field.type === "dropdown" ? `Dropdown, ${field.options?.length ?? 0} options` : FIELD_TYPE_LABEL[field.type];
  return `${type}, ${field.mandatory ? "required" : "optional"}`;
}

// The mandatory fields still empty (stories/E5-1, acceptance 3; E7-1, acceptance 2): Start
// stays disabled while any is. Whitespace does not count as filled.
export function missingMandatory(fields: RespondentFieldSpec[], values: ResponseFields): string[] {
  return fields.filter((f) => f.mandatory && !(values[f.key] ?? "").trim()).map((f) => f.key);
}
