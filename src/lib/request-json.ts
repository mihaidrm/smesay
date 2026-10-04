// The respondent routes' JSON body (stories/E7-1 onwards; SECURITY.md, JSON only). The media
// type, its parameters aside, must be application/json exactly: a cross-site request that
// skips the preflight can only carry application/x-www-form-urlencoded, multipart/form-data
// or text/plain (developer.mozilla.org/docs/Glossary/CORS-safelisted_request_header), and a
// substring test would let "text/plain; x=application/json" through. The body is read
// chunk by chunk up to JSON_BODY_MAX and the read stops there (ReadableStreamDefaultReader:
// developer.mozilla.org/docs/Web/API/ReadableStreamDefaultReader), so a large post costs
// the server no more than the cap. 415 for another type, 413 over the cap, 400 when it is
// not JSON.
export const JSON_BODY_MAX = 16 * 1024;

export function isJsonType(header: string | null): boolean {
  return (header ?? "").split(";")[0].trim().toLowerCase() === "application/json";
}

export async function readJson(request: Request, max = JSON_BODY_MAX): Promise<{ status: 400 | 413 | 415 } | { body: unknown }> {
  if (!isJsonType(request.headers.get("content-type"))) return { status: 415 };
  if (Number(request.headers.get("content-length") ?? "0") > max) return { status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { status: 400 };
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); return { status: 413 }; }
    chunks.push(value);
  }
  try { return { body: JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) }; } catch { return { status: 400 }; }
}
