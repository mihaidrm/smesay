// shadcn/ui button restyled to design v2 (docs/design-system.md, Components; design note 33):
// primary is the violet gradient pill with a glow, secondary a surface pill with the strong
// hairline, tertiary an underlined link in violet text, destructive a surface pill in the
// danger colour. Heights 40 in the app, 48 on the respondent side and marketing. Hover lifts
// the pill 2 px over 150 ms; the primary's glow deepens and brightens 8 percent; the
// secondary fills violet soft; pressed drops back in 60 ms; nothing moves under reduced
// motion. Focus: 2 px violet ring with 2 px offset on focus-visible. Loading keeps the label
// and puts a 14 px ring before it. Disabled is the same control at 40 percent opacity.
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color,filter] duration-150 ease-out outline-none select-none hover:-translate-y-0.5 active:translate-y-0 active:duration-[60ms] motion-reduce:hover:translate-y-0 focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-ground disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "rounded-full border-transparent bg-aurora-button text-white shadow-glow hover:shadow-glow-hover hover:brightness-[1.08]",
        secondary: "rounded-full border-hairline-strong bg-surface text-ink hover:border-violet hover:bg-violet-soft",
        tertiary: "rounded-none border-transparent bg-transparent px-0 text-violet-text underline underline-offset-4 hover:translate-y-0 hover:text-ink",
        destructive: "rounded-full border-danger bg-surface text-danger hover:bg-coral-soft",
      },
      size: {
        app: "h-10 px-5 text-sm",
        respondent: "h-12 px-6 text-[17px]",
        small: "h-8 px-3.5 text-[13px]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "app",
    },
  }
)

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  )
}

function Button({
  className,
  variant = "primary",
  size = "app",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
