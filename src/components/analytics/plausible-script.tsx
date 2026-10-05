// Plausible's script (stories/E13-3, acceptance 1) for the marketing pages and the PM app,
// never on a respondent page, the visitors' sample or the admin page: each layout or page that
// wants it renders this. Nothing when the variables are unset (src/lib/plausible.ts). The
// content security policy lets it run with the request's nonce and lets it send to
// plausible.io (src/lib/security-headers.ts, src/proxy.ts).
import { headers } from "next/headers";
import { plausibleConfig } from "@/lib/plausible";

export async function PlausibleScript() {
  const config = plausibleConfig();
  if (!config) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <script async src={config.scriptSrc} nonce={nonce} data-analytics="plausible" />;
}
