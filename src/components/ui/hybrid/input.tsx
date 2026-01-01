import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId()
    
    return (
      <div className="ga-input-group">
        {label && (
          <label 
            htmlFor={inputId}
            className="ga-label"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              "ga-input ga-focus-visible",
              error && "ga-input-error",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="ga-error-text">{error}</p>
        )}
        {helperText && !error && (
          <p className="ga-helper-text">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }