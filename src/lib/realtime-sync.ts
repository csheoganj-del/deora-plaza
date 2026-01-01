"use client"

import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * DEORA PLAZA REAL-TIME SYNC SYSTEM
 * Ultra-fast, real-time synchronization across all devices and users
 */

export interface SyncEvent {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  record: any
  old_record?: any
  timestamp: string
  userId?: string
  businessUnit?: string
}

export interface SyncSubscription {
  id: string
  channel: RealtimeChannel
  tables: string[]
  callback: (event: SyncEvent) => void
  filters?: Record<string, any>
}

class RealtimeSyncManager {
  private subscriptions = new Map<string, SyncSubscription>()
  private eventQueue: SyncEvent[] = []
  private isProcessing = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Subscribe to real-time changes for specific tables
   */
  subscribe(
    id: string,
    tables: string[],
    callback: (event: SyncEvent) => void,
    filters?: Record<string, any>
  ): SyncSubscription {
    // Remove existing subscription if it exists
    this.unsubscribe(id)

    const supabase = createClient()
    const channel = supabase.channel(`sync-${id}`)

    // Subscribe to each table
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...filters
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const syncEvent: SyncEvent = {
            table: payload.table,
            eventType: payload.eventType,
            record: payload.new,
            old_record: payload.old,
            timestamp: new Date().toISOString(),
            userId: payload.new?.userId || payload.old?.userId,
            businessUnit: payload.new?.businessUnit || payload.old?.businessUnit
          }

          this.queueEvent(syncEvent, callback)
        }
      )
    })

    // Subscribe to channel
    channel.subscribe((status) => {
      console.log(`[RealTimeSync] Channel ${id} status:`, status)
      
      if (status === 'SUBSCRIBED') {
        this.reconnectAttempts = 0
      } else if (status === 'CHANNEL_ERROR') {
        this.handleReconnect(id, tables, callback, filters)
      }
    })

    const subscription: SyncSubscription = {
      id,
      channel,
      tables,
      callback,
      filters
    }

    this.subscriptions.set(id, subscription)
    return subscription
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id)
    if (subscription) {
      subscription.channel.unsubscribe()
      this.subscriptions.delete(id)
      console.log(`[RealTimeSync] Unsubscribed from ${id}`)
    }
  }

  /**
   * Queue events for batch processing
   */
  private queueEvent(event: SyncEvent, callback: (event: SyncEvent) => void): void {
    this.eventQueue.push(event)
    
    if (!this.isProcessing) {
      this.processQueue(callback)
    }
  }

  /**
   * Process queued events in batches for performance
   */
  private async processQueue(callback: (event: SyncEvent) => void): Promise<void> {
    this.isProcessing = true

    while (this.eventQueue.length > 0) {
      const events = this.eventQueue.splice(0, 10) // Process in batches of 10
      
      try {
        // Process events in parallel for speed
        await Promise.all(
          events.map(event => 
            Promise.resolve(callback(event)).catch(error => 
              console.error('[RealTimeSync] Event processing error:', error)
            )
          )
        )
      } catch (error) {
        console.error('[RealTimeSync] Batch processing error:', error)
      }

      // Small delay to prevent blocking UI
      await new Promise(resolve => setTimeout(resolve, 1))
    }

    this.isProcessing = false
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(
    id: string,
    tables: string[],
    callback: (event: SyncEvent) => void,
    filters?: Record<string, any>
  ): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[RealTimeSync] Max reconnection attempts reached for ${id}`)
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[RealTimeSync] Reconnecting ${id} in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.subscribe(id, tables, callback, filters)
    }, delay)
  }

  /**
   * Get connection status
   */
  getStatus(): Record<string, string> {
    const status: Record<string, string> = {}
    
    this.subscriptions.forEach((subscription, id) => {
      status[id] = subscription.channel.state
    })

    return status
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.channel.unsubscribe()
    })
    this.subscriptions.clear()
    this.eventQueue = []
    console.log('[RealTimeSync] Cleanup completed')
  }
}

// Global singleton instance
export const realtimeSync = new RealtimeSyncManager()

/**
 * RESTAURANT-SPECIFIC SYNC SUBSCRIPTIONS
 */

// Orders real-time sync
export function subscribeToOrders(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'orders-sync',
    ['orders', 'order_items'],
    callback
  )
}

// Kitchen real-time sync
export function subscribeToKitchen(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'kitchen-sync',
    ['orders', 'order_items'],
    callback,
    { filter: 'status=in.(pending,preparing,ready)' }
  )
}

// Billing real-time sync
export function subscribeToBilling(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'billing-sync',
    ['bills', 'payments'],
    callback
  )
}

// Inventory real-time sync
export function subscribeToInventory(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'inventory-sync',
    ['inventory_items', 'stock_movements'],
    callback
  )
}

// Tables real-time sync
export function subscribeToTables(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'tables-sync',
    ['tables', 'table_sessions'],
    callback
  )
}

// Staff real-time sync
export function subscribeToStaff(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'staff-sync',
    ['users', 'attendance_records'],
    callback
  )
}

// Hotel real-time sync
export function subscribeToHotel(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'hotel-sync',
    ['hotel_bookings', 'hotel_rooms'],
    callback
  )
}

// Business settings real-time sync
export function subscribeToBusinessSettings(callback: (event: SyncEvent) => void) {
  return realtimeSync.subscribe(
    'settings-sync',
    ['businessSettings', 'user_roles', 'user_permissions'],
    callback
  )
}

/**
 * OPTIMISTIC UPDATE HELPERS
 */
export function withOptimisticUpdate<T>(
  optimisticUpdate: () => void,
  serverUpdate: () => Promise<T>,
  rollback: () => void
): Promise<T> {
  // Apply optimistic update immediately
  optimisticUpdate()

  return serverUpdate().catch(error => {
    // Rollback on error
    rollback()
    throw error
  })
}

/**
 * SYNC STATUS MONITORING
 */
export function getSyncStatus() {
  return {
    subscriptions: realtimeSync.getStatus(),
    queueLength: (realtimeSync as any).eventQueue.length,
    isProcessing: (realtimeSync as any).isProcessing,
    timestamp: new Date().toISOString()
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeSync.cleanup()
  })
}