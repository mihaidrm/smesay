// The summary's page note (stories/E10-3, acceptance 4): over the limit the note names the page
// count; at or under it, and for a file without pages, there is none. Since decision 0048 the
// generated 200-item case runs to 27 pages, under the limit, so this is where the note is tested.
import { describe, expect, it } from "vitest";
import { EXPORT_COPY, SUMMARY_PAGE_LIMIT } from "@/lib/export/copy";
import { pagesNote } from "./export-download";

const pages = { limit: SUMMARY_PAGE_LIMIT, note: EXPORT_COPY.tab.summary.overLimit("{pages}") };

describe("summary page note", () => {
  it("shows over the limit only, with the count", () => {
    expect(pagesNote(31, pages)).toBe(EXPORT_COPY.tab.summary.overLimit(31));
    expect(pagesNote(30, pages)).toBeNull();
    expect(pagesNote(27, pages)).toBeNull();
    expect(pagesNote(31, undefined)).toBeNull();
  });
});
