"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FormFieldProps {
  children: React.ReactNode
  error?: string
  success?: string
  warning?: string
  required?: boolean
  className?: string
}

export function FormField({
  children,
  error,
  success,
  warning,
  required,
  className
}: FormFieldProps) {
  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const hasWarning = !!warning && !hasError && !hasSuccess

  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {hasError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          <span id="error-message">{error}</span>
        </div>
      )}
      {hasSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span id="success-message">{success}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span id="warning-message">{warning}</span>
        </div>
      )}
    </div>
  )
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function FormLabel({ 
  children, 
  required, 
  className, 
  ...props 
}: FormLabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
  )
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  success?: string
  warning?: string
  label?: string
  required?: boolean
  helpText?: string
}

export function ValidatedInput({
  error,
  success,
  warning,
  label,
  required,
  helpText,
  className,
  id,
  ...props
}: ValidatedInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const hasWarning = !!warning && !hasError && !hasSuccess

  return (
    <FormField error={error} success={success} warning={warning}>
      {label && (
        <FormLabel htmlFor={inputId} required={required}>
          {label}
        </FormLabel>
      )}
      <input
        id={inputId}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-red-500 focus-visible:ring-red-500",
          hasSuccess && "border-green-500 focus-visible:ring-green-500",
          hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
          className
        )}
        aria-invalid={hasError}
        aria-describedby={cn(
          hasError && "error-message",
          hasSuccess && "success-message", 
          hasWarning && "warning-message",
          helpText && "help-text"
        )}
        {...props}
      />
      {helpText && (
        <p id="help-text" className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </FormField>
  )
}

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  success?: string
  warning?: string
  label?: string
  required?: boolean
  helpText?: string
}

export function ValidatedTextarea({
  error,
  success,
  warning,
  label,
  required,
  helpText,
  className,
  id,
  ...props
}: ValidatedTextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const hasWarning = !!warning && !hasError && !hasSuccess

  return (
    <FormField error={error} success={success} warning={warning}>
      {label && (
        <FormLabel htmlFor={textareaId} required={required}>
          {label}
        </FormLabel>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-red-500 focus-visible:ring-red-500",
          hasSuccess && "border-green-500 focus-visible:ring-green-500",
          hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
          className
        )}
        aria-invalid={hasError}
        aria-describedby={cn(
          hasError && "error-message",
          hasSuccess && "success-message",
          hasWarning && "warning-message", 
          helpText && "help-text"
        )}
        {...props}
      />
      {helpText && (
        <p id="help-text" className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
    </FormField>
  )
}

// Form validation utilities
export function validateRequired(value: string | undefined | null): string | undefined {
  if (!value || value.trim() === '') {
    return 'This field is required'
  }
  return undefined
}

export function validateEmail(email: string): string | undefined {
  if (!email) return undefined
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return undefined
}

export function validateMinLength(value: string, minLength: number): string | undefined {
  if (!value) return undefined
  if (value.length < minLength) {
    return `Must be at least ${minLength} characters long`
  }
  return undefined
}

export function validateMaxLength(value: string, maxLength: number): string | undefined {
  if (!value) return undefined
  if (value.length > maxLength) {
    return `Must be no more than ${maxLength} characters long`
  }
  return undefined
}

export function validatePhone(phone: string): string | undefined {
  if (!phone) return undefined
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return 'Please enter a valid phone number'
  }
  return undefined
}