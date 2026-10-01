// Banner (the ambiguity flag): unclear tint and text, a Dismiss pill. Empty state: a dashed
// hairline-strong box with a title and one line that says what to do. Toast: ink, white text,
// teal 300 action, the toast shadow (docs/design-system.md, Components).
import { cn } from "cn"

export function Banner({
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
}: {
  children: React.ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  className?: string
}) {
  return (
    <div role="status" className={cn("flex items-center justify-between gap-4 rounded-lg bg-unclear-tint px-4 py-3 text-unclear-text", className)}>
      <div>{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="h-8 shrink-0 rounded-full border border-[#B7A6E3] bg-white px-3.5 text-[13px] font-medium text-unclear-text outline-none hover:bg-grey-50 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
        >
          {dismissLabel}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1 rounded-xl border border-dashed border-hairline-strong px-6 py-10 text-center", className)}>
      <div className="font-medium">{title}</div>
      <div className="text-[13px] text-ink-muted">{children}</div>
    </div>
  )
}

export function Toast({ children, action, onAction, className }: { children: React.ReactNode; action?: string; onAction?: () => void; className?: string }) {
  return (
    <div role="status" className={cn("inline-flex items-center gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-toast", className)}>
      <span>{children}</span>
      {action ? (
        <button type="button" onClick={onAction} className="font-medium text-teal-300 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
          {action}
        </button>
      ) : null}
    </div>
  )
}
