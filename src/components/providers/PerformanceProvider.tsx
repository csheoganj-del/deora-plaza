"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useInstantNavigation } from '@/lib/instant-navigation'
import { useInstantUI } from '@/lib/instant-ui'
import { fastCache } from '@/lib/fast-cache'

/**
 * PERFORMANCE PROVIDER
 * Orchestrates all performance systems for ultra-fast UI
 */

interface PerformanceMetrics {
  navigation: {
    prefetched: number
    hitRate: number
    avgLatency: number
  }
  ui: {
    optimisticUpdates: number
    pendingActions: number
    avgResponseTime: number
  }
  cache: {
    hitRate: number
    size: number
    efficiency: number
  }
  realtime: {
    connected: boolean
    subscriptions: number
    latency: number
  }
  overall: {
    score: number
    grade: 'A+' | 'A' | 'B' | 'C' | 'D'
  }
}

interface PerformanceContextType {
  metrics: PerformanceMetrics
  isOptimized: boolean
  optimizePerformance: () => void
  clearAllCaches: () => void
  getDetailedStats: () => any
}

const PerformanceContext = createContext<PerformanceContextType | null>(null)

export function usePerformance() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider')
  }
  return context
}

interface PerformanceProviderProps {
  children: React.ReactNode
  enableOptimizations?: boolean
  enableMonitoring?: boolean
}

