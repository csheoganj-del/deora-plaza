import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-transform duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#6D5DFB] focus-visible:ring-[#6D5DFB]/20 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[.98] hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "bg-[#6D5DFB] text-white hover:bg-[#6D5DFB]/90 shadow-[0_6px_18px_rgba(197,138,45,0.25)] hover:shadow-[0_10px_28px_rgba(197,138,45,0.35)] border border-[#6D5DFB]/20",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[#6D5DFB]/50 bg-transparent text-[#6D5DFB] shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:bg-[#6D5DFB]/10 hover:text-[#6D5DFB]",
        secondary:
          "bg-[#EDEBFF] text-[#2E2E2E] hover:bg-[#EDEBFF]/90 shadow-[0_6px_18px_rgba(230,181,102,0.35)] hover:shadow-[0_10px_28px_rgba(230,181,102,0.45)]",
        ghost:
          "hover:bg-[#6D5DFB]/10 hover:text-[#6D5DFB]",
        link: "text-[#6D5DFB] underline-offset-4 hover:underline",
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

