"use server";
// The passcode step of a link (stories/E6-1, acceptance 4): checks the typed passcode
// against the stored hash and sets the proof cookie on the link's path, then the page
// shows the instrument. No session: the token names the link. Cookies in Server Functions:
// node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md.
import { cookies } from "next/headers";
import { checkPasscode, cookiePath, PASSCODE_COOKIE, PASSCODE_COOKIE_SECONDS } from "@/lib/link-access";
import { LINK_PAGE_COPY } from "@/lib/sharing-copy";

export type PasscodeState = { error: string | null; ok: boolean };

export async function enterPasscodeAction(_previous: PasscodeState, formData: FormData): Promise<PasscodeState> {
  const token = String(formData.get("token") ?? "");
  const proof = await checkPasscode(token, formData.get("passcode"));
  if (!proof) return { error: LINK_PAGE_COPY.wrongPasscode, ok: false };
  const store = await cookies();
  store.set(PASSCODE_COOKIE, proof, { path: cookiePath(token), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: PASSCODE_COOKIE_SECONDS });
  return { error: null, ok: true };
}
