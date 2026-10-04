// The legal pages (stories/E11-3): each of the four files in docs/legal/ parses, carries its
// version and date, keeps its lawyer's markers, and turns /legal/ addresses and the contact
// address into links; a file without the header is refused.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inline, LEGAL_PAGES, markersIn, parseLegal, readLegal } from "./legal";

describe("legal pages", () => {
  it("parse with a version, a date, a title and at least one marker each", () => {
    for (const page of LEGAL_PAGES) {
      const doc = readLegal(page);
      expect([doc.version, doc.date]).toEqual([1, "2026-10-04"]);
      expect(doc.blocks[0].kind).toBe("h1");
      expect(markersIn(readFileSync(`docs/legal/${page}.md`, "utf8")).length).toBeGreaterThan(0);
      expect(doc.blocks.some((b) => (b.kind === "ul" ? b.items.flat() : b.parts).some((p) => p.kind === "marker"))).toBe(true);
    }
  });
  it("names what the privacy policy must cover", () => {
    const text = readFileSync("docs/legal/privacy.md", "utf8");
    for (const words of ["Alerty S.R.L.", "24 hours", "Only the fields the person running the validation chose", "Anthropic", "Exports you make", "landing page", "Frankfurt"]) expect(text).toContain(words);
  });
  it("turns markers, legal addresses and the contact into parts", () => {
    expect(inline("See /legal/dpa or write to hello@smesay.app. [LAWYER: confirm.] Done.")).toEqual([
      { kind: "text", text: "See " }, { kind: "link", text: "/legal/dpa", href: "/legal/dpa" }, { kind: "text", text: " or write to " },
      { kind: "link", text: "hello@smesay.app", href: "mailto:hello@smesay.app" }, { kind: "text", text: ". " }, { kind: "marker", text: "[LAWYER: confirm.]" }, { kind: "text", text: " Done." },
    ]);
  });
  it("reads headings, lists and paragraphs, and refuses a file without its header", () => {
    expect(parseLegal("version: 2\ndate: 2026-11-01\n---\n# Title\n\n## Part\n\n- one\n- two\n\nA line\nwrapped.").blocks.map((b) => b.kind)).toEqual(["h1", "h2", "ul", "p"]);
    expect(() => parseLegal("# No header")).toThrow();
  });
});
