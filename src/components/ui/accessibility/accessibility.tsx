"use client"

import React from 'react'
import { cn } from '@/lib/utils'

// Screen reader only text component
export function ScreenReaderOnly({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <span 
      className={cn(
        "sr-only absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0",
        className
      )}
    >
      {children}
    </span>
  )
}

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  )
}

// Live region for dynamic content announcements
export function LiveRegion({ 
  children, 
  politeness = 'polite',
  className 
}: { 
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  className?: string 
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

// Focus trap for modals and dialogs
export function FocusTrap({ 
  children, 
  enabled = true 
}: { 
  children: React.ReactNode
  enabled?: boolean 
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [enabled])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

// Accessible button with proper ARIA attributes
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  disabled,
  className,
  ...props
}: AccessibleButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        // Size variants with proper touch targets
        {
          'h-9 px-3 text-sm': size === 'sm',
          'h-11 px-4 text-sm': size === 'md', // 44px minimum
          'h-12 px-6 text-base': size === 'lg', // 48px
        },
        // Color variants
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
        },
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-describedby={loading ? 'loading-description' : undefined}
      {...props}
    >
      {loading && (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <ScreenReaderOnly id="loading-description">
            {loadingText}
          </ScreenReaderOnly>
        </>
      )}
      {children}
    </button>
  )
}

// Accessible form field with proper labeling
interface AccessibleFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  description?: string
  required?: boolean
  className?: string
}

export function AccessibleField({
  label,
  children,
  error,
  description,
  required,
  className
}: AccessibleFieldProps) {
  const fieldId = React.useId()
  const errorId = error ? `${fieldId}-error` : undefined
  const descriptionId = description ? `${fieldId}-description` : undefined

  return (
    <div className={cn("space-y-2", className)}>
      <label 
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-describedby': cn(descriptionId, errorId),
        'aria-invalid': !!error,
        'aria-required': required,
      })}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    if (e.key === nextKey) {
      e.preventDefault()
      setCurrentIndex(prev => {
        const next = prev + 1
        if (next >= items.length) {
          return loop ? 0 : prev
        }
        return next
      })
    } else if (e.key === prevKey) {
      e.preventDefault()
      setCurrentIndex(prev => {
        const next = prev - 1
        if (next < 0) {
          return loop ? items.length - 1 : prev
        }
        return next
      })
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCurrentIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCurrentIndex(items.length - 1)
    }
  }, [items, loop, orientation])

  React.useEffect(() => {
    items[currentIndex]?.focus()
  }, [currentIndex, items])

  return { currentIndex, handleKeyDown }
}