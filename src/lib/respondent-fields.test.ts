// The respondent field rule (stories/E5-1, acceptance 2 and 4): keys from labels, unique per
// instrument; label length, field count and dropdown options refused with the errors.md
// message; the mandatory check behind the disabled Start.
import { describe, expect, it } from "vitest";
import { DEFAULT_FIELDS, FIELDS_COPY, fieldKey, fieldSummary, missingMandatory, parseFields, uniqueKeys } from "./respondent-fields";

describe("field keys", () => {
  it("slugs the label and keeps duplicates apart", () => {
    expect(fieldKey("Your name")).toBe("your-name");
    expect(fieldKey("Rôle / team")).toBe("role-team");
    expect(fieldKey("??")).toBe("field");
    expect(uniqueKeys(["Role", "role", "Role", "Name"])).toEqual(["role", "role-2", "role-3", "name"]);
  });
});

describe("parseFields", () => {
  const ok = (raw: unknown) => { const r = parseFields(raw); if ("error" in r) throw new Error(r.error); return r.fields; };
  it("accepts the defaults and a dropdown, trimming and keying", () => {
    expect(ok(DEFAULT_FIELDS)).toEqual(DEFAULT_FIELDS);
    const fields = ok([{ label: " Name ", type: "text", mandatory: "on" }, { label: "Role", type: "dropdown", mandatory: true, options: "Sales\n\n Finance \nHR" }, { label: "Email", type: "email", mandatory: false }]);
    expect(fields).toEqual([
      { key: "name", label: "Name", type: "text", mandatory: true },
      { key: "role", label: "Role", type: "dropdown", mandatory: true, options: ["Sales", "Finance", "HR"] },
      { key: "email", label: "Email", type: "email", mandatory: false },
    ]);
  });
  it("refuses an empty list, a ninth field, a bad label, a bad type and bad options", () => {
    expect(parseFields([])).toEqual({ error: FIELDS_COPY.lastField });
    expect(parseFields(Array.from({ length: 9 }, (_, i) => ({ label: `F${i}`, type: "text", mandatory: false })))).toEqual({ error: FIELDS_COPY.tooMany });
    expect(parseFields([{ label: "  ", type: "text", mandatory: false }])).toEqual({ error: FIELDS_COPY.badLabel });
    expect(parseFields([{ label: "x".repeat(61), type: "text", mandatory: false }])).toEqual({ error: FIELDS_COPY.badLabel });
    expect(parseFields([{ label: "Name", type: "number", mandatory: false }])).toEqual({ error: FIELDS_COPY.badType });
    expect(parseFields([{ label: "Role", type: "dropdown", mandatory: true, options: "Sales" }])).toEqual({ error: FIELDS_COPY.badOptions });
    expect(parseFields([{ label: "Role", type: "dropdown", mandatory: true, options: "Sales\nsales" }])).toEqual({ error: FIELDS_COPY.badOptions });
    expect(parseFields([{ label: "Role", type: "dropdown", mandatory: true, options: Array.from({ length: 21 }, (_, i) => `O${i}`).join("\n") }])).toEqual({ error: FIELDS_COPY.badOptions });
    expect(parseFields("nope")).toEqual({ error: FIELDS_COPY.badShape });
    expect(parseFields([null])).toEqual({ error: FIELDS_COPY.badShape });
  });
  it("takes eight fields and twenty options", () => {
    expect(ok(Array.from({ length: 8 }, (_, i) => ({ label: `F${i}`, type: "text", mandatory: false }))).length).toBe(8);
    expect(ok([{ label: "Role", type: "dropdown", mandatory: true, options: Array.from({ length: 20 }, (_, i) => `O${i}`) }])[0].options?.length).toBe(20);
  });
});

describe("summaries and the mandatory check", () => {
  it("writes the card line", () => {
    expect(fieldSummary(DEFAULT_FIELDS[0])).toBe("Text, required");
    expect(fieldSummary({ key: "role", label: "Role", type: "dropdown", mandatory: true, options: ["a", "b", "c", "d"] })).toBe("Dropdown, 4 options, required");
    expect(fieldSummary({ key: "email", label: "Email", type: "email", mandatory: false })).toBe("Email, optional");
  });
  it("lists the mandatory fields still empty", () => {
    expect(missingMandatory(DEFAULT_FIELDS, {})).toEqual(["name", "role"]);
    expect(missingMandatory(DEFAULT_FIELDS, { name: "Ana", role: "  " })).toEqual(["role"]);
    expect(missingMandatory(DEFAULT_FIELDS, { name: "Ana", role: "Sales" })).toEqual([]);
    expect(missingMandatory([{ key: "email", label: "Email", type: "email", mandatory: false }], {})).toEqual([]);
  });
});
