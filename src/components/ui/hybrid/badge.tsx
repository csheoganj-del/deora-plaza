import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "ga-badge",
  {
    variants: {
      variant: {
        default: "ga-badge-primary",
        secondary: "ga-badge-secondary", 
        success: "ga-badge-success",
        warning: "ga-badge-warning",
        destructive: "ga-badge-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && icon}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }