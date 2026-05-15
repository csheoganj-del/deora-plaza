import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[#e8f0fe] text-[#1a73e8] border border-[#4285f4]",
        secondary: "bg-[#f8f9fa] text-[#5f6368] border border-[#e0e0e0]",
        destructive: "bg-[#fce8e6] text-[#d93025] border border-[#ea4335]",
        success: "bg-[#e8f5e8] text-[#1e8e3e] border border-[#34a853]",
        warning: "bg-[#fef7e0] text-[#b45309] border border-[#f9ab00]",
        outline: "text-[#5f6368] border border-[#dadce0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }