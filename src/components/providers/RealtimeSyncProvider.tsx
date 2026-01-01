"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { realtimeSync, getSyncStatus, SyncEvent } from '@/lib/realtime-sync'
import { fastCache, getCachePerformance } from '@/lib/fast-cache'
import { toast } from 'sonner'

/**
 * REAL-TIME SYNC PROVIDER
 * Global real-time synchronization management and monitoring
 */

interface SyncStatus {
  connected: boolean
  subscriptions: Record<string, string>
  queueLength: number
  isProcessing: boolean
  lastUpdate: string
  performance: {
    hitRate: number
    cacheSize: number
  }
}

interface RealtimeSyncContextType {
  status: SyncStatus
  isOnline: boolean
  reconnect: () => void
  clearCache: () => void
  getPerformanceStats: () => any
}

const RealtimeSyncContext = createContext<RealtimeSyncContextType | null>(null)

export function useRealtimeSync() {
  const context = useContext(RealtimeSyncContext)
  if (!context) {
    throw new Error('useRealtimeSync must be used within RealtimeSyncProvider')
  }
  return context
}

interface RealtimeSyncProviderProps {
  children: React.ReactNode
  enableNotifications?: boolean
  enablePerformanceMonitoring?: boolean
}

export function RealtimeSyncProvider({ 
  children, 
  enableNotifications = true,
  enablePerformanceMonitoring = true 
}: RealtimeSyncProviderProps) {
  const [status, setStatus] = useState<SyncStatus>({
    connected: false,
    subscriptions: {},
    queueLength: 0,
    isProcessing: false,
    lastUpdate: new Date().toISOString(),
    performance: {
      hitRate: 0,
      cacheSize: 0
    }
  })

  const [isOnline, setIsOnline] = useState(true)
  const [connectionLost, setConnectionLost] = useState(false)

  // Update sync status
  const updateStatus = useCallback(() => {
    const syncStatus = getSyncStatus()
    const cachePerf = getCachePerformance()

    setStatus({
      connected: Object.values(syncStatus.subscriptions).some(s => s === 'SUBSCRIBED'),
      subscriptions: syncStatus.subscriptions,
      queueLength: syncStatus.queueLength,
      isProcessing: syncStatus.isProcessing,
      lastUpdate: syncStatus.timestamp,
      performance: {
        hitRate: cachePerf.stats.hitRate,
        cacheSize: cachePerf.stats.size
      }
    })
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (connectionLost && enableNotifications) {
        toast.success('Connection restored - Real-time sync active')
        setConnectionLost(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionLost(true)
      if (enableNotifications) {
        toast.warning('Connection lost - Working offline')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connectionLost, enableNotifications])

  // Monitor sync status
  useEffect(() => {
    updateStatus()

    const interval = setInterval(updateStatus, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [updateStatus])

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring || process.env.NODE_ENV !== 'development') return

    const monitorPerformance = () => {
      const perf = getCachePerformance()
      
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[RealtimeSync] Performance:', {
          hitRate: perf.stats.hitRate,
          cacheSize: perf.stats.size,
          subscriptions: Object.keys(status.subscriptions).length
        })
      }

      // Alert on poor performance in development only
      if (perf.stats.hitRate < 50 && perf.stats.hits + perf.stats.misses > 100) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[RealtimeSync] Low cache hit rate:', perf.stats.hitRate + '%')
        }
      }
    }

    const perfInterval = setInterval(monitorPerformance, 30000) // Every 30 seconds

    return () => clearInterval(perfInterval)
  }, [enablePerformanceMonitoring, status.subscriptions])

  // Connection monitoring and auto-reconnect
  useEffect(() => {
    const checkConnection = () => {
      const hasActiveSubscriptions = Object.values(status.subscriptions).some(s => s === 'SUBSCRIBED')
      
      if (!hasActiveSubscriptions && isOnline) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('[RealtimeSync] No active subscriptions detected')
        }
        
        if (enableNotifications) {
          toast.warning('Real-time sync disconnected - Attempting reconnect...')
        }
      }
    }

    const connectionInterval = setInterval(checkConnection, 10000) // Check every 10 seconds

    return () => clearInterval(connectionInterval)
  }, [status.subscriptions, isOnline, enableNotifications])

  const reconnect = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[RealtimeSync] Manual reconnect triggered')
    }
    
    // Clear existing subscriptions
    realtimeSync.cleanup()
    
    // Force page refresh to reinitialize subscriptions
    window.location.reload()
  }, [])

  const clearCache = useCallback(() => {
    fastCache.clear()
    if (enableNotifications) {
      toast.success('Cache cleared successfully')
    }
    updateStatus()
  }, [enableNotifications, updateStatus])

  const getPerformanceStats = useCallback(() => {
    return {
      sync: getSyncStatus(),
      cache: getCachePerformance(),
      network: {
        online: isOnline,
        connectionType: (navigator as any)?.connection?.effectiveType || 'unknown'
      }
    }
  }, [isOnline])

  const contextValue: RealtimeSyncContextType = {
    status,
    isOnline,
    reconnect,
    clearCache,
    getPerformanceStats
  }

  return (
    <RealtimeSyncContext.Provider value={contextValue}>
      {children}
      
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator 
        connected={status.connected} 
        isOnline={isOnline}
        subscriptionCount={Object.keys(status.subscriptions).length}
      />
    </RealtimeSyncContext.Provider>
  )
}

/**
 * Connection Status Indicator Component
 */
function ConnectionStatusIndicator({ 
  connected, 
  isOnline, 
  subscriptionCount 
}: { 
  connected: boolean
  isOnline: boolean
  subscriptionCount: number
}) {
  // Don't show indicator in production - only for critical connection issues
  if (process.env.NODE_ENV === 'production') return null
  
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Only show indicator for critical connection failures
    setShowIndicator(!isOnline && !connected)
  }, [connected, isOnline])

  if (!showIndicator) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="px-3 py-2 rounded-lg text-sm font-medium shadow-lg bg-red-500 text-white animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Connection Lost</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Performance Monitor Component (for development)
 */
export function RealtimePerformanceMonitor() {
  const { status, getPerformanceStats } = useRealtimeSync()
  const [expanded, setExpanded] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (expanded) {
      const interval = setInterval(() => {
        setStats(getPerformanceStats())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [expanded, getPerformanceStats])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-mono"
      >
        Sync: {status.connected ? 'ON' : 'OFF'}
      </button>
      
      {expanded && stats && (
        <div className="absolute top-8 right-0 bg-black text-green-400 p-3 rounded text-xs font-mono w-80 max-h-96 overflow-auto">
          <div className="space-y-2">
            <div>Cache Hit Rate: {stats.cache.stats.hitRate}%</div>
            <div>Cache Size: {stats.cache.stats.size}</div>
            <div>Queue Length: {stats.sync.queueLength}</div>
            <div>Processing: {stats.sync.isProcessing ? 'YES' : 'NO'}</div>
            <div>Network: {stats.network.online ? 'ONLINE' : 'OFFLINE'}</div>
            <div>Connection: {stats.network.connectionType}</div>
            
            <div className="border-t border-green-400 pt-2">
              <div>Subscriptions:</div>
              {Object.entries(stats.sync.subscriptions).map(([id, status]) => (
                <div key={id} className="ml-2">
                  {id}: {status as string}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}