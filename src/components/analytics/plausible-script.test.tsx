// Plausible's script (stories/E13-3, acceptances 1 and 5): rendered with the request's nonce
// only when both variables are set, and placed only on the pages the story allows. The e2e
// test checks it is absent with the variables unset; the server's variables are fixed for a
// Playwright run, so the "present when set" half is here (docs/review-list.md).
import { readdirSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-nonce": "n0nce" }) }));
const { PlausibleScript } = await import("./plausible-script");

const saved = { domain: process.env.PLAUSIBLE_DOMAIN, src: process.env.PLAUSIBLE_SCRIPT_SRC };
afterEach(() => {
  for (const [k, v] of [["PLAUSIBLE_DOMAIN", saved.domain], ["PLAUSIBLE_SCRIPT_SRC", saved.src]] as const) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
});

describe("PlausibleScript", () => {
  it("renders the site's script with the nonce when on, and nothing when off", async () => {
    delete process.env.PLAUSIBLE_DOMAIN;
    delete process.env.PLAUSIBLE_SCRIPT_SRC;
    expect(await PlausibleScript()).toBeNull();
    process.env.PLAUSIBLE_DOMAIN = "smesay.example";
    process.env.PLAUSIBLE_SCRIPT_SRC = "https://plausible.io/js/pa-abc123.js";
    const html = renderToStaticMarkup((await PlausibleScript())!);
    expect(html).toBe('<script async="" src="https://plausible.io/js/pa-abc123.js" nonce="n0nce" data-analytics="plausible"></script>');
  });

  it("is placed only on the landing page, sign-in, the legal pages, the workspace step and the app shell", () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(`${dir}/${e.name}`) : /\.tsx$/.test(e.name) ? [`${dir}/${e.name}`] : []));
    const using = files("src/app").filter((f) => readFileSync(f, "utf8").includes("<PlausibleScript")).sort();
    expect(using).toEqual(["src/app/app/(shell)/layout.tsx", "src/app/app/new/page.tsx", "src/app/landing-page/page.tsx", "src/app/legal/[page]/page.tsx", "src/app/sign-in/page.tsx"]);
  });
});
