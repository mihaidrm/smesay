// shadcn/ui button restyled to the design system (docs/design-system.md, Components):
// primary ink pill, secondary white pill with hairline-strong, tertiary underlined link,
// destructive white pill with the danger colour. Heights 40 in the app, 48 on the respondent
// side and marketing. Focus: 2 px teal 700 ring with 2 px offset on focus-visible.
// Loading keeps the label and puts a 14 px ring before it. Disabled is the same control at
// 40 percent opacity.
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border font-medium whitespace-nowrap transition-[background-color,filter,color] duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "rounded-full border-ink bg-ink text-white hover:brightness-[1.18]",
        secondary: "rounded-full border-hairline-strong bg-white text-ink hover:bg-grey-50",
        tertiary: "rounded-none border-transparent bg-transparent px-0 text-ink underline underline-offset-4 hover:text-teal-700",
        destructive: "rounded-full border-danger bg-white text-danger hover:bg-grey-50",
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
