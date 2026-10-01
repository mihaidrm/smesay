// Status pill: tint fill, text colour from the status table, 12 px weight 500, radius 999.
// Always shows its word, never colour alone. "Not answered" is an absence, not a status:
// white fill, dashed hairline-strong border, ink-muted text (docs/design-system.md, Colour).
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

export function StatusPill({ status, children, className }: { status: StatusKey; children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full px-2.5 text-xs font-medium leading-none", STYLES[status], className)}>
      {children ?? LABELS[status]}
    </span>
  )
}

export function NotAnsweredPill({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-full border border-dashed border-hairline-strong bg-white px-2.5 text-xs font-medium leading-none text-ink-muted", className)}>
      Not answered
    </span>
  )
}
