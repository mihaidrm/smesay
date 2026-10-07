"use client";
// The file picker (design note 103). Mihai, 2026-10-07: "its impossible to know that choose
// file is a button looking at it". The browser's own "Choose File  No file chosen" control is
// replaced by a label styled as the secondary button around the real file input, which stays
// in the DOM with its id, name and accept (the field's own Label still names it, and
// Playwright's setInputFiles still finds it) but off screen with sr-only
// (tailwindcss.com/docs/display#screen-reader-only). A click on a label runs its control's
// activation behaviour (html.spec.whatwg.org/multipage/forms.html#the-label-element), so the
// label opens the file dialog; the input keeps the keyboard focus and the ring shows on the
// label through has-[:focus-visible]
// (tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-descendants). The
// chosen file's name shows beside the button in muted text, "No file chosen" before a pick.
// React resets a form after its action succeeds (react.dev/reference/react-dom/components/form,
// "form reset"); resetting a form fires its reset event
// (html.spec.whatwg.org/multipage/form-control-infrastructure.html#resetting-a-form), which
// clears the name shown. Disabled: the same control at 40 percent, as every button.
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export const FILE_PICKER_COPY = {
  chooseFile: "Choose a file",
  chooseImage: "Choose an image",
  none: "No file chosen",
};

type Props = Omit<ComponentProps<"input">, "type" | "className"> & {
  /** The button's words, a verb: FILE_PICKER_COPY.chooseFile unless the screen says otherwise. */
  label?: string;
  className?: string;
};

export function FilePicker({ label = FILE_PICKER_COPY.chooseFile, className, disabled, onChange, ...input }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const clear = () => setName(null);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);
  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-center gap-3", className)} data-slot="file-picker">
      <label
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-40",
        )}
      >
        <input
          ref={ref}
          type="file"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            setName(e.target.files?.[0]?.name ?? null);
            onChange?.(e);
          }}
          {...input}
        />
        {label}
      </label>
      <span className="min-w-0 truncate text-sm text-ink-muted" data-testid={input.id ? `${input.id}-name` : undefined}>
        {name ?? FILE_PICKER_COPY.none}
      </span>
    </span>
  );
}
