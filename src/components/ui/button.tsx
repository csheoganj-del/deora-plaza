import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--royal-red))] text-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-red))/90] shadow-[0_0_10px_rgba(128,0,32,0.4)] border border-[hsl(var(--royal-gold))/20]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[hsl(var(--royal-gold))/50] bg-transparent text-[hsl(var(--royal-gold))] shadow-xs hover:bg-[hsl(var(--royal-gold))/10] hover:text-[hsl(var(--royal-gold))]",
        secondary:
          "bg-[hsl(var(--royal-gold))] text-[hsl(var(--royal-red))] hover:bg-[hsl(var(--royal-gold))/90] shadow-[0_0_10px_rgba(212,175,55,0.4)]",
        ghost:
          "hover:bg-[hsl(var(--royal-gold))/10] hover:text-[hsl(var(--royal-gold))]",
        link: "text-[hsl(var(--royal-gold))] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
