"use client"

import React, { useCallback, useEffect } from 'react'
import { useInstantNavigation } from '@/lib/instant-navigation'
import { useInstantUI } from '@/lib/instant-ui'

/**
 * INSTANT REACT COMPONENTS
 * Zero-latency UI components with instant feedback
 */

/**
 * Instant Link Component
 */
export function InstantLink({ 
  href, 
  children, 
  className = '',
  prefetchPriority = 'medium',
  ...props 
}: {
  href: string
  children: React.ReactNode
  className?: string
  prefetchPriority?: 'high' | 'medium' | 'low'
  [key: string]: any
}) {
  const { navigate, prefetch } = useInstantNavigation()

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    navigate(href)
  }, [href, navigate])

  const handleMouseEnter = useCallback(() => {
    prefetch(href, 'high') // High priority on hover
  }, [href, prefetch])

  useEffect(() => {
    // Prefetch on mount if high priority
    if (prefetchPriority === 'high') {
      prefetch(href, 'high')
    }
  }, [href, prefetch, prefetchPriority])

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`instant-link ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * Instant Button Component
 */
export function InstantButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'default',
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void | Promise<void>
  className?: string
  disabled?: boolean
  variant?: 'default' | 'primary' | 'secondary' | 'danger'
  [key: string]: any
}) {
  const { handleInstantClick } = useInstantUI()

  const variantClasses = {
    default: 'instant-btn-default',
    primary: 'instant-btn-primary',
    secondary: 'instant-btn-secondary',
    danger: 'instant-btn-danger'
  }

  return (
    <button
      className={`instant-button ${variantClasses[variant]} ${className}`}
      onClick={onClick ? handleInstantClick(onClick) : undefined}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Instant Form Component with optimistic updates
 */
export function InstantForm({
  children,
  onSubmit,
  optimisticUpdate,
  className = '',
  ...props
}: {
  children: React.ReactNode
  onSubmit: (data: FormData) => Promise<any>
  optimisticUpdate?: (data: any) => void
  className?: string
  [key: string]: any
}) {
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    
    // Apply optimistic update immediately
    if (optimisticUpdate) {
      const data = Object.fromEntries(formData.entries())
      optimisticUpdate(data)
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    }
  }, [onSubmit, optimisticUpdate])

  return (
    <form
      className={`instant-form ${className}`}
      onSubmit={handleSubmit}
      {...props}
    >
      {children}
    </form>
  )
}