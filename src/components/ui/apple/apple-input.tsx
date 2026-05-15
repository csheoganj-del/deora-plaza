import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AppleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

const AppleInput = React.forwardRef<HTMLInputElement, AppleInputProps>(
  ({ className, type, label, error, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    
    // Determine actual input type (handle password toggle)
    const inputType = type === 'password' && showPassword ? 'text' : type
    const isPasswordField = type === 'password'
    const shouldShowToggle = isPasswordField && (showPasswordToggle ?? true)

    return (
      <div className="apple-form-group">
        {label && (
          <label className="apple-label">
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              "apple-input",
              error && "apple-input-error",
              shouldShowToggle && "password-input", // Add padding for toggle button
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {shouldShowToggle && (
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {error && (
          <div className="apple-error-message">
            <p>{error}</p>
          </div>
        )}
      </div>
    )
  }
)

AppleInput.displayName = "AppleInput"

export { AppleInput }