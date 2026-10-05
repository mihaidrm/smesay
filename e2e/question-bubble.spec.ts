// The question bubble of the landing page (stories/E12-5, acceptance 8): at 390 by 844 and
// 1440 by 900 the button covers no link or button of the page at the top or at the bottom;
// it opens the panel with the focus in the email field; Escape closes it, gives the focus back
// to the button and keeps the typed text; a missing address is named; Send shows the sent
// line, and Mailpit holds the email with Reply-To the visitor (mailpit.axllent.org/docs/api-v1:
// GET /api/v1/search, GET /api/v1/message/{ID}/headers).
import { expect, test, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

test.use({ extraHTTPHeaders: { "x-forwarded-for": "10.0.0.75" } });

// Every visible link and button of the page that the bubble's box overlaps.
async function covered(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bubble = document.querySelector("[data-testid=question-bubble]")!.getBoundingClientRect();
    const hits: string[] = [];
    for (const el of Array.from(document.querySelectorAll("a, button, summary"))) {
      if (el.closest("[data-testid=question-panel]") || el.matches("[data-testid=question-bubble]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === "hidden") continue;
      if (r.right > bubble.left && r.left < bubble.right && r.bottom > bubble.top && r.top < bubble.bottom) hits.push((el.textContent ?? "").trim().slice(0, 40));
    }
    return hits;
  });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`a visitor asks a question from the landing page at ${viewport.width}`, async ({ page, request }) => {
    await page.setViewportSize(viewport);
    await page.goto("/landing-page");
    const bubble = page.getByRole("button", { name: "Ask us a question" });
    await expect(bubble).toBeVisible();
    const box = (await bubble.boundingBox())!;
    expect(box.width).toBe(56);
    const edge = viewport.width < 768 ? 16 : 24;
    expect(Math.round(viewport.width - (box.x + box.width))).toBe(edge);
    expect(Math.round(viewport.height - (box.y + box.height))).toBe(edge);
    expect(await covered(page)).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    expect(await covered(page)).toEqual([]);

    await bubble.click();
    const panel = page.getByRole("dialog", { name: "Ask us a question" });
    await expect(panel).toBeVisible();
    await expect(panel.getByLabel("Your email")).toBeFocused();
    await expect(panel).toContainText("We read every message and reply by email within one working day.");
    if (viewport.width >= 768) expect((await panel.boundingBox())!.width).toBe(360);
    else expect((await panel.boundingBox())!.width).toBe(viewport.width);
    await panel.getByLabel("Your question").fill("Can experts answer in Romanian?");
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(bubble).toBeFocused();
    await bubble.click();
    await expect(panel.getByLabel("Your question")).toHaveValue("Can experts answer in Romanian?");

    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("alert")).toHaveText("Enter your email so we can reply.");
    const visitor = `visitor-${viewport.width}-${Date.now()}@marlow.example`;
    await panel.getByLabel("Your email").fill(visitor);
    await panel.getByRole("button", { name: "Send" }).click();
    await expect(panel.getByRole("status")).toHaveText(`Sent. We will reply to ${visitor}.`);

    let id = "";
    for (let i = 0; i < 30 && !id; i++) {
      const found = await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`subject:"${visitor}"`)}&limit=1`)).json();
      id = found.messages?.[0]?.ID ?? "";
      if (!id) await new Promise((r) => setTimeout(r, 500));
    }
    expect(id).not.toBe("");
    const message = await (await request.get(`${MAILPIT}/api/v1/message/${id}`)).json();
    expect(message.Subject).toBe(`Question from the landing page: ${visitor}`);
    expect(message.Text).toContain("Can experts answer in Romanian?");
    expect(message.HTML ?? "").toBe("");
    const headers = await (await request.get(`${MAILPIT}/api/v1/message/${id}/headers`)).json();
    expect(headers["Reply-To"]?.[0]).toContain(visitor);

    await panel.getByRole("button", { name: "Close" }).click();
    await expect(bubble).toBeFocused();
  });
}
