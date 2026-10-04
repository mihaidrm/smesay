// The legal pages (stories/E11-3): Markdown files in docs/legal/, versioned by commit, read and
// parsed here into blocks the page renders with the design system's type. The Markdown is the
// small set the drafts use: a header ("version: N", "date: YYYY-MM-DD", then "---"), "# " and
// "## " headings, "- " list items and paragraphs. Inline, "[LAWYER: ...]" markers (decision 0004
// item 3) are kept and shown, and /legal/ addresses, hello@smesay.app and the authority's site
// become links. Nothing is rendered as HTML: the page builds elements from these parts. No
// database import.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const LEGAL_PAGES = ["privacy", "terms", "dpa", "subprocessors"] as const;
export type LegalPage = (typeof LEGAL_PAGES)[number];
export const LEGAL_TITLES: Record<LegalPage, string> = { privacy: "Privacy policy", terms: "Terms of service", dpa: "Data processing agreement", subprocessors: "Subprocessors" };

export type Inline = { kind: "text" | "marker"; text: string } | { kind: "link"; text: string; href: string };
export type Block = { kind: "h1" | "h2" | "p"; parts: Inline[] } | { kind: "ul"; items: Inline[][] };
export type LegalDoc = { version: number; date: string; blocks: Block[] };

const INLINE = /(\[LAWYER:[^\]]*\])|(\/legal\/(?:privacy|terms|dpa|subprocessors))|(hello@smesay\.app)|(www\.dataprotection\.ro)/g;

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push({ kind: "text", text: text.slice(at, m.index) });
    if (m[1]) out.push({ kind: "marker", text: m[1] });
    else if (m[2]) out.push({ kind: "link", text: m[2], href: m[2] });
    else if (m[3]) out.push({ kind: "link", text: m[3], href: `mailto:${m[3]}` });
    else out.push({ kind: "link", text: m[4], href: `https://${m[4]}` });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ kind: "text", text: text.slice(at) });
  return out;
}

export function parseLegal(source: string): LegalDoc {
  const [head, ...rest] = source.split(/^---$/m);
  const version = Number(head.match(/^version:\s*(\d+)\s*$/m)?.[1]);
  const date = head.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1];
  if (!Number.isInteger(version) || !date || rest.length === 0) throw new Error("A legal page starts with version: N, date: YYYY-MM-DD and ---");
  const blocks: Block[] = [];
  for (const chunk of rest.join("---").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines[0].startsWith("# ")) blocks.push({ kind: "h1", parts: inline(lines[0].slice(2)) });
    else if (lines[0].startsWith("## ")) blocks.push({ kind: "h2", parts: inline(lines[0].slice(3)) });
    else if (lines.every((l) => l.startsWith("- "))) blocks.push({ kind: "ul", items: lines.map((l) => inline(l.slice(2))) });
    else blocks.push({ kind: "p", parts: inline(lines.join(" ")) });
  }
  return { version, date, blocks };
}

export const readLegal = (page: LegalPage): LegalDoc => parseLegal(readFileSync(join(process.cwd(), "docs/legal", `${page}.md`), "utf8"));

// "[LAWYER: ...]" markers per page (npm run legal:markers, docs/accounts.md step 12).
export const markersIn = (source: string): string[] => source.match(/\[LAWYER:[^\]]*\]/g) ?? [];
