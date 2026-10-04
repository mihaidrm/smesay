// A cookie's value from a request's Cookie header, for the respondent route handlers: they
// get a plain Request, so no request-scope helper is needed and a handler runs in a unit
// test too. A malformed escape reads as no cookie.
export function cookieValue(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) { try { return decodeURIComponent(rest.join("=")); } catch { return undefined; } }
  }
  return undefined;
}
