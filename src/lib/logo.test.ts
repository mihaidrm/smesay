import { describe, expect, it } from "vitest";
import { checkLogo, LOGO_COPY, LOGO_MAX_BYTES } from "@/lib/logo";

export const ONE_PIXEL_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgy04GAAFnAN1T9u7/AAAAAElFTkSuQmCC", "base64");
const svg = (inner: string, head = "") => new TextEncoder().encode(`${head}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${inner}</svg>`);

describe("checkLogo", () => {
  it("accepts a PNG by its signature", () => {
    expect(checkLogo(ONE_PIXEL_PNG)).toEqual({ ok: true, kind: "png", contentType: "image/png" });
  });
  it("accepts an SVG with a declaration and comments before the root", () => {
    expect(checkLogo(svg('<rect width="32" height="32" fill="#0E6B63"/>', '<?xml version="1.0"?>\n<!-- made by hand -->\n'))).toEqual({ ok: true, kind: "svg", contentType: "image/svg+xml" });
  });
  it("refuses an SVG with a script, an event handler or a javascript: reference", () => {
    for (const bad of ['<script>alert(1)</script>', '<rect onload="alert(1)"/>', '<a href="javascript:alert(1)"><rect/></a>', '<foreignObject><div/></foreignObject>']) {
      expect(checkLogo(svg(bad))).toEqual({ ok: false, error: LOGO_COPY.scripted });
    }
  });
  it("refuses other content, an empty file and a file over 1 MB", () => {
    expect(checkLogo(new TextEncoder().encode("<html><svg/></html>"))).toEqual({ ok: false, error: LOGO_COPY.notImage });
    expect(checkLogo(new TextEncoder().encode("GIF89a"))).toEqual({ ok: false, error: LOGO_COPY.notImage });
    expect(checkLogo(new Uint8Array(0))).toEqual({ ok: false, error: LOGO_COPY.empty });
    expect(checkLogo(new Uint8Array(LOGO_MAX_BYTES + 1))).toEqual({ ok: false, error: LOGO_COPY.tooBig });
  });
  it("judges by content, so a renamed file does not pass", () => {
    expect(checkLogo(new TextEncoder().encode("not a png at all")).ok).toBe(false);
  });
});
