// The attached file tile's line (stories/E3-2, changed 2026-10-08): kind and size for a file,
// the item count for a pasted list.
import { describe, expect, it } from "vitest";
import { attachedFileMeta } from "./attached";

describe("attachedFileMeta", () => {
  it("names a file's kind and size, and a pasted list's items", () => {
    expect(attachedFileMeta({ kind: "xlsx", byteSize: 319_488, preview: { rowsRead: 143 } })).toBe("xlsx file, 312 KB");
    expect(attachedFileMeta({ kind: "csv", byteSize: 900, preview: { rowsRead: 12 } })).toBe("csv file, 900 bytes");
    expect(attachedFileMeta({ kind: "pasted", byteSize: 400, preview: { rowsRead: 1 } })).toBe("A pasted list, 1 item");
    expect(attachedFileMeta({ kind: "pasted", byteSize: 40_000, preview: { rowsRead: 1200 } })).toBe("A pasted list, 1,200 items");
  });
});
