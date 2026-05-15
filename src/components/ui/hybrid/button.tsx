import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Google-Apple Hybrid base styles
  "ga-button ga-focus-visible",
  {
    variants: {
      variant: {
        // Primary - Soft Google Blue with Apple polish
        default: "ga-button-primary",
        
        // Secondary - Clean outline
        secondary: "ga-button-secondary",
        
        // Success - Muted green
        success: "ga-button-success",
        
        // Warning - Warm amber
        warning: "ga-button-warning",
        
        // Destructive - Soft red
        destructive: "ga-button-error",
        
        // Ghost - Minimal
        ghost: "ga-button-ghost",
        
        // Link - Text only
        link: "text-[var(--color-primary)] underline-offset-4 hover:underline bg-transparent shadow-none p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "ga-button-sm h-8",
        lg: "ga-button-lg h-12",
        icon: "ga-button-icon",
        "icon-sm": "ga-button-icon-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }