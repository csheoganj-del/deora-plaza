"use client"

/**
 * INSTANT UI SYSTEM
 * Zero-latency interactions with optimistic updates and instant feedback
 */

interface OptimisticUpdate<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  data: T
  originalData?: T
  timestamp: number
  rollback: () => void
}

class InstantUIManager {
  private optimisticUpdates = new Map<string, OptimisticUpdate<any>>()
  private pendingActions = new Set<string>()
  private clickBuffer: Array<{ element: HTMLElement; timestamp: number }> = []

  /**
   * Instant click response - no delay
   */
  handleInstantClick(element: HTMLElement, callback: () => void | Promise<void>) {
    // Immediate visual feedback
    this.addClickFeedback(element)
    
    // Buffer rapid clicks
    const now = Date.now()
    this.clickBuffer = this.clickBuffer.filter(click => now - click.timestamp < 300)
    
    const recentClick = this.clickBuffer.find(click => click.element === element)
    if (recentClick) return // Prevent double clicks
    
    this.clickBuffer.push({ element, timestamp: now })

    // Execute callback immediately
    try {
      const result = callback()
      if (result instanceof Promise) {
        result.catch(error => {
          console.error('Instant click error:', error)
          this.addErrorFeedback(element)
        })
      }
    } catch (error) {
      console.error('Instant click error:', error)
      this.addErrorFeedback(element)
    }
  }

  /**
   * Optimistic update with instant UI response
   */
  optimisticUpdate<T>(
    id: string,
    type: 'create' | 'update' | 'delete',
    data: T,
    originalData: T | undefined,
    rollback: () => void
  ): void {
    const update: OptimisticUpdate<T> = {
      id,
      type,
      data,
      originalData,
      timestamp: Date.now(),
      rollback
    }

    this.optimisticUpdates.set(id, update)

    // Auto-cleanup after 30 seconds
    setTimeout(() => {
      this.optimisticUpdates.delete(id)
    }, 30000)
  }

  /**
   * Confirm optimistic update
   */
  confirmUpdate(id: string): void {
    this.optimisticUpdates.delete(id)
    this.pendingActions.delete(id)
  }

  /**
   * Rollback optimistic update
   */
  rollbackUpdate(id: string): void {
    const update = this.optimisticUpdates.get(id)
    if (update) {
      update.rollback()
      this.optimisticUpdates.delete(id)
      this.pendingActions.delete(id)
    }
  }

  /**
   * Add instant visual feedback to clicked element
   */
  private addClickFeedback(element: HTMLElement): void {
    // Add instant feedback class
    element.classList.add('instant-clicked')
    
    // Create ripple effect
    const ripple = document.createElement('div')
    ripple.className = 'instant-ripple'
    
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = (rect.width / 2 - size / 2) + 'px'
    ripple.style.top = (rect.height / 2 - size / 2) + 'px'
    
    element.style.position = 'relative'
    element.style.overflow = 'hidden'
    element.appendChild(ripple)

    // Remove feedback after animation
    setTimeout(() => {
      element.classList.remove('instant-clicked')
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
    }, 300)
  }

  /**
   * Add error feedback
   */
  private addErrorFeedback(element: HTMLElement): void {
    element.classList.add('instant-error')
    setTimeout(() => {
      element.classList.remove('instant-error')
    }, 500)
  }

  /**
   * Preload component data
   */
  preloadData(key: string, loader: () => Promise<any>): Promise<any> {
    const cached = this.getPreloadedData(key)
    if (cached) return Promise.resolve(cached)

    const promise = loader().then(data => {
      this.setPreloadedData(key, data)
      return data
    })

    return promise
  }

  /**
   * Get preloaded data
   */
  private preloadCache = new Map<string, { data: any; timestamp: number }>()
  
  private getPreloadedData(key: string): any {
    const cached = this.preloadCache.get(key)
    if (!cached) return null

    // Check if data is still fresh (5 minutes)
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      this.preloadCache.delete(key)
      return null
    }

    return cached.data
  }

  private setPreloadedData(key: string, data: any): void {
    this.preloadCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      optimisticUpdates: this.optimisticUpdates.size,
      pendingActions: this.pendingActions.size,
      preloadedItems: this.preloadCache.size,
      recentClicks: this.clickBuffer.length
    }
  }
}

// Global instance
export const instantUI = new InstantUIManager()

/**
 * Hook for instant UI interactions
 */
export function useInstantUI() {
  const handleInstantClick = (callback: () => void | Promise<void>) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      instantUI.handleInstantClick(e.currentTarget, callback)
    }
  }

  const optimisticUpdate = <T>(
    id: string,
    type: 'create' | 'update' | 'delete',
    data: T,
    originalData: T | undefined,
    rollback: () => void
  ) => {
    instantUI.optimisticUpdate(id, type, data, originalData, rollback)
  }

  const confirmUpdate = (id: string) => {
    instantUI.confirmUpdate(id)
  }

  const rollbackUpdate = (id: string) => {
    instantUI.rollbackUpdate(id)
  }

  return {
    handleInstantClick,
    optimisticUpdate,
    confirmUpdate,
    rollbackUpdate,
    getStats: () => instantUI.getStats()
  }
}



/**
 * Performance monitoring
 */
export function measureInteractionLatency(name: string, fn: () => void | Promise<void>) {
  const start = performance.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now()
        console.log(`[InstantUI] ${name} latency: ${(end - start).toFixed(2)}ms`)
      })
    } else {
      const end = performance.now()
      console.log(`[InstantUI] ${name} latency: ${(end - start).toFixed(2)}ms`)
      return result
    }
  } catch (error) {
    const end = performance.now()
    console.error(`[InstantUI] ${name} error after ${(end - start).toFixed(2)}ms:`, error)
    throw error
  }
}