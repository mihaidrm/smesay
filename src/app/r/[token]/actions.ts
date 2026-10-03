"use server";
// The passcode step of a link (stories/E6-1, acceptance 4): checks the typed passcode
// against the stored hash on an open link, with the attempts limited per link and address
// (src/lib/link-access.ts), and sets the proof cookie on the link's path; the page then
// shows the instrument. No session: the token names the link. The address is the first
// X-Forwarded-For entry (the proxy in front sets it; locally the tests send one), else
// "local". Cookies and headers in Server Functions: node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/cookies.md and headers.md.
import { cookies, headers } from "next/headers";
import { checkPasscode, cookiePath, PASSCODE_COOKIE, PASSCODE_COOKIE_SECONDS, PASSCODE_WINDOW_MINUTES } from "@/lib/link-access";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";

export type PasscodeState = { error: string | null; ok: boolean };

export async function enterPasscodeAction(_previous: PasscodeState, formData: FormData): Promise<PasscodeState> {
  const token = String(formData.get("token") ?? "");
  const address = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const result = await checkPasscode(token, formData.get("passcode"), address);
  if (result.kind === "limited") return { error: LINK_PAGE_COPY.tooManyAttempts(PASSCODE_WINDOW_MINUTES), ok: false };
  if (result.kind !== "ok") return { error: LINK_PAGE_COPY.wrongPasscode, ok: false };
  const store = await cookies();
  store.set(PASSCODE_COOKIE, result.proof, { path: cookiePath(token), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: PASSCODE_COOKIE_SECONDS });
  return { error: null, ok: true };
}
