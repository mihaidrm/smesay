// The legal pages (stories/E11-3): each of the four files in docs/legal/ parses, carries its
// version and date, keeps its lawyer's markers (brackets inside one included), and turns /legal/
// addresses standing on their own into links; the contact address stays text; a file without
// the header or with an impossible date is refused; text after a heading and a wrapped list
// item are kept.
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
    for (const words of ["Alerty S.R.L.", "24 hours", "The fields the person running the validation chose", "Anthropic", "Exports you make", "Frankfurt", "closing question", "smesay-answers", "user agent", "15 minutes"]) expect(text).toContain(words);
  });
  it("turns markers and legal addresses into parts, and keeps the contact as text", () => {
    expect(inline("See /legal/dpa or write to hello@smesay.app. [LAWYER: set [N] days.] Done.")).toEqual([
      { kind: "text", text: "See " }, { kind: "link", text: "/legal/dpa", href: "/legal/dpa" },
      { kind: "text", text: " or write to hello@smesay.app. " }, { kind: "marker", text: "[LAWYER: set [N] days.]" }, { kind: "text", text: " Done." },
    ]);
    expect(markersIn("[LAWYER: set [N] days.] and [LAWYER: b]")).toEqual(["[LAWYER: set [N] days.]", "[LAWYER: b]"]);
    expect(inline("https://smesay.app/legal/privacyX and /legal/terms/old")).toEqual([{ kind: "text", text: "https://smesay.app/legal/privacyX and /legal/terms/old" }]);
  });
  it("reads headings, lists and paragraphs, and refuses a file without its header", () => {
    expect(parseLegal("version: 2\ndate: 2026-11-01\n---\n# Title\n\n## Part\n\n- one\n- two\n\nA line\nwrapped.").blocks.map((b) => b.kind)).toEqual(["h1", "h2", "ul", "p"]);
    expect(() => parseLegal("# No header")).toThrow();
    expect(() => parseLegal("version: 1\ndate: 2026-13-45\n---\n# T")).toThrow();
    const doc = parseLegal("version: 1\ndate: 2026-10-04\n---\n# T\n## Part\nBody line\n- one\n  wrapped\n- two");
    expect(doc.blocks.map((b) => b.kind)).toEqual(["h1", "h2", "p", "ul"]);
    expect(doc.blocks[3]).toEqual({ kind: "ul", items: [[{ kind: "text", text: "one wrapped" }], [{ kind: "text", text: "two" }]] });
  });
});
