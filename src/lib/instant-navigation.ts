"use client"

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

/**
 * INSTANT NAVIGATION SYSTEM
 * Zero-latency navigation with aggressive prefetching and instant transitions
 */

interface PrefetchEntry {
  href: string
  timestamp: number
  prefetched: boolean
  priority: 'high' | 'medium' | 'low'
}

class InstantNavigationManager {
  private prefetchCache = new Map<string, PrefetchEntry>()
  private router: any = null
  private prefetchQueue: string[] = []
  private isProcessingQueue = false
  private observer: IntersectionObserver | null = null

  setRouter(router: any) {
    this.router = router
  }

  /**
   * Instant navigation with zero delay
   */
  navigateInstant(href: string) {
    if (!this.router) return

    // Check if already prefetched
    const cached = this.prefetchCache.get(href)
    if (cached?.prefetched) {
      // Instant navigation - already prefetched
      this.router.push(href)
      return
    }

    // Prefetch and navigate immediately
    this.prefetchRoute(href, 'high')
    this.router.push(href)
  }

  /**
   * Prefetch route with priority
   */
  prefetchRoute(href: string, priority: 'high' | 'medium' | 'low' = 'medium') {
    if (!this.router) return

    const existing = this.prefetchCache.get(href)
    if (existing?.prefetched) return

    // Add to cache
    this.prefetchCache.set(href, {
      href,
      timestamp: Date.now(),
      prefetched: false,
      priority
    })

    // Add to queue based on priority
    if (priority === 'high') {
      this.prefetchQueue.unshift(href)
    } else {
      this.prefetchQueue.push(href)
    }

    this.processQueue()
  }

  /**
   * Process prefetch queue
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.prefetchQueue.length === 0) return

    this.isProcessingQueue = true

    while (this.prefetchQueue.length > 0) {
      const href = this.prefetchQueue.shift()
      if (!href) continue

      try {
        // Use Next.js router prefetch
        await this.router.prefetch(href)
        
        // Mark as prefetched
        const entry = this.prefetchCache.get(href)
        if (entry) {
          entry.prefetched = true
          this.prefetchCache.set(href, entry)
        }

        console.log(`[InstantNav] Prefetched: ${href}`)
      } catch (error) {
        console.warn(`[InstantNav] Failed to prefetch ${href}:`, error)
      }

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    this.isProcessingQueue = false
  }

  /**
   * Setup intersection observer for automatic prefetching
   */
  setupAutoPrefetch() {
    if (typeof window === 'undefined' || this.observer) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement
            const href = link.getAttribute('href')
            if (href && href.startsWith('/')) {
              this.prefetchRoute(href, 'medium')
            }
          }
        })
      },
      { rootMargin: '100px' } // Prefetch when 100px away from viewport
    )

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]')
    links.forEach(link => this.observer?.observe(link))
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.prefetchCache.clear()
    this.prefetchQueue = []
  }

  /**
   * Get prefetch stats
   */
  getStats() {
    const total = this.prefetchCache.size
    const prefetched = Array.from(this.prefetchCache.values()).filter(e => e.prefetched).length
    
    return {
      total,
      prefetched,
      pending: total - prefetched,
      queueLength: this.prefetchQueue.length,
      hitRate: total > 0 ? Math.round((prefetched / total) * 100) : 0
    }
  }
}

// Global instance
export const instantNav = new InstantNavigationManager()

/**
 * Hook for instant navigation
 */
export function useInstantNavigation() {
  const router = useRouter()
  const setupRef = useRef(false)

  useEffect(() => {
    instantNav.setRouter(router)
    
    if (!setupRef.current) {
      // Setup auto-prefetching
      setTimeout(() => instantNav.setupAutoPrefetch(), 1000)
      setupRef.current = true
    }

    return () => {
      if (setupRef.current) {
        instantNav.cleanup()
        setupRef.current = false
      }
    }
  }, [router])

  const navigate = useCallback((href: string) => {
    instantNav.navigateInstant(href)
  }, [])

  const prefetch = useCallback((href: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    instantNav.prefetchRoute(href, priority)
  }, [])

  return {
    navigate,
    prefetch,
    getStats: () => instantNav.getStats()
  }
}

/**
 * Prefetch critical routes on app start
 */
export function prefetchCriticalRoutes() {
  const criticalRoutes = [
    '/dashboard',
    '/dashboard/orders',
    '/dashboard/billing',
    '/dashboard/kitchen',
    '/dashboard/tables',
    '/dashboard/menu',
    '/dashboard/customers',
    '/dashboard/inventory',
    '/dashboard/realtime'
  ]

  criticalRoutes.forEach(route => {
    instantNav.prefetchRoute(route, 'high')
  })
}

// Auto-prefetch critical routes
if (typeof window !== 'undefined') {
  // Prefetch after initial load
  window.addEventListener('load', () => {
    setTimeout(prefetchCriticalRoutes, 2000)
  })
}