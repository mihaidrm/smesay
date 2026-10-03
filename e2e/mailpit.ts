// Mailpit's API for the browser tests (mailpit.axllent.org/docs/api-v1, swagger): GET
// /api/v1/search?query=to:<address>, GET /api/v1/message/{ID}. Needs Mailpit at
// localhost:8025 (docker compose, or the CI service container) and MAIL_SMTP_URL=smtp://localhost:1025.
import type { APIRequestContext } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

export async function latestLink(request: APIRequestContext, to: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const list = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + to)}&limit=1`);
    const body = await list.json();
    if (body.messages?.length) {
      const message = await (await request.get(`${MAILPIT}/api/v1/message/${body.messages[0].ID}`)).json();
      const link = (message.Text as string).split("\n").find((l) => l.includes("/api/auth/magic-link/verify"));
      if (link) return link.trim();
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No sign-in email for ${to} arrived in Mailpit within 15 seconds.`);
}

// The newest message to an address, with its subject, text and the first /r/ link in it
// (stories/E6-2, acceptance 6).
export async function latestInvite(request: APIRequestContext, to: string): Promise<{ subject: string; from: string; text: string; link: string }> {
  for (let i = 0; i < 30; i++) {
    const list = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + to)}&limit=1`);
    const body = await list.json();
    if (body.messages?.length) {
      const message = await (await request.get(`${MAILPIT}/api/v1/message/${body.messages[0].ID}`)).json();
      const text = message.Text as string;
      const link = text.split("\n").find((l) => /\/r\/[0-9a-f]{32}$/.test(l.trim()));
      if (link) return { subject: message.Subject as string, from: `${message.From?.Name ?? ""} <${message.From?.Address ?? ""}>`, text, link: link.trim() };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No invite email for ${to} arrived in Mailpit within 15 seconds.`);
}
