// Which text an item shows (stories/E4-3, acceptance 2 and 4; decision 0009 item 2): the
// reader version only where the PM accepted it, the original everywhere else. A reader
// version that is the original again, give or take whitespace, is nothing to accept. No
// database import: the respondent side and the preview (E5-6, E7) read this too.
// The same list as READER_STATUSES in src/db/schema.ts.
export type ReaderStatus = "suggested" | "accepted" | "rejected";

export type ReaderFields = { originalText: string; readerText: string | null; readerStatus: ReaderStatus | null };

const fold = (s: string) => s.replace(/\s+/g, " ").trim();

export function textFor(item: ReaderFields): string {
  return item.readerStatus === "accepted" && item.readerText ? item.readerText : item.originalText;
}

export function readerIsOriginal(item: ReaderFields): boolean {
  return item.readerText !== null && fold(item.readerText) === fold(item.originalText);
}

// An item with a reader version worth a decision: one exists and differs from the original.
export function hasReaderVersion(item: ReaderFields): boolean {
  return item.readerText !== null && !readerIsOriginal(item);
}

export function readerCounts(items: ReaderFields[]): { accepted: number; total: number } {
  const withReader = items.filter(hasReaderVersion);
  return { accepted: withReader.filter((it) => it.readerStatus === "accepted").length, total: withReader.length };
}
