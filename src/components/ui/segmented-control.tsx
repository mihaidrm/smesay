"use client"

// Segmented control: tint track, radius 999, 3 px padding, 28 px options at 13 px weight
// 600; the active option is a surface pill with ink text and the card shadow, the others
// muted. One is always active (docs/design-system.md, Components). A group of toggle buttons
// with aria-pressed.
import { cn } from "cn"

export type Segment<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: Segment<T>[]
  label: string
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-full border border-hairline bg-tint p-[3px]", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 ease-out outline-none disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              active ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
