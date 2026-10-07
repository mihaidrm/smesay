"use client";
// The brand form (stories/E2-5, acceptance 1 and 2): name, logo file, accent with its picker
// and contrast line. The contrast line follows the field as typed (src/lib/contrast.ts is pure)
// and the server repeats every check (src/lib/brand.ts). useActionState wires the save action
// (react.dev/reference/react/useActionState). Components: docs/design-system.md; the logo's
// picker is src/components/app/file-picker.tsx (design note 103).
// The swatch is an input of type color (developer.mozilla.org/docs/Web/HTML/Element/input/
// color) that opens the browser's picker (design note 104). The browser paints its own box
// inside a colour input, so the input sits over the app's 40 px swatch at opacity 0 and the
// swatch under it carries the colour, the hairline and the focus ring (Tailwind's has-[]
// variant: tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-descendants).
// It has no name, so the form posts the hex field only; the two stay in sync through
// pickerValue() and pickedHex() (src/lib/brand-rules.ts).
import { useActionState, useState } from "react";
import { FilePicker, FILE_PICKER_COPY } from "@/components/app/file-picker";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accentContrast, BRAND_COPY, HEX, MIN_CONTRAST, pickedHex, pickerValue } from "@/lib/brand-rules";
import { LOGO_COPY, LOGO_MAX_BYTES } from "@/lib/logo";
import { saveBrandAction, type BrandState } from "./actions";

export function BrandForm({ name, accentHex, logoUrl }: { name: string; accentHex: string | null; logoUrl: string | null }) {
  const [state, action, pending] = useActionState<BrandState, FormData>(saveBrandAction, { error: null, field: null, saved: false, tooLight: false });
  const [accent, setAccent] = useState(accentHex ?? "");
  // The picker's colour: the field when it holds a colour, the last valid one while it does
  // not, the default violet when it is empty.
  const [swatch, setSwatch] = useState(() => pickerValue(accentHex ?? "") ?? pickerValue("")!);
  const typeAccent = (text: string) => {
    setAccent(text);
    const next = pickerValue(text);
    if (next !== null) setSwatch(next);
  };
  // The size is checked here before the upload too (the server repeats it), so an over-size
  // file never leaves the browser.
  const [fileError, setFileError] = useState<string | null>(null);
  const ratio = accentContrast(accent.trim() || null);
  const valid = accent.trim() === "" || HEX.test(accent.trim());
  const initial = name.trim().charAt(0).toUpperCase() || "W";
  return (
    <form action={action} noValidate className="flex flex-col gap-4 px-4 py-4">
      {state.error && state.field === null && <Banner>{state.error}</Banner>}
      {!state.error && state.tooLight && <Banner>{BRAND_COPY.tooLight}</Banner>}
      {!state.error && state.saved && !state.tooLight && <p role="status" className="text-[13px] text-agree-text">{BRAND_COPY.saved}</p>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input id="ws-name" name="name" defaultValue={name} maxLength={80} className="h-9" aria-invalid={state.field === "name" ? true : undefined} aria-describedby={state.field === "name" ? "ws-name-error" : undefined} />
        {state.field === "name" && <p id="ws-name-error" className="text-sm text-danger">{state.error}</p>}
      </div>
      <div className="flex items-center gap-3">
        {/* A plain img: the logo comes from this app's own route at 40 px, nothing for next/image to resize or host. */}
        {logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logoUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-contain" data-testid="logo-preview" />
          : <div className="flex size-10 items-center justify-center rounded-lg bg-violet font-extrabold text-on-violet" aria-hidden="true">{initial}</div>}
        <div className="flex flex-grow flex-col gap-1">
          <Label htmlFor="ws-logo">Logo</Label>
          <span className="text-xs text-ink-muted">Use a PNG or SVG up to 1 MB. It shows at 24 px in the respondent header in place of the mark.</span>
          <FilePicker id="ws-logo" name="logo" accept="image/png,image/svg+xml" label={FILE_PICKER_COPY.chooseImage} disabled={pending} className="mt-1"
            onChange={(e) => setFileError((e.target.files?.[0]?.size ?? 0) > LOGO_MAX_BYTES ? LOGO_COPY.tooBig : null)}
            aria-invalid={fileError || state.field === "logo" ? true : undefined} aria-describedby={fileError || state.field === "logo" ? "ws-logo-error" : undefined} />
          {(fileError || state.field === "logo") && <p id="ws-logo-error" className="text-sm text-danger">{fileError ?? state.error}</p>}
          {logoUrl && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="removeLogo" value="1" /> Remove logo</label>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="relative block size-10 shrink-0 rounded-[10px] border border-hairline has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface" style={{ background: swatch }} data-testid="accent-swatch" data-valid={valid ? undefined : "false"}>
          <input type="color" value={swatch} onChange={(e) => { setSwatch(e.target.value); setAccent(pickedHex(e.target.value)); }} aria-label={BRAND_COPY.pick} aria-describedby="ws-accent-line" className="absolute inset-0 size-full cursor-pointer rounded-[10px] opacity-0" data-testid="accent-picker" />
        </span>
        <div className="flex flex-grow flex-col gap-1">
          <Label htmlFor="ws-accent">Accent colour</Label>
          <div className="flex items-center gap-3">
            <Input id="ws-accent" name="accentHex" value={accent} onChange={(e) => typeAccent(e.target.value)} placeholder="#1F4F7A" className="h-9 w-40 font-mono"
              aria-invalid={state.field === "accentHex" ? true : undefined} aria-describedby="ws-accent-line" />
            <Button type="button" variant="tertiary" size="small" onClick={() => typeAccent("")} disabled={accent === ""} data-testid="accent-clear">{BRAND_COPY.clear}</Button>
          </div>
          <p id="ws-accent-line" className={`text-xs ${ratio !== null && ratio < MIN_CONTRAST ? "text-danger" : "text-ink-muted"}`} data-testid="accent-line">
            {state.field === "accentHex" ? state.error
              : ratio === null ? BRAND_COPY.noAccent
              : `The contrast on white is ${ratio.toFixed(2)}:1. ${BRAND_COPY.accentUse}`}
          </p>
        </div>
      </div>
      <div className="flex justify-end"><Button type="submit" loading={pending} disabled={fileError !== null}>Save</Button></div>
    </form>
  );
}
