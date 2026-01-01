import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Google Material Design 3 base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary - Google Blue
        default: "bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm hover:shadow-md",
        
        // Secondary - Outlined
        secondary: "border border-[#dadce0] bg-white text-[#1a73e8] hover:bg-[#f8f9fa] hover:border-[#1a73e8]",
        
        // Destructive - Google Red
        destructive: "bg-[#d93025] text-white hover:bg-[#b52d20] shadow-sm hover:shadow-md",
        
        // Outline - Subtle border
        outline: "border border-[#dadce0] bg-transparent text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]",
        
        // Ghost - Minimal
        ghost: "bg-transparent text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]",
        
        // Link - Text only
        link: "text-[#1a73e8] underline-offset-4 hover:underline bg-transparent shadow-none",
        
        // Success - Google Green
        success: "bg-[#1e8e3e] text-white hover:bg-[#137333] shadow-sm hover:shadow-md",
        
        // Warning - Google Yellow
        warning: "bg-[#f9ab00] text-[#202124] hover:bg-[#e8940f] shadow-sm hover:shadow-md",
      },
      size: {
        default: "h-10 px-4 py-2 text-[14px] rounded-md",
        sm: "h-8 px-3 py-1 text-[12px] rounded-md",
        lg: "h-12 px-6 py-3 text-[16px] rounded-md",
        icon: "h-10 w-10 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-md",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }