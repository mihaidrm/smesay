// A stand-in for the Anthropic API during the browser tests (stories/E4-1, acceptance 6: no
// test calls the real API; stories/E4-2; stories/E4-8). playwright.config.ts starts it and
// points the app at it with ANTHROPIC_BASE_URL. The answers come from src/lib/ai/stand-in.ts,
// the module the app itself answers from when the developer menu says "Stand-in", so the two
// never drift; Node loads the .ts file by stripping its types (nodejs.org/api/typescript.html,
// on by default from Node 22.18). POST /v1/messages answers a message in the API's shape;
// GET /health says it is up; POST /delay?ms=N makes the next answer wait N milliseconds
// (at most 10,000), so a test can see the thinking state (e2e/actions.spec.ts).
import http from "node:http";
import { answer } from "../src/lib/ai/stand-in.ts";

const PORT = Number(process.env.FAKE_ANTHROPIC_PORT ?? 4010);
const DELAY_MAX_MS = 10_000;
let nextDelayMs = 0;

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/health") { res.writeHead(200); res.end("ok"); return; }
  if (req.method === "POST" && url.pathname === "/delay") {
    nextDelayMs = Math.min(DELAY_MAX_MS, Math.max(0, Number(url.searchParams.get("ms") ?? 0) || 0));
    res.writeHead(200); res.end(String(nextDelayMs)); return;
  }
  if (req.method !== "POST" || !url.pathname.startsWith("/v1/messages")) { res.writeHead(404); res.end(); return; }
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const message = answer(JSON.parse(body));
    const wait = nextDelayMs;
    nextDelayMs = 0;
    setTimeout(() => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(message));
    }, wait);
  });
});

server.listen(PORT, () => console.log(`fake-anthropic listening on ${PORT}`));
