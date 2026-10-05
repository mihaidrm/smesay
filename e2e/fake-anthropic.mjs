// A stand-in for the Anthropic API during the browser tests (stories/E4-1, acceptance 6: no
// test calls the real API; stories/E4-2). playwright.config.ts starts it and points the app at
// it with ANTHROPIC_BASE_URL. POST /v1/messages reads the list from the data block the app
// sends ("[ref] (area: name) text" lines, src/lib/ai/prompts/shape.ts) and answers with a
// message in the API's shape: imported areas kept with the loose items in the first one, or
// three areas by thirds when the list has none; an item marked (keep in: name) stays in that
// area. One ambiguity and one duplicate flag are raised by item text. Write actions (E9-1) is
// told apart by its system prompt ("actions"): it reads the answer and missing-item refs
// ("[A1] ...", "[M1] ...", src/lib/ai/prompts/insights.ts) and answers with four actions, one
// of each kind, citing them, and a fifth citing a ref that was not sent, which the app drops
// (acceptance 3). GET /health says it is up.
import http from "node:http";

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010);

function shape(data) {
  const items = [];
  for (const line of data.split("\n")) {
    const m = /^\[(\d+)\](?: \((area|keep in): (.+?)\))? (.*)$/.exec(line);
    if (m) items.push({ ref: m[1], area: m[2] === "area" ? m[3] : null, keep: m[2] === "keep in" ? m[3] : null, text: m[4] });
  }
  const imported = [];
  for (const it of items) if (it.area && !imported.includes(it.area)) imported.push(it.area);
  let areas;
  if (imported.length > 0) {
    areas = imported.map((name) => ({ name, items: items.filter((it) => it.area === name || it.keep === name).map((it) => it.ref) }));
    areas[0].items.push(...items.filter((it) => !it.area && !it.keep).map((it) => it.ref));
  } else {
    const names = ["Submitting", "Approving", "Paying"];
    const loose = items.filter((it) => !it.keep);
    const size = Math.ceil(loose.length / 3);
    areas = names.map((name, i) => ({ name, items: loose.slice(i * size, (i + 1) * size).map((it) => it.ref) }));
    for (const it of items.filter((it) => it.keep)) (areas.find((a) => a.name === it.keep) ?? areas[areas.push({ name: it.keep, items: [] }) - 1]).items.push(it.ref);
    areas = areas.filter((a) => a.items.length > 0);
  }
  return {
    areas: areas.map((a, i) => ({ ...a, rationale: i === 0 ? `This comes first, because ${a.name.toLowerCase()} starts it.` : `This comes next, because ${a.name.toLowerCase()} follows.` })),
    // One ambiguity on the per diem item, one duplicate flag on mileage pointing at the first
    // item, so the browser test can see both banners (stories/E4-4).
    items: items.map((it) => ({ ref: it.ref, reader: `${it.text} (in plain words)`, flags: { ambiguity: /per diem/i.test(it.text) ? "Which countries, and who sets the rate" : null, duplicateOf: /mileage/i.test(it.text) ? items[0].ref : null } })),
  };
}

function actions(data) {
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

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") { res.writeHead(200); res.end("ok"); return; }
  if (req.method !== "POST" || !req.url?.startsWith("/v1/messages")) { res.writeHead(404); res.end(); return; }
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const request = JSON.parse(body);
    const data = request.messages?.[0]?.content?.[0]?.text ?? "";
    const system = request.system?.[0]?.text ?? "";
    const out = /Write at most \d+ actions/.test(system) ? actions(data) : shape(data);
    const message = { id: "msg_fake", type: "message", role: "assistant", model: request.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(message));
  });
});

server.listen(PORT, () => console.log(`fake-anthropic listening on ${PORT}`));
