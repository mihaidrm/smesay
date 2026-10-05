// The visitors' sample (stories/E12-4): the instrument is the seed's, in memory, and what the
// tab keeps is read back only in the shape a card takes.
import { describe, expect, it } from "vitest";
import * as seed from "@/db/seed/sample";
import { REASON_MAX } from "@/lib/respondent-rules";
import { EMPTY_SAMPLE, parseSample } from "@/lib/sample-drafts";
import { sampleInstrument } from "@/lib/sample-instrument";

describe("sampleInstrument", () => {
  it("is the Marlow Group instrument from the seed, every item with its proposal code", () => {
    const s = sampleInstrument();
    expect(s.workspaceName).toBe("Marlow Group");
    expect(s.instrument.title).toBe(seed.instrument.title);
    expect(s.areas.map((a) => a.name)).toEqual(["Submitting", "Approving", "Paying"]);
    expect(s.items).toHaveLength(seed.items.length);
    expect(s.items.map((it) => it.proposed)).toEqual(["M", "S", "M", "S", "M", "C"]);
    expect(s.items[0]).toMatchObject({ id: "CL-01", reference: "CL-01", area: "Submitting", title: seed.items[0].reader, details: seed.items[0].details });
  });
});

describe("parseSample", () => {
  const ids = ["CL-01", "CL-02"];
  const keys = ["name", "role"];
  it("keeps well formed answers, details and Wrap up for known items and fields only", () => {
    const raw = JSON.stringify({
      drafts: { "CL-01": { picked: "M", reason: "", comment: "x" }, "CL-02": { picked: null, reason: "r", comment: "" }, "CL-99": { picked: "M", reason: "", comment: "" } },
      fields: { name: "Dana", role: "Finance", email: "dana@marlow.example" },
      picks: ["Finance", 3],
      wrap: { confidence: 4, signed: true, closingAnswer: "ok", missing: { text: "Mileage", area: "Submitting", value: "" } },
      started: true,
      submittedAt: "2026-10-05T09:00:00.000Z",
    });
    expect(parseSample(raw, ids, keys)).toEqual({
      drafts: { "CL-01": { picked: "M", reason: "", comment: "x" }, "CL-02": { picked: null, reason: "r", comment: "" } },
      fields: { name: "Dana", role: "Finance" },
      picks: ["Finance"],
      wrap: { confidence: 4, signed: true, closingAnswer: "ok", missing: { text: "Mileage", area: "Submitting", value: "" } },
      started: true,
      submittedAt: "2026-10-05T09:00:00.000Z",
    });
  });
  it("drops anything else", () => {
    for (const raw of [null, "not json", "[1,2]", JSON.stringify({ drafts: { "CL-01": { picked: 3, reason: "", comment: "" } }, wrap: { confidence: 9 }, submittedAt: "soon" })]) {
      expect(parseSample(raw, ids, keys)).toEqual(EMPTY_SAMPLE);
    }
  });
  it("cuts a long reason to the respondent app's limit", () => {
    const raw = JSON.stringify({ drafts: { "CL-01": { picked: "S", reason: "a".repeat(REASON_MAX + 50), comment: "" } } });
    expect(parseSample(raw, ids, keys).drafts["CL-01"].reason).toHaveLength(REASON_MAX);
  });
});
