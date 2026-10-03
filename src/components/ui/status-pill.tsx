// Status pill: tint fill, text colour from the status table, 12 px weight 600, radius 999, in
// both modes through the tokens. Always shows its word, never colour alone. "Not answered" is
// an absence, not a status: surface fill, dashed strong hairline, muted text
// (docs/design-system.md, Colour).
import { cn } from "cn"
import type { StatusKey } from "@/lib/tokens"

const STYLES: Record<StatusKey, string> = {
  agree: "bg-agree-tint text-agree-text",
  pushedBack: "bg-pushed-tint text-pushed-text",
  unclear: "bg-unclear-tint text-unclear-text",
  missing: "bg-missing-tint text-missing-text",
  disagree: "bg-disagree-tint text-disagree-text",
}

const LABELS: Record<StatusKey, string> = {
  agree: "Agree",
  pushedBack: "Pushed back",
  unclear: "Unclear",
  missing: "Missing",
  disagree: "Disagree",
}

export function StatusPill({ status, children, className, ...props }: { status: StatusKey } & React.ComponentProps<"span">) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold leading-none", STYLES[status], className)} {...props}>
      {children ?? LABELS[status]}
    </span>
  )
}

export function NotAnsweredPill({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full border border-dashed border-hairline-strong bg-surface px-2.5 text-xs font-semibold leading-none text-ink-muted", className)}>
      Not answered
    </span>
  )
}

// Neutral pill: tint fill, soft ink text, for a label that is not a verdict (the Sample
// pill and the sample's status, stories/E2-3; design note 16).
export function NeutralPill({ children, className, ...props }: React.ComponentProps<"span">) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full bg-tint px-2.5 text-xs font-semibold leading-none text-ink-soft", className)} {...props}>
      {children}
    </span>
  )
}
