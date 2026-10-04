// The preview token (stories/E5-6): signed, scoped, short-lived, never a real link's token.
import { describe, expect, it } from "vitest";
import { isPreviewToken, PREVIEW_TTL_MS, previewToken, readPreviewToken } from "./preview-token";

const SECRET = "test-secret";
const CLAIM = { project: "p1", ws: "w1", user: "u1" };

describe("the preview token", () => {
  it("reads back the claim it was made with, within the hour", () => {
    const t = previewToken(CLAIM, SECRET, 1_000);
    expect(isPreviewToken(t)).toBe(true);
    expect(readPreviewToken(t, SECRET, 2_000)).toEqual({ ...CLAIM, exp: 1_000 + PREVIEW_TTL_MS });
  });
  it("refuses it once expired, under another secret, or changed", () => {
    const t = previewToken(CLAIM, SECRET, 1_000);
    expect(readPreviewToken(t, SECRET, 1_000 + PREVIEW_TTL_MS)).toBeNull();
    expect(readPreviewToken(t, "other", 2_000)).toBeNull();
    const [p, payload, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...CLAIM, ws: "w2", exp: 9e15 })).toString("base64url");
    expect(readPreviewToken(`${p}.${forged}.${sig}`, SECRET, 2_000)).toBeNull();
    expect(readPreviewToken(`${p}.${payload}`, SECRET, 2_000)).toBeNull();
    expect(readPreviewToken(`${t}.x`, SECRET, 2_000)).toBeNull();
  });
  it("is never a real link's token", () => {
    expect(isPreviewToken("0f3a9c1e5b7d2f4a6c8e0b1d3f5a7c9e")).toBe(false);
    expect(readPreviewToken("0f3a9c1e5b7d2f4a6c8e0b1d3f5a7c9e", SECRET)).toBeNull();
  });
});
