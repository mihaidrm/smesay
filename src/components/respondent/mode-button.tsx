"use client";
// The light and dark switch in the respondent header (design note 97): on every respondent
// screen with a header, the visitors' sample at /sample, a real link and the Build preview, at
// the right end. The respondent side follows the phone's setting until the person presses it;
// the press is the sidebar toggle's (useDarkMode, src/components/app/mode-toggle.tsx): the
// same sweep, the same stored choice ("smesay-mode"), applied before the first paint by the
// script in src/app/layout.tsx. Also on the pages without a workspace (an unknown link, the
// link's error and not-found pages, the preview's refused pages). A switch named "Dark mode" (WAI-ARIA switch role,
// w3.org/WAI/ARIA/apg/patterns/switch/), drawn as a 36 px round button with the moon on light
// and the sun on dark (Lucide, the app's icon set), inside a 48 px tap target (the respondent
// side's minimum, docs/design-system.md); the negative margins leave 28 px in the row, the
// initials' height, so the header keeps its height. focus:outline-hidden keeps a transparent
// outline that forced colours draw (Tailwind's outline-hidden, node_modules/tailwindcss/dist/lib.js),
// as the rest of the respondent side does (E7-7). The
// server render draws the moon until the client knows the mode.
import { MoonIcon, SunIcon } from "lucide-react";
import { useDarkMode } from "@/components/app/mode-toggle";
import { ABOUT_YOU_COPY } from "@/lib/build-copy";

export function ModeButton() {
  const { dark, flip } = useDarkMode();
  const Icon = dark ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={ABOUT_YOU_COPY.darkMode}
      title={ABOUT_YOU_COPY.darkMode}
      onClick={flip}
      data-testid="respondent-mode"
      className="group -my-2.5 -mr-2 flex size-12 shrink-0 items-center justify-center rounded-full focus:outline-hidden"
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-hairline-strong bg-surface text-ink-muted transition-colors group-hover:text-ink group-focus-visible:ring-2 group-focus-visible:ring-violet group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface">
        <Icon aria-hidden="true" className="size-[18px]" strokeWidth={2} />
      </span>
    </button>
  );
}
