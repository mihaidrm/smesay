// A preview never writes (stories/E5-6, acceptance 4): every write route answers 403 to a
// preview token before it reads the body or the database.
import { describe, expect, it } from "vitest";
import { PUT as answers } from "./answers/route";
import { POST as start } from "./start/route";
import { POST as submit } from "./submit/route";
import { PUT as wrap } from "./wrap/route";

const token = "p.eyJwcm9qZWN0IjoiYSJ9.c2ln";
const call = (handler: (r: Request, c: { params: Promise<{ token: string }> }) => Promise<Response>, method: string) =>
  handler(new Request(`http://localhost/r/${token}/x`, { method, body: "{}", headers: { "content-type": "application/json" } }), { params: Promise.resolve({ token }) });

describe("the write routes on a preview token", () => {
  it("answer 403 with the preview's sentence", async () => {
    for (const [handler, method] of [[answers, "PUT"], [start, "POST"], [wrap, "PUT"], [submit, "POST"]] as const) {
      const res = await call(handler, method);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "This is a preview. Nothing entered here is saved." });
    }
  });
});
