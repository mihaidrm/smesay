// "Powered by SMEsay" (stories/E7-7, acceptance 5): the line when shown, nothing when not
// (rendered to a string: react.dev/reference/react-dom/server/renderToStaticMarkup). Which
// plan shows it is showsPoweredBy's test (src/lib/brand.test.ts).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PoweredBy } from "./powered-by";

describe("Powered by SMEsay", () => {
  it("renders the line when shown and nothing when not", () => {
    expect(renderToStaticMarkup(<PoweredBy show />)).toContain("Powered by");
    expect(renderToStaticMarkup(<PoweredBy show={false} />)).toBe("");
  });
});
