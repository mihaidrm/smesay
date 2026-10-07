// The stand-in for the model (stories/E4-8; stories/E4-1, acceptance 6: no test calls the
// real API). Plain TypeScript with no import, so e2e/fake-anthropic.mjs can serve it over
// HTTP for Playwright (Node strips the types, nodejs.org/api/typescript.html) and runModel
// can answer from it in the process when the developer menu says "Stand-in". Both answer
// the same: a Shape call (src/lib/ai/prompts/shape.ts) reads the "[ref] (area: name) text"
// lines of the data block and keeps the imported areas with the loose items in the first
// one, or makes three areas by thirds when the list has none; an item marked (keep in: name)
// stays in that area; one ambiguity and one duplicate flag are raised by item text. A Write
// actions call (stories/E9-1, told apart by its system prompt) reads the answer and
// missing-item refs ("[A1] ...", "[M1] ...", src/lib/ai/prompts/insights.ts) and answers four
// actions, one of each kind, citing them, and a fifth citing a ref that was not sent, which
// the app drops (E9-1, acceptance 3). Nothing here reads the network or the environment.

export type StandInRequest = { model?: string; system?: { text?: string }[]; messages?: { content?: { text?: string }[] }[] };

type Area = { name: string; items: string[] };

export function shape(data: string) {
  const items: { ref: string; area: string | null; keep: string | null; text: string }[] = [];
  for (const line of data.split("\n")) {
    const m = /^\[(\d+)\](?: \((area|keep in): (.+?)\))? (.*)$/.exec(line);
    if (m) items.push({ ref: m[1], area: m[2] === "area" ? m[3] : null, keep: m[2] === "keep in" ? m[3] : null, text: m[4] });
  }
  const imported: string[] = [];
  for (const it of items) if (it.area && !imported.includes(it.area)) imported.push(it.area);
  let areas: Area[];
  if (imported.length > 0) {
    areas = imported.map((name) => ({ name, items: items.filter((it) => it.area === name || it.keep === name).map((it) => it.ref) }));
    areas[0].items.push(...items.filter((it) => !it.area && !it.keep).map((it) => it.ref));
  } else {
    const names = ["Submitting", "Approving", "Paying"];
    const loose = items.filter((it) => !it.keep);
    const size = Math.ceil(loose.length / 3);
    areas = names.map((name, i) => ({ name, items: loose.slice(i * size, (i + 1) * size).map((it) => it.ref) }));
    for (const it of items.filter((it) => it.keep)) (areas.find((a) => a.name === it.keep) ?? areas[areas.push({ name: it.keep!, items: [] }) - 1]).items.push(it.ref);
    areas = areas.filter((a) => a.items.length > 0);
  }
  return {
    areas: areas.map((a, i) => ({ ...a, rationale: i === 0 ? `This comes first, because ${a.name.toLowerCase()} starts it.` : `This comes next, because ${a.name.toLowerCase()} follows.` })),
    // One ambiguity on the per diem item, one duplicate flag on mileage pointing at the first
    // item, so the browser test can see both banners (stories/E4-4).
    items: items.map((it) => ({ ref: it.ref, reader: `${it.text} (in plain words)`, flags: { ambiguity: /per diem/i.test(it.text) ? "Which countries, and who sets the rate" : null, duplicateOf: /mileage/i.test(it.text) ? items[0].ref : null } })),
  };
}

export function actions(data: string) {
  const answers = [...data.matchAll(/^\[(A\d+)\]/gm)].map((m) => m[1]);
  const missing = [...data.matchAll(/^\[(M\d+)\]/gm)].map((m) => m[1]);
  const first = answers.slice(0, 1);
  return {
    actions: [
      { kind: "rewrite", title: "Rewrite the first item so its scope is clear.", why: "A respondent read it differently from the proposal.", answers: first, missing: [] },
      { kind: "conflict", title: "Settle the priority of the first item with both groups.", why: "The answers on it pull in two directions.", answers: answers.slice(0, 2), missing: [] },
      { kind: "followUp", title: "Answer the open question before the link closes.", why: "A respondent could not rate an item without more detail.", answers: first, missing: [] },
      { kind: "coverage", title: "Consider adding the missing item respondents suggested.", why: "It was suggested as missing from the list.", answers: missing.length ? [] : first, missing: missing.slice(0, 1) },
      { kind: "rewrite", title: "An action citing an answer that was never sent.", why: "Dropped by the app.", answers: ["A999"], missing: [] },
    ],
  };
}

// The usage every answer reports, whatever the input: 1,000 tokens in, 500 out (the browser
// test's cost line counts on it, e2e/actions.spec.ts).
export const STAND_IN_USAGE = { input_tokens: 1000, output_tokens: 500 } as const;

const isActions = (system: string) => /Write at most \d+ actions/.test(system);

// A message in the API's shape for one request body (resources/messages/messages.d.ts, Message).
export function answer(request: StandInRequest) {
  const data = request.messages?.[0]?.content?.[0]?.text ?? "";
  const system = request.system?.[0]?.text ?? "";
  const out = isActions(system) ? actions(data) : shape(data);
  return {
    id: "msg_stand_in",
    type: "message",
    role: "assistant",
    model: request.model ?? "stand-in",
    content: [{ type: "text", text: JSON.stringify(out) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { ...STAND_IN_USAGE, cache_creation_input_tokens: null, cache_read_input_tokens: null },
  };
}

// A fetch that answers from the module, for the SDK's client option `fetch`
// (node_modules/@anthropic-ai/sdk/client.d.ts), as the unit tests swap the network out. It
// reads the request body only; the address and the headers are ignored, so no key is needed.
// delayMs: a wait before the answer, so a person can see the thinking state (E4-8).
export function standInFetch(options: { delayMs?: number } = {}): typeof fetch {
  const delayMs = options.delayMs ?? 0;
  return (async (_url: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body ?? "{}")) as StandInRequest;
    if (delayMs > 0) await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, delayMs);
      init?.signal?.addEventListener("abort", () => { clearTimeout(timer); reject(init.signal?.reason ?? new Error("aborted")); });
    });
    return new Response(JSON.stringify(answer(request)), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
}
