import { describe, expect, it } from "vitest";
import { IMPORT_CARD_COPY, importStage, openCards } from "./import-guide";

const only = (name: keyof ReturnType<typeof openCards>) => ({ versions: false, about: false, list: false, preview: false, mapping: false, check: false, [name]: true });

describe("importStage", () => {
  it("is noList without an upload", () => {
    expect(importStage({ hasUpload: false, mappingReady: false, imported: false })).toBe("noList");
  });
  it("is mapping while the upload has no text column", () => {
    expect(importStage({ hasUpload: true, mappingReady: false, imported: false })).toBe("mapping");
  });
  it("is ready once the text column is picked", () => {
    expect(importStage({ hasUpload: true, mappingReady: true, imported: false })).toBe("ready");
  });
  it("is imported once the latest upload is a version", () => {
    expect(importStage({ hasUpload: true, mappingReady: true, imported: true })).toBe("imported");
  });
});

describe("openCards", () => {
  it("opens The list alone before an upload", () => {
    expect(openCards("noList")).toEqual(only("list"));
  });
  it("opens About alone on the sample, which has no list card", () => {
    expect(openCards("noList", { canUpload: false })).toEqual(only("about"));
  });
  it("opens Preview and the mapping while the text column is missing", () => {
    expect(openCards("mapping")).toEqual({ ...only("preview"), mapping: true });
  });
  it("opens the check alone once the mapping is ready", () => {
    expect(openCards("ready")).toEqual(only("check"));
  });
  it("opens Versions alone once everything is imported", () => {
    expect(openCards("imported")).toEqual(only("versions"));
  });
});

describe("IMPORT_CARD_COPY", () => {
  it("writes the summaries", () => {
    expect(IMPORT_CARD_COPY.versions.summary(2, 1200)).toBe("Version 2, 1,200 items");
    expect(IMPORT_CARD_COPY.versions.summary(1, 1)).toBe("Version 1, 1 item");
    expect(IMPORT_CARD_COPY.about.summary("", "  ")).toBe("Nothing written yet");
    expect(IMPORT_CARD_COPY.about.summary("Replace the expense tool", "")).toBe("24 of 2,000 characters");
    expect(IMPORT_CARD_COPY.list.summary(null)).toBe("No list yet");
    expect(IMPORT_CARD_COPY.list.summary("expense-requirements.xlsx")).toBe("expense-requirements.xlsx");
    expect(IMPORT_CARD_COPY.preview.summary({ kind: "xlsx", rows: 12, headerRow: 1 })).toBe("12 rows, header on row 1");
    expect(IMPORT_CARD_COPY.preview.summary({ kind: "csv", rows: 13, headerRow: null })).toBe("13 rows, no header row");
    expect(IMPORT_CARD_COPY.preview.summary({ kind: "pasted", rows: 6, headerRow: null })).toBe("6 items");
    expect(IMPORT_CARD_COPY.preview.summary({ kind: "xlsx", rows: 7, headerRow: null, sheets: "waiting" })).toBe("Pick the sheets");
    expect(IMPORT_CARD_COPY.preview.summary({ kind: "xlsx", rows: 5, headerRow: 1, sheets: 2 })).toBe("5 rows across 2 sheets");
    expect(IMPORT_CARD_COPY.mapping.summary(3, 4, true)).toBe("3 of 4 columns mapped");
    expect(IMPORT_CARD_COPY.mapping.summary(2, 4, false)).toBe("No text column yet");
    expect(IMPORT_CARD_COPY.check.summary(null, null)).toBe("Waiting for the text column");
    expect(IMPORT_CARD_COPY.check.summary(12, null)).toBe("12 items ready");
    expect(IMPORT_CARD_COPY.check.summary(12, 1)).toBe("Imported as version 1");
  });
});
