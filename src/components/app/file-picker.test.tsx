// The file picker (design note 103): the button's words, the input kept with its id, name and
// accept off screen, the "No file chosen" hint, the disabled flag, a custom verb. Rendered to a
// string (react.dev/reference/react-dom/server/renderToStaticMarkup), as powered-by.test.tsx;
// the click, the focus ring and the name after a pick are the e2e specs' (e2e/import.spec.ts,
// e2e/settings.spec.ts and e2e/project-transfer.spec.ts pick files through the input).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FILE_PICKER_COPY, FilePicker } from "./file-picker";

describe("FilePicker", () => {
  it("renders the verb as a secondary button around the real input and the hint", () => {
    const html = renderToStaticMarkup(<FilePicker id="upload-file" name="file" accept=".xlsx,.csv" />);
    expect(html).toContain(">Choose a file</label>");
    expect(html).toContain("No file chosen");
    const input = html.match(/<input[^>]*>/)?.[0] ?? "";
    expect(input).toContain('type="file"');
    expect(input).toContain('id="upload-file"');
    expect(input).toContain('name="file"');
    expect(input).toContain('accept=".xlsx,.csv"');
    expect(input).toContain('class="sr-only"');
    expect(html).toMatch(/<label class="[^"]*border-hairline-strong[^"]*bg-surface[^"]*cursor-pointer[^"]*has-\[:focus-visible\]:ring-2/);
    expect(input).not.toContain("disabled");
  });
  it("takes another verb and the disabled flag", () => {
    const html = renderToStaticMarkup(<FilePicker id="ws-logo" name="logo" label={FILE_PICKER_COPY.chooseImage} disabled />);
    expect(html).toContain(">Choose an image</label>");
    expect(html).toMatch(/<input[^>]*disabled=""/);
  });
});
