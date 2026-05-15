import * as React from "react"
import { cn } from "@/lib/utils"

export interface AppleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  loading?: boolean
}

const AppleForm = React.forwardRef<HTMLFormElement, AppleFormProps>(
  ({ className, children, loading = false, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(
          "apple-auth-form", // Use Apple-grade form styling
          "space-y-6", // Consistent spacing between form elements
          loading && "pointer-events-none opacity-75", // Disable form when loading
          className
        )}
        {...props}
      >
        {children}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="apple-loading-spinner" />
            </div>
          </div>
        )}
      </form>
    )
  }
)

AppleForm.displayName = "AppleForm"

// Form field wrapper component for consistent spacing and layout
export interface AppleFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AppleFormField = React.forwardRef<HTMLDivElement, AppleFormFieldProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("apple-form-group", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

AppleFormField.displayName = "AppleFormField"

// Form label component
export interface AppleFormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
  required?: boolean
}

const AppleFormLabel = React.forwardRef<HTMLLabelElement, AppleFormLabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("apple-label", className)}
        {...props}
      >
        {children}
        {required && <span className="text-[var(--error-color)] ml-1">*</span>}
      </label>
    )
  }
)

AppleFormLabel.displayName = "AppleFormLabel"

// Form error message component
export interface AppleFormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AppleFormError = React.forwardRef<HTMLDivElement, AppleFormErrorProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("apple-error-message", className)}
        role="alert"
        {...props}
      >
        <p>{children}</p>
      </div>
    )
  }
)

AppleFormError.displayName = "AppleFormError"

export { AppleForm, AppleFormField, AppleFormLabel, AppleFormError }