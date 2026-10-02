// A stand-in for the Anthropic API during the browser tests (stories/E4-1, acceptance 6: no
// test calls the real API; stories/E4-2). playwright.config.ts starts it and points the app at
// it with ANTHROPIC_BASE_URL. POST /v1/messages reads the list from the data block the app
// sends ("[ref] (area: name) text" lines, src/lib/ai/prompts/shape.ts) and answers with a
// message in the API's shape: imported areas kept with the loose items in the first one, or
// three areas by thirds when the list has none. GET /health says it is up.
import http from "node:http";

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010);

function shape(data) {
  const items = [];
  for (const line of data.split("\n")) {
    const m = /^\[(\d+)\](?: \(area: (.+?)\))? (.*)$/.exec(line);
    if (m) items.push({ ref: m[1], area: m[2] ?? null, text: m[3] });
  }
  const imported = [];
  for (const it of items) if (it.area && !imported.includes(it.area)) imported.push(it.area);
  let areas;
  if (imported.length > 0) {
    areas = imported.map((name) => ({ name, items: items.filter((it) => it.area === name).map((it) => it.ref) }));
    areas[0].items.push(...items.filter((it) => !it.area).map((it) => it.ref));
  } else {
    const names = ["Submitting", "Approving", "Paying"];
    const size = Math.ceil(items.length / 3);
    areas = names.map((name, i) => ({ name, items: items.slice(i * size, (i + 1) * size).map((it) => it.ref) })).filter((a) => a.items.length > 0);
  }
  return {
    areas: areas.map((a, i) => ({ ...a, rationale: i === 0 ? `First, because ${a.name.toLowerCase()} starts it.` : `Then, ${a.name.toLowerCase()}.` })),
    items: items.map((it) => ({ ref: it.ref, reader: `${it.text} (in plain words)`, flags: { ambiguity: null, duplicateOf: null } })),
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
    const out = shape(data);
    const message = { id: "msg_fake", type: "message", role: "assistant", model: request.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: null, cache_read_input_tokens: null } };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(message));
  });
});

server.listen(PORT, () => console.log(`fake-anthropic listening on ${PORT}`));
