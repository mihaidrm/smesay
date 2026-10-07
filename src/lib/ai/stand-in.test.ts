// The stand-in's answers keep the contract the app checks a real answer against (stories/
// E4-8, acceptance 4): a Shape answer over the real prompt passes ShapeOutput and checkShape
// with every imported area kept and the loose items placed; a list without areas gets three;
// an item the PM moved stays; the two flags are raised by item text. A Write actions answer
// over the real prompt passes InsightOutput and keptActions keeps four of five. The fetch
// answers in the API's shape and honours the delay and an abort.
import { describe, expect, it } from "vitest";
import { InsightOutput } from "./insights-schema";
import { buildActionsPrompt } from "./prompts/insights";
import { buildShapePrompt } from "./prompts/shape";
import { ShapeOutput } from "./shape-schema";
import { actions, answer, shape, STAND_IN_USAGE, standInFetch } from "./stand-in";
import { keptActions } from "@/lib/insights";
import { checkShape } from "@/lib/shaping";

const withAreas = buildShapePrompt([
  { ref: "1", text: "Receipts captured by phone", area: "Submitting" },
  { ref: "2", text: "Approval from the notification email", area: "Approving" },
  { ref: "3", text: "Per diem rates by country", area: null },
  { ref: "4", text: "Mileage from a start and end address", area: null, keep: "Approving" },
]);
const withoutAreas = buildShapePrompt(["Receipts", "Approvals", "Payroll", "Advances", "Per diem", "Mileage"].map((text, i) => ({ ref: String(i + 1), text, area: null })));

describe("shape", () => {
  it("keeps the imported areas, places the loose items in the first one and a moved item where the PM put it", () => {
    const out = ShapeOutput.parse(shape(withAreas.data));
    expect(out.areas.map((a) => [a.name, a.items])).toEqual([["Submitting", ["1", "3"]], ["Approving", ["2", "4"]]]);
    expect(out.areas[0].rationale).toBe("This comes first, because submitting starts it.");
    expect(checkShape(out, ["1", "2", "3", "4"], withAreas.importedAreas, new Map([["1", "Submitting"], ["2", "Approving"]]), ["Approving"])).toBeNull();
    expect(out.items.map((i) => i.reader)).toEqual(["Receipts captured by phone (in plain words)", "Approval from the notification email (in plain words)", "Per diem rates by country (in plain words)", "Mileage from a start and end address (in plain words)"]);
    expect(out.items[2].flags).toEqual({ ambiguity: "Which countries, and who sets the rate", duplicateOf: null });
    expect(out.items[3].flags).toEqual({ ambiguity: null, duplicateOf: "1" });
  });

  it("makes three areas by thirds for a list without areas", () => {
    const out = ShapeOutput.parse(shape(withoutAreas.data));
    expect(out.areas.map((a) => [a.name, a.items])).toEqual([["Submitting", ["1", "2"]], ["Approving", ["3", "4"]], ["Paying", ["5", "6"]]]);
    expect(checkShape(out, ["1", "2", "3", "4", "5", "6"], null)).toBeNull();
  });
});

describe("actions", () => {
  const prompt = buildActionsPrompt({
    items: [{ id: "i1", reference: "CL-01", area: "Submitting", text: "Receipts captured by phone", proposed: "M", counts: { agree: 0, change: 1, disagree: 1, unclear: 0, rated: 2, couldSee: 2 } }],
    answers: [
      { id: "a1", itemId: "i1", respondent: "r1", kind: "change", value: "S", text: "Most receipts arrive by email now." },
      { id: "a2", itemId: "i1", respondent: "r2", kind: "disagree", value: null, text: "Finance checks this already." },
    ],
    missing: [{ id: "m1", respondent: "r1", text: "Mileage from addresses" }],
    respondents: [{ key: "r1", groups: { Team: "Sales" } }, { key: "r2", groups: { Team: "Finance" } }],
    scale: ["Must", "Should"],
    labelOf: (code) => (code === "M" ? "Must" : code === "S" ? "Should" : ""),
  });

  it("answers four actions citing the answers and the missing item, and a fifth the app drops", () => {
    const out = InsightOutput.parse(actions(prompt.data));
    expect(out.actions.map((a) => a.kind)).toEqual(["rewrite", "conflict", "followUp", "coverage", "rewrite"]);
    expect(out.actions[1].answers).toEqual(["A1", "A2"]);
    expect(out.actions[3]).toMatchObject({ answers: [], missing: ["M1"] });
    const kept = keptActions(out, prompt.answerRefs, prompt.missingRefs);
    expect(kept).toHaveLength(4);
    expect(kept[0].citedAnswerIds).toEqual(["a1"]);
    expect(kept[3].citedMissingItemIds).toEqual(["m1"]);
  });

  it("cites the first answer for coverage when no missing item was sent", () => {
    expect(actions("[A1] R1 on I1: not needed: no.\n").actions[3]).toMatchObject({ answers: ["A1"], missing: [] });
  });
});

describe("answer and standInFetch", () => {
  const request = (system: string, data: string) => ({ model: "m", system: [{ text: system }], messages: [{ content: [{ text: data }] }] });

  it("tells the two calls apart by the system prompt and reports fixed usage", () => {
    const shaped = answer(request(withAreas.instructions, withAreas.data));
    expect(shaped).toMatchObject({ type: "message", role: "assistant", model: "m", stop_reason: "end_turn", usage: { ...STAND_IN_USAGE } });
    expect(ShapeOutput.safeParse(JSON.parse(shaped.content[0].text)).success).toBe(true);
    const acted = answer(request("Write at most 8 actions, the most useful first", "[A1] x\n"));
    expect(InsightOutput.safeParse(JSON.parse(acted.content[0].text)).success).toBe(true);
  });

  it("answers a fetch from the body alone, after the delay, and gives up on an abort", async () => {
    const fetch = standInFetch({ delayMs: 20 });
    const started = Date.now();
    const res = await fetch("http://nowhere.invalid/v1/messages", { method: "POST", body: JSON.stringify(request(withAreas.instructions, withAreas.data)) });
    expect(Date.now() - started).toBeGreaterThanOrEqual(15);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe("msg_stand_in");
    const controller = new AbortController();
    const slow = standInFetch({ delayMs: 5_000 })("http://nowhere.invalid/v1/messages", { method: "POST", body: "{}", signal: controller.signal });
    controller.abort(new Error("stopped"));
    await expect(slow).rejects.toThrow("stopped");
  });
});
