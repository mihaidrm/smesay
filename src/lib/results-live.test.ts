// The live-update rules of the page (stories/E8-7, acceptance 3) and the event format.
import { describe, expect, it } from "vitest";
import { isStale, reconnectDelay, sseEvent, STALE_MS } from "@/lib/results-live";

describe("live updates on Results", () => {
  it("calls a stream stale after 15 seconds without a heartbeat", () => {
    expect(isStale(0, STALE_MS)).toBe(false);
    expect(isStale(0, STALE_MS + 1)).toBe(true);
  });
  it("opens a dropped stream again after 1, 2, 4, 8, 16, then 30 seconds", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 20].map(reconnectDelay)).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000]);
  });
  it("writes a named event with one data line and a blank line", () => {
    expect(sseEvent("change", { instrument: "i", version: 2 })).toBe('event: change\ndata: {"instrument":"i","version":2}\n\n');
  });
});
