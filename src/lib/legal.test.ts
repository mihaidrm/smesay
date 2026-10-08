// The legal pages (stories/E11-3): each of the four files in docs/legal/ parses, carries its
// version and date, keeps its lawyer's markers (brackets inside one included), and turns /legal/
// addresses standing on their own into links; the contact address stays text; a file without
// the header or with an impossible date is refused; text after a heading and a wrapped list
// item are kept.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inline, LEGAL_PAGES, markersIn, parseLegal, readLegal } from "./legal";

describe("legal pages", () => {
  it("parse with a version, a date, a title and no marker (the lawyer approved the paragraphs of 2026-10-08)", () => {
    for (const page of LEGAL_PAGES) {
      const doc = readLegal(page);
      expect([doc.version, doc.date]).toEqual([4, "2026-10-08"]);
      expect(doc.blocks[0].kind).toBe("h1");
      expect(markersIn(readFileSync(`docs/legal/${page}.md`, "utf8")).length).toBe(0);
      expect(doc.blocks.some((b) => (b.kind === "ul" ? b.items.flat() : b.parts).some((p) => p.kind === "marker"))).toBe(false);
    }
  });
  it("caps liability at the fees paid, nothing on the free plan, and makes paying after a trial acceptance", () => {
    const text = readFileSync("docs/legal/terms.md", "utf8");
    expect(text).toContain("limited to the fees you paid Alerty in the 12 months before the event. On the free plan you pay nothing, so by using it you accept that you cannot claim anything from Alerty.");
    expect(text).toContain("If you carry on after the trial ends and start paying, you accept these terms from that day, every section included.");
    expect(text).not.toContain("EUR");
  });
  it("names what the privacy policy must cover", () => {
    const text = readFileSync("docs/legal/privacy.md", "utf8");
    for (const words of ["Alerty S.R.L.", "24 hours", "The fields the person running the validation chose", "Anthropic", "Exports you make", "Frankfurt", "closing question", "smesay-answers", "user agent", "15 minutes"]) expect(text).toContain(words);
  });
  it("turns markers and legal addresses into parts, and keeps the contact as text", () => {
    expect(inline("See /legal/dpa or write to hello@smesay.com. [LAWYER: set [N] days.] Done.")).toEqual([
      { kind: "text", text: "See " }, { kind: "link", text: "/legal/dpa", href: "/legal/dpa" },
      { kind: "text", text: " or write to hello@smesay.com. " }, { kind: "marker", text: "[LAWYER: set [N] days.]" }, { kind: "text", text: " Done." },
    ]);
    expect(markersIn("[LAWYER: set [N] days.] and [LAWYER: b]")).toEqual(["[LAWYER: set [N] days.]", "[LAWYER: b]"]);
    expect(inline("https://smesay.com/legal/privacyX and /legal/terms/old")).toEqual([{ kind: "text", text: "https://smesay.com/legal/privacyX and /legal/terms/old" }]);
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
