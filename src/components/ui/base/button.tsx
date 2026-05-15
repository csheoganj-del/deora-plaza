import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles with Apple-grade design principles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none user-select-none -webkit-tap-highlight-color-transparent relative overflow-hidden",
  {
    variants: {
      variant: {
        // Primary - Apple-grade amber gradient with glass highlight
        default: "bg-gradient-to-b from-[#e6bb82] to-[#c99657] text-[#2b1d0e] hover:from-[#c99657] hover:to-[#e6bb82] shadow-[0_8px_20px_rgba(201,150,87,0.35)] hover:shadow-[0_12px_26px_rgba(201,150,87,0.4)] border-0 before:absolute before:top-0 before:left-0 before:right-0 before:h-1/2 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:pointer-events-none focus-visible:ring-2 focus-visible:ring-[rgba(230,187,130,0.4)] focus-visible:ring-offset-2",

        // Secondary - Glass morphism with subtle depth
        secondary: "bg-white/8 backdrop-blur-[12px] backdrop-saturate-[140%] text-[var(--text-primary)] border border-white/10 hover:bg-white/12 hover:backdrop-blur-[14px] hover:backdrop-saturate-[150%] shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] focus-visible:ring-2 focus-visible:ring-[rgba(230,187,130,0.4)] focus-visible:ring-offset-2",

        // Destructive - Error state with proper contrast
        destructive: "bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#ef4444] shadow-[0_8px_20px_rgba(239,68,68,0.35)] hover:shadow-[0_12px_26px_rgba(239,68,68,0.4)] border-0 before:absolute before:top-0 before:left-0 before:right-0 before:h-1/2 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:pointer-events-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-2",

        // Outline - Subtle border with glass background
        outline: "border border-white/15 bg-transparent text-[var(--text-primary)] hover:bg-white/6 hover:backdrop-blur-[8px] shadow-[0_4px_14px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:ring-[rgba(230,187,130,0.4)] focus-visible:ring-offset-2",

        // Ghost - Minimal with hover state
        ghost: "bg-transparent text-[var(--text-primary)] hover:bg-white/6 hover:backdrop-blur-[8px] focus-visible:ring-2 focus-visible:ring-[rgba(230,187,130,0.4)] focus-visible:ring-offset-2",

        // Link - Text-only with underline
        link: "text-[var(--warm-amber-600)] underline-offset-4 hover:underline bg-transparent shadow-none hover:shadow-none focus-visible:ring-2 focus-visible:ring-[rgba(230,187,130,0.4)] focus-visible:ring-offset-2",
      },
      size: {
        // Touch-friendly sizes following Apple HIG
        default: "h-11 px-6 py-3 text-base rounded-[14px] min-w-[88px]", // 44px minimum touch target
        sm: "h-9 px-4 py-2 text-sm rounded-[12px] min-w-[72px]", // 36px for compact interfaces
        lg: "h-12 px-8 py-4 text-lg rounded-[16px] min-w-[104px]", // 48px for prominent actions
        xl: "h-14 px-10 py-5 text-xl rounded-[18px] min-w-[120px]", // 56px for hero actions
        icon: "size-11 rounded-[14px]", // 44px square
        "icon-sm": "size-9 rounded-[12px]", // 36px square
        "icon-lg": "size-12 rounded-[16px]", // 48px square
        "icon-xl": "size-14 rounded-[18px]", // 56px square
      },
      loading: {
        true: "pointer-events-none relative",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // If asChild is true, we must return only the child element to satisfy React.Children.only in Slot
    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size, loading, className }))}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, loading, className }),
          // Hover and active states
          "hover:transform hover:-translate-y-[1px]",
          "active:transform active:scale-[0.98]",
          // Loading state
          loading && "cursor-not-allowed"
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
          </div>
        )}

        {/* Content wrapper with opacity control for loading */}
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </div>
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants, type ButtonProps }

