// Banner (the ambiguity flag, design v2): a card on a soft violet gradient with a sun dot, ink
// text, a secondary Dismiss pill. Empty state: a dashed card with a title, one line that says
// what to do and, when asked, the mascot in the pose that fits the screen. Toast: dark surface, light text, violet
// 300 action, the toast shadow (docs/design-system.md, Components; design note 33).
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { Mascot, type MascotPose } from "@/components/app/mascot"

// action (E4-4): a node drawn in the Dismiss pill's place, for a Dismiss that is a form; the
// pill's own classes are exported as bannerButtonClass for it.
export const bannerButtonClass = buttonVariants({ variant: "secondary", size: "small", className: "shrink-0" })

export function Banner({
  children,
  onDismiss,
  dismissLabel = "Dismiss",
  action,
  className,
  ...props
}: {
  children: React.ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  action?: React.ReactNode
  className?: string
} & Omit<React.ComponentProps<"div">, "children" | "className">) {
  return (
    <div role="status" className={cn("flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-[linear-gradient(135deg,var(--violet-soft),var(--surface))] px-4 py-3 text-sm text-ink shadow-card", className)} {...props}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-[7px] block size-2 shrink-0 rounded-full bg-sun" />
        <div>{children}</div>
      </div>
      {action ?? null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={bannerButtonClass}
        >
          {dismissLabel}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyState({ title, children, mascot, className }: { title: string; children: React.ReactNode; mascot?: MascotPose; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-2xl border border-dashed border-hairline-strong bg-surface px-6 py-10 text-center", className)}>
      {mascot && <Mascot pose={mascot} size={96} className="mb-2" />}
      <div className="text-lg font-bold tracking-[-0.02em]">{title}</div>
      <div className="text-[13px] text-ink-muted">{children}</div>
    </div>
  )
}

export function Toast({ children, action, onAction, className }: { children: React.ReactNode; action?: string; onAction?: () => void; className?: string }) {
  return (
    <div role="status" className={cn("inline-flex items-center gap-4 rounded-2xl bg-[#15131F] px-4 py-3 text-sm text-[#F3F1FA] shadow-toast dark:bg-raised", className)}>
      <span>{children}</span>
      {action ? (
        <button type="button" onClick={onAction} className="font-semibold text-[#B8A8FF] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-[#15131F]">
          {action}
        </button>
      ) : null}
    </div>
  )
}
