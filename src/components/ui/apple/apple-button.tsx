import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const appleButtonVariants = cva(
  "apple-button-primary apple-focus-visible", // Base Apple-grade classes
  {
    variants: {
      variant: {
        primary: "apple-button-primary",
        secondary: "apple-interactive bg-transparent border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)]",
        ghost: "apple-interactive bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
        icon: "w-11 h-11 p-0"
      },
      loading: {
        true: "loading pointer-events-none",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      loading: false
    }
  }
)

export interface AppleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appleButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false, 
    loadingText = "Checking...", 
    asChild = false, 
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Show loading text when loading, otherwise show children
    const buttonContent = loading ? loadingText : children

    return (
      <Comp
        className={cn(appleButtonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)

AppleButton.displayName = "AppleButton"

export { AppleButton, appleButtonVariants }