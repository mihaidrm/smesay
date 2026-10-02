// A "next" parameter may only send the person to a path inside this site (stories/E2-1,
// acceptance 5): one leading slash, no scheme, no protocol-relative "//" form.
export function safeNextPath(value: string | null | undefined, fallback = "/app"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