export function PerformanceProvider({ 
  children, 
  enableOptimizations = true,
  enableMonitoring = process.env.NODE_ENV === 'development' 
}: PerformanceProviderProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    navigation: { prefetched: 0, hitRate: 0, avgLatency: 0 },
    ui: { optimisticUpdates: 0, pendingActions: 0, avgResponseTime: 0 },
    cache: { hitRate: 0, size: 0, efficiency: 0 },
    realtime: { connected: false, subscriptions: 0, latency: 0 },
    overall: { score: 0, grade: 'C' }
  })

  const [isOptimized, setIsOptimized] = useState(false)
  const [performanceObserver, setPerformanceObserver] = useState<PerformanceObserver | null>(null)

  const navStats = useInstantNavigation()
  const uiStats = useInstantUI()
  // Remove dependency on RealtimeSyncProvider to avoid circular dependency
  const realtimeStatus = { connected: false, subscriptions: {} }

  // Update metrics periodically
  const updateMetrics = useCallback(() => {
    if (!enableMonitoring) return;
    
    try {
      const navMetrics = navStats.getStats()
      const uiMetrics = uiStats.getStats()
      const cacheStats = fastCache.getStats()

      const newMetrics: PerformanceMetrics = {
        navigation: {
          prefetched: navMetrics.prefetched,
          hitRate: navMetrics.hitRate,
          avgLatency: 0 // Will be calculated from performance observer
        },
        ui: {
          optimisticUpdates: uiMetrics.optimisticUpdates,
          pendingActions: uiMetrics.pendingActions,
          avgResponseTime: 0 // Will be calculated from performance observer
        },
        cache: {
          hitRate: cacheStats.hitRate,
          size: cacheStats.size,
          efficiency: Math.min(100, cacheStats.hitRate + (cacheStats.size > 0 ? 10 : 0))
        },
        realtime: {
          connected: realtimeStatus.connected,
          subscriptions: Object.keys(realtimeStatus.subscriptions).length,
          latency: 0 // Will be measured from WebSocket
        },
        overall: {
          score: 0,
          grade: 'C'
        }
      }

      // Calculate overall performance score
      const scores = [
        newMetrics.navigation.hitRate,
        newMetrics.cache.hitRate,
        newMetrics.realtime.connected ? 100 : 0,
        newMetrics.ui.optimisticUpdates > 0 ? 90 : 70
      ]

      newMetrics.overall.score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

      // Assign grade
      if (newMetrics.overall.score >= 95) newMetrics.overall.grade = 'A+'
      else if (newMetrics.overall.score >= 85) newMetrics.overall.grade = 'A'
      else if (newMetrics.overall.score >= 75) newMetrics.overall.grade = 'B'
      else if (newMetrics.overall.score >= 65) newMetrics.overall.grade = 'C'
      else newMetrics.overall.grade = 'D'

      setMetrics(newMetrics)
      setIsOptimized(newMetrics.overall.score >= 85)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating performance metrics:', error)
      }
    }
  }, [])

  // Setup performance monitoring
  useEffect(() => {
    if (!enableMonitoring || typeof window === 'undefined') return

    // Performance Observer for measuring latencies
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Performance] Navigation: ${navEntry.loadEventEnd - navEntry.fetchStart}ms`)
            }
          }
          
          if (entry.entryType === 'measure') {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Performance] ${entry.name}: ${entry.duration}ms`)
            }
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] })
        setPerformanceObserver(observer)
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }

    return () => {
      if (performanceObserver) {
        performanceObserver.disconnect()
      }
    }
  }, [enableMonitoring])

  // Update metrics interval
  useEffect(() => {
    updateMetrics()
    const interval = setInterval(updateMetrics, 10000) // Every 10 seconds (less frequent)
    return () => clearInterval(interval)
  }, []) // Remove updateMetrics dependency to prevent infinite loops

  // Performance optimizations
  useEffect(() => {
    if (!enableOptimizations) return

    // Optimize rendering
    const optimizeRendering = () => {
      // Enable GPU acceleration for animations
      document.body.style.transform = 'translateZ(0)'
      
      // Optimize scroll performance
      document.body.style.overflowAnchor = 'none'
      
      // Reduce layout thrashing
      document.body.style.containIntrinsicSize = 'auto'
    }

    // Optimize network
    const optimizeNetwork = () => {
      // Preconnect to critical domains
      const preconnectDomains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ]

      preconnectDomains.forEach(domain => {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = domain
        document.head.appendChild(link)
      })
    }

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll('img')
      images.forEach(img => {
        if (!img.loading) {
          img.loading = 'lazy'
        }
        if (!img.decoding) {
          img.decoding = 'async'
        }
      })
    }

    optimizeRendering()
    optimizeNetwork()
    
    // Optimize images after DOM is ready
    setTimeout(optimizeImages, 1000)

    // Cleanup
    return () => {
      document.body.style.transform = ''
      document.body.style.overflowAnchor = ''
      document.body.style.containIntrinsicSize = ''
    }
  }, [enableOptimizations])

  const optimizePerformance = useCallback(() => {
    // Clear caches
    fastCache.clear()
    
    // Prefetch critical routes
    const criticalRoutes = [
      '/dashboard',
      '/dashboard/orders',
      '/dashboard/billing',
      '/dashboard/kitchen'
    ]
    
    criticalRoutes.forEach(route => {
      try {
        navStats.prefetch(route, 'high')
      } catch (error) {
        console.warn('Failed to prefetch route:', route, error)
      }
    })
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Optimization complete')
    }
  }, []) // Remove navStats dependency

  const clearAllCaches = useCallback(() => {
    fastCache.clear()
    
    // Clear browser caches if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] All caches cleared')
    }
  }, [])

  const getDetailedStats = useCallback(() => {
    try {
      return {
        navigation: navStats.getStats(),
        ui: uiStats.getStats(),
        cache: fastCache.getStats(),
        realtime: realtimeStatus,
        performance: {
          memory: (performance as any).memory ? {
            used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
          } : null,
          timing: performance.timing ? {
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
          } : null
        }
      }
    } catch (error) {
      console.error('Error getting detailed stats:', error)
      return {}
    }
  }, []) // Remove dependencies to prevent infinite loops

  const contextValue: PerformanceContextType = {
    metrics,
    isOptimized,
    optimizePerformance,
    clearAllCaches,
    getDetailedStats
  }

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      
      {/* Performance Status Indicator */}
      {enableMonitoring && (
        <PerformanceIndicator 
          score={metrics.overall.score}
          grade={metrics.overall.grade}
          isOptimized={isOptimized}
        />
      )}
    </PerformanceContext.Provider>
  )
}

/**
 * Performance Status Indicator
 */
function PerformanceIndicator({ 
  score, 
  grade, 
  isOptimized 
}: { 
  score: number
  grade: string
  isOptimized: boolean
}) {
  const [showDetails, setShowDetails] = useState(false)
  const { getDetailedStats } = usePerformance()

  if (process.env.NODE_ENV !== 'development') return null

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-500'
      case 'A': return 'text-green-400'
      case 'B': return 'text-yellow-500'
      case 'C': return 'text-orange-500'
      case 'D': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          px-3 py-2 rounded-lg text-sm font-mono shadow-lg transition-all
          ${isOptimized ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOptimized ? 'bg-white' : 'bg-black animate-pulse'}`} />
          <span className={getGradeColor(grade)}>
            {grade} ({score})
          </span>
        </div>
      </button>
      
      {showDetails && (
        <div className="absolute bottom-12 left-0 bg-black text-green-400 p-3 rounded text-xs font-mono w-80 max-h-96 overflow-auto">
          <pre>{JSON.stringify(getDetailedStats(), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}