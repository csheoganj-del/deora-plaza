import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const inputId = React.useId()
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-[14px] font-medium text-[#202124]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-[14px] text-[#202124] placeholder:text-[#5f6368] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#d93025] focus:border-[#d93025] focus:ring-[#d93025]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-[#d93025]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[12px] text-[#5f6368]">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }