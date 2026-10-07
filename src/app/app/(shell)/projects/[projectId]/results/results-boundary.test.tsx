// The error state of a part of Results (stories/E8-1, acceptance 5): the banner names the part
// and offers Try again (rendered to a string: react.dev/reference/react-dom/server/
// renderToStaticMarkup).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResultsFailed } from "./results-boundary";

describe("a part of Results that failed", () => {
  it("names the part and offers Try again", () => {
    const html = renderToStaticMarkup(<ResultsFailed what="Different priority 7 · Disagree 3" onRetry={() => {}} />);
    expect(html).toContain("Different priority 7 · Disagree 3 could not load. It has been logged. Try again in a minute.");
    expect(html).toContain(">Try again</button>");
    expect(html).toContain('role="status"');
  });
});
