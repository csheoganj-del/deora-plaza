/**
 * Performance utilities for optimizing the app
 */

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Debounce function - delays execution until after wait milliseconds
 * Perfect for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - ensures function is called at most once per interval
 * Perfect for scroll handlers, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Hook for debounced values
 * Usage: const debouncedSearch = useDebounce(searchTerm, 300)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for intersection observer - lazy load components
 * Usage: const [ref, isVisible] = useIntersectionObserver()
 */
export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [options])

  return [targetRef, isIntersecting] as const
}

/**
 * Lazy load images only when they're about to enter viewport
 */
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  })

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src)
    }
  }, [isVisible, src, imageSrc])

  return [ref, imageSrc] as const
}

/**
 * Format currency for Indian Rupees with proper localization
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

/**
 * Batch multiple state updates to prevent unnecessary re-renders
 */
export function useBatchedUpdates() {
  const updates = useRef<Array<() => void>>([])
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const scheduleUpdate = useCallback((update: () => void) => {
    updates.current.push(update)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      updates.current.forEach(fn => fn())
      updates.current = []
    }, 0)
  }, [])

  return scheduleUpdate
}

