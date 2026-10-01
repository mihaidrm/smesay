"use client"

// Segmented control: greige track, radius 999, 3 px padding, 28 px options at 13 px weight
// 500; the active option is a white pill with ink text, the others ink-muted. One is always
// active (docs/design-system.md, Components). A group of toggle buttons with aria-pressed.
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
    <div role="group" aria-label={label} className={cn("inline-flex rounded-full bg-greige p-[3px]", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full px-3 text-[13px] font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
              active ? "bg-white text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
