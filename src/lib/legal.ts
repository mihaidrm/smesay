// The legal pages (stories/E11-3): Markdown files in docs/legal/, versioned by commit, read and
// parsed here into blocks the page renders with the design system's type. The Markdown is the
// small set the drafts use: a header ("version: N", "date: YYYY-MM-DD", then "---"), "# " and
// "## " headings, "- " list items (a line that does not start a new item continues the last
// one) and paragraphs. Inline, "[LAWYER: ...]" markers (decision 0004 item 3) are kept and
// shown, one level of brackets inside a marker included, and /legal/ addresses and the
// authority's site become links. hello@smesay.app stays text until the domain is bought
// (docs/copy/landing.md). Nothing is rendered as HTML: the page builds elements from these
// parts. No database import.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LEGAL_PAGES = ["privacy", "terms", "dpa", "subprocessors"] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];
export const LEGAL_TITLES: Record<LegalPage, string> = { privacy: "Privacy policy", terms: "Terms of service", dpa: "Data processing agreement", subprocessors: "Subprocessors" };

export type Inline = { kind: "text" | "marker"; text: string } | { kind: "link"; text: string; href: string };
export type Block = { kind: "h1" | "h2" | "p"; parts: Inline[] } | { kind: "ul"; items: Inline[][] };
export type LegalDoc = { version: number; date: string; blocks: Block[] };

// A marker may hold one level of brackets ("[LAWYER: set [N] days]"). A /legal/ address is a
// link only on its own, not inside a longer address or word.
const MARKER = String.raw`\[LAWYER:(?:[^\[\]]|\[[^\[\]]*\])*\]`;
const INLINE = new RegExp(String.raw`(${MARKER})|(?<![\w./])(\/legal\/(?:privacy|terms|dpa|subprocessors))(?![\w/])|(?<![\w./])(www\.dataprotection\.ro)(?![\w/])`, "g");

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push({ kind: "text", text: text.slice(at, m.index) });
    if (m[1]) out.push({ kind: "marker", text: m[1] });
    else if (m[2]) out.push({ kind: "link", text: m[2], href: m[2] });
    else out.push({ kind: "link", text: m[3], href: `https://${m[3]}` });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

// A real calendar date: 2026-13-45 is refused, so the page's date format cannot throw at build.
const isDate = (d: string) => { const t = new Date(`${d}T00:00:00Z`); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d; };

export function parseLegal(source: string): LegalDoc {
  const [head, ...rest] = source.split(/^---$/m);
  const version = Number(head.match(/^version:\s*(\d+)\s*$/m)?.[1]);
  const date = head.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1];
  if (!Number.isInteger(version) || !date || !isDate(date) || rest.length === 0) throw new Error("A legal page starts with version: N, date: YYYY-MM-DD and ---");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (para.length > 0) blocks.push({ kind: "p", parts: inline(para.join(" ")) });
    if (list) blocks.push({ kind: "ul", items: list.map(inline) });
    para = [];
    list = null;
  };
  for (const raw of rest.join("---").split("\n")) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("# ")) { flush(); blocks.push({ kind: "h1", parts: inline(line.slice(2)) }); }
    else if (line.startsWith("## ")) { flush(); blocks.push({ kind: "h2", parts: inline(line.slice(3)) }); }
    else if (line.startsWith("- ")) { if (para.length > 0) flush(); (list ??= []).push(line.slice(2)); }
    else if (list) list[list.length - 1] += ` ${line}`;
    else para.push(line);
  }
  flush();
  return { version, date, blocks };
}

export const readLegal = (page: LegalPage): LegalDoc => parseLegal(readFileSync(join(process.cwd(), "docs/legal", `${page}.md`), "utf8"));

// "[LAWYER: ...]" markers per page (npm run legal:markers, docs/accounts.md step 12).
export const markersIn = (source: string): string[] => source.match(new RegExp(MARKER, "g")) ?? [];
