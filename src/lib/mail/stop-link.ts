// The stop link and the headers of an email a person can stop (stories/E16-1, acceptance 5):
// the page /email/stop with the person's token and the kind, and the List-Unsubscribe pair of
// RFC 8058 (rfc-editor.org/rfc/rfc8058: "List-Unsubscribe-Post: List-Unsubscribe=One-Click"
// and a POST to the List-Unsubscribe address, here /api/email/stop). No database import, so
// the templates' samples and their test can use it.
import type { EmailKind } from "@/db/types";

export function stopLink(origin: string, token: string, kind: EmailKind): { url: string; headers: Record<string, string> } {
  const page = new URL("/email/stop", origin);
  page.searchParams.set("t", token);
  page.searchParams.set("k", kind);
  const post = new URL("/api/email/stop", origin);
  post.searchParams.set("t", token);
  post.searchParams.set("k", kind);
  return { url: page.toString(), headers: { "List-Unsubscribe": `<${post.toString()}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } };
}
