// What an error report keeps (stories/E11-5, acceptance 1): an event with an email, a name in
// quotes, a database value, a link token, a user, headers, cookies, a body and breadcrumbs
// comes out with the text removed and only the allowed fields.
import { describe, expect, it } from "vitest";
import { REMOVED, scrubEvent, scrubText } from "./scrub";
import { DATA_COLLECTION, sentryOptions } from "./sentry";

describe("scrub", () => {
  it("removes emails, quoted text, database values, link tokens and long runs from a message", () => {
    expect(scrubText("Invite for ana.pop+x@firma.ro failed")).toBe(`Invite for ${REMOVED} failed`);
    expect(scrubText('Respondent "Ana Pop" wrote \'too slow\'')).toBe(`Respondent ${REMOVED} wrote ${REMOVED}`);
    expect(scrubText("Key (email)=(ana@firma.ro) already exists.")).toBe(`Key (email)=(${REMOVED}) already exists.`);
    expect(scrubText("GET /r/3f9a2c4d5e6f7a8b9c0d1e2f3a4b5c6d/answers")).toBe("GET /r/[token]/answers");
    expect(scrubText("token 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")).toBe(`token ${REMOVED}`);
    expect(scrubText("word ".repeat(100))).toHaveLength(200);
  });
  it("keeps nothing of a failed query, an unmatched quote, an IP address or a second line", () => {
    // drizzle-orm's DrizzleQueryError: "Failed query: [SQL]\nparams: [VALUES]" (node_modules/drizzle-orm/errors.js).
    expect(scrubText('Failed query: insert into "answer" ("id", "reason") values ($1, $2)\nparams: 0b4e,Ana Popescu said the price was too high')).toBe("Failed query");
    expect(scrubText("Bad row\nparams: Ana Popescu")).toBe("Bad row");
    expect(scrubText("x params: Ana Popescu")).toBe("x ");
    expect(scrubText('Unexpected "abc"def ghi" in body')).toBe(`Unexpected ${REMOVED}def ghi${REMOVED}`);
    expect(scrubText("connect from 192.168.1.20 and fe80::1:2:3 refused")).toBe(`connect from ${REMOVED} and ${REMOVED} refused`);
  });
  it("keeps only the allowed fields of an event", () => {
    const event = {
      event_id: "e1", timestamp: 1, level: "error", platform: "node", environment: "production", release: "r1",
      message: "for ana@firma.ro",
      exception: { values: [{ type: "Error", value: "No invite for ana@firma.ro", mechanism: { type: "auto.function.nextjs.on_request_error", handled: false, data: { body: "Ana" } }, stacktrace: { frames: [{ filename: "app/x.js", function: "f", lineno: 3, colno: 4, in_app: true, vars: { email: "ana@firma.ro" }, context_line: "const email = 'ana@firma.ro'" }] } }] },
      transaction: "GET /r/abcdefabcdefabcdefabcdefabcdefab?x=ana",
      request: { method: "PUT", url: "https://smesay.app/r/abcdefabcdefabcdefabcdefabcdefab/answers?x=ana@firma.ro", headers: { cookie: "s=1" }, cookies: { s: "1" }, data: { reason: "Ana says no" }, query_string: "x=1" },
      user: { email: "ana@firma.ro", ip_address: "10.0.0.1" },
      breadcrumbs: [{ message: "typed Ana" }],
      extra: { body: "Ana" },
      tags: { email: "ana@firma.ro" },
      contexts: { response: { body: "Ana" } },
      server_name: "host-1",
    };
    const out = scrubEvent(event);
    expect(out).toEqual({
      event_id: "e1", timestamp: 1, level: "error", platform: "node", environment: "production", release: "r1",
      message: `for ${REMOVED}`,
      exception: { values: [{ type: "Error", value: `No invite for ${REMOVED}`, mechanism: { type: "auto.function.nextjs.on_request_error", handled: false }, stacktrace: { frames: [{ filename: "app/x.js", function: "f", module: undefined, lineno: 3, colno: 4, in_app: true }] } }] },
      transaction: "GET /r/[token]",
      request: { method: "PUT", url: "/r/[token]/answers" },
    });
    expect(JSON.stringify(out)).not.toMatch(/ana|Ana|10\.0\.0\.1|host-1/);
  });
  it("switches off every collection Sentry would make and drops breadcrumbs", () => {
    expect(Object.values(DATA_COLLECTION).every((v) => v === false || v === 0 || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && Object.values(v).every((x) => x === false)))).toBe(true);
    const options = sentryOptions("https://k@o1.ingest.de.sentry.io/1", "production");
    expect(options.beforeBreadcrumb()).toBeNull();
    expect(options.maxBreadcrumbs).toBe(0);
    expect(options.beforeSend({ message: "x@y.ro" }).message).toBe(REMOVED);
  });
});
