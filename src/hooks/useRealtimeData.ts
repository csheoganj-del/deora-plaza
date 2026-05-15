"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeSync, SyncEvent, withOptimisticUpdate } from '@/lib/realtime-sync'
import { fastCache, getCachedOrders, setCachedOrders, invalidateOrdersCache } from '@/lib/fast-cache'

/**
 * ULTRA-FAST REAL-TIME DATA HOOKS
 * Combines real-time sync + caching + optimistic updates for instant UI
 */

interface UseRealtimeDataOptions {
  businessUnit?: string
  enableCache?: boolean
  enableOptimistic?: boolean
  refreshInterval?: number
}

interface RealtimeDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
  lastUpdated: string
  isRealtime: boolean
}

/**
 * Real-time orders hook with optimistic updates
 */
export function useRealtimeOrders(options: UseRealtimeDataOptions = {}) {
  const {
    businessUnit,
    enableCache = true,
    enableOptimistic = true,
    refreshInterval = 30000
  } = options

  const [state, setState] = useState<RealtimeDataState<any>>({
    data: [],
    loading: true,
    error: null,
    lastUpdated: new Date().toISOString(),
    isRealtime: false
  })

  const subscriptionRef = useRef<string | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial data with cache
  const loadData = useCallback(async () => {
    try {
      // Try cache first
      if (enableCache) {
        const cached = getCachedOrders(businessUnit)
        if (cached) {
          setState(prev => ({
            ...prev,
            data: cached,
            loading: false,
            lastUpdated: new Date().toISOString()
          }))
          return cached
        }
      }

      // Fetch from server - Stale-while-revalidate pattern
      // Only set loading if we don't have data yet
      if (state.data.length === 0) {
        setState(prev => ({ ...prev, loading: true, error: null }))
      }

      const { queryDocuments } = await import('@/lib/supabase/database-client')
      const filters = businessUnit ? [{ field: 'businessUnit', operator: '==', value: businessUnit }] : []
      const orders = await queryDocuments('orders', filters, 'createdAt', 'desc')

      // Cache the result
      if (enableCache) {
        setCachedOrders(orders, businessUnit)
      }

      setState({
        data: orders,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
        isRealtime: true
      })

      return orders
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load orders'
      }))
      return []
    }
  }, [businessUnit, enableCache])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((event: SyncEvent) => {
    console.log('[RealtimeOrders] Received update:', event)

    setState(prev => {
      let newData = [...prev.data]

      switch (event.eventType) {
        case 'INSERT':
          // Add new order if not exists
          if (!newData.find(order => order.id === event.record.id)) {
            newData.unshift(event.record)
          }
          break

        case 'UPDATE':
          // Update existing order
          const updateIndex = newData.findIndex(order => order.id === event.record.id)
          if (updateIndex >= 0) {
            newData[updateIndex] = { ...newData[updateIndex], ...event.record }
          }
          break

        case 'DELETE':
          // Remove deleted order
          newData = newData.filter(order => order.id !== event.old_record?.id)
          break
      }

      // Update cache
      if (enableCache) {
        setCachedOrders(newData, businessUnit)
      }

      return {
        ...prev,
        data: newData,
        lastUpdated: event.timestamp,
        isRealtime: true
      }
    })
  }, [businessUnit, enableCache])

  // Optimistic order creation
  const createOrderOptimistic = useCallback(async (orderData: any) => {
    if (!enableOptimistic) {
      const { createDocument } = await import('@/lib/supabase/database-client')
      return createDocument('orders', orderData)
    }

    const tempId = `temp-${Date.now()}`
    const optimisticOrder = {
      ...orderData,
      id: tempId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    return withOptimisticUpdate(
      // Optimistic update
      () => {
        setState(prev => ({
          ...prev,
          data: [optimisticOrder, ...prev.data],
          lastUpdated: new Date().toISOString()
        }))
      },
      // Server update
      async () => {
        const { createDocument } = await import('@/lib/supabase/database-client')
        const result = await createDocument('orders', orderData)

        // Replace temp order with real one
        setState(prev => ({
          ...prev,
          data: prev.data.map(order =>
            order.id === tempId ? result.data : order
          )
        }))

        return result
      },
      // Rollback
      () => {
        setState(prev => ({
          ...prev,
          data: prev.data.filter(order => order.id !== tempId)
        }))
      }
    )
  }, [enableOptimistic])

  // Optimistic order update
  const updateOrderOptimistic = useCallback(async (orderId: string, updates: any) => {
    if (!enableOptimistic) {
      const { updateDocument } = await import('@/lib/supabase/database-client')
      return updateDocument('orders', orderId, updates)
    }

    const originalOrder = state.data.find(order => order.id === orderId)

    return withOptimisticUpdate(
      // Optimistic update
      () => {
        setState(prev => ({
          ...prev,
          data: prev.data.map(order =>
            order.id === orderId ? { ...order, ...updates } : order
          ),
          lastUpdated: new Date().toISOString()
        }))
      },
      // Server update
      async () => {
        const { updateDocument } = await import('@/lib/supabase/database-client')
        return updateDocument('orders', orderId, updates)
      },
      // Rollback
      () => {
        if (originalOrder) {
          setState(prev => ({
            ...prev,
            data: prev.data.map(order =>
              order.id === orderId ? originalOrder : order
            )
          }))
        }
      }
    )
  }, [state.data, enableOptimistic])

  // Setup real-time subscription
  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const subscription = realtimeSync.subscribe(
      'orders-realtime',
      ['orders'],
      handleRealtimeUpdate,
      businessUnit ? { filter: `businessUnit=eq.${businessUnit}` } : undefined
    )

    subscriptionRef.current = subscription.id

    // Setup periodic refresh as fallback
    // Disabled to prevent unwanted background refreshes/flicker
    // Realtime sync should handle updates. 
    /*
    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(loadData, refreshInterval)
    }
    */

    return () => {
      if (subscriptionRef.current) {
        realtimeSync.unsubscribe(subscriptionRef.current)
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current)
      }
    }
  }, [businessUnit, loadData, handleRealtimeUpdate, refreshInterval])

  return {
    ...state,
    refresh: loadData,
    createOrder: createOrderOptimistic,
    updateOrder: updateOrderOptimistic,
    invalidateCache: () => invalidateOrdersCache(businessUnit)
  }
}

/**
 * Real-time kitchen orders hook
 */
export function useRealtimeKitchenOrders(businessUnit?: string) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleKitchenUpdate = useCallback((event: SyncEvent) => {
    if (event.table === 'orders') {
      const order = event.record

      // Only show orders that need kitchen attention
      if (['pending', 'preparing', 'ready'].includes(order.status)) {
        setOrders(prev => {
          const filtered = prev.filter(o => o.id !== order.id)
          return event.eventType === 'DELETE' ? filtered : [order, ...filtered]
        })
      } else {
        // Remove completed orders
        setOrders(prev => prev.filter(o => o.id !== order.id))
      }
    }
  }, [])

  useEffect(() => {
    const loadKitchenOrders = async () => {
      try {
        const { queryDocuments } = await import('@/lib/supabase/database-client')
        const filters = [
          { field: 'status', operator: 'in', value: ['pending', 'preparing', 'ready'] }
        ]

        if (businessUnit) {
          filters.push({ field: 'businessUnit', operator: '==', value: businessUnit })
        }

        const kitchenOrders = await queryDocuments('orders', filters, 'createdAt', 'asc')
        setOrders(kitchenOrders)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load kitchen orders:', error)
        setLoading(false)
      }
    }

    loadKitchenOrders()

    // Subscribe to kitchen-specific updates
    const subscription = realtimeSync.subscribe(
      'kitchen-orders',
      ['orders'],
      handleKitchenUpdate,
      { filter: 'status=in.(pending,preparing,ready)' }
    )

    return () => {
      realtimeSync.unsubscribe(subscription.id)
    }
  }, [businessUnit, handleKitchenUpdate])

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    // Optimistic update
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    )

    try {
      const { updateDocument } = await import('@/lib/supabase/database-client')
      await updateDocument('orders', orderId, { status })
    } catch (error) {
      // Revert on error
      console.error('Failed to update order status:', error)
      // The real-time subscription will correct the state
    }
  }, [])

  return {
    orders,
    loading,
    updateOrderStatus
  }
}

/**
 * Real-time inventory hook
 */
export function useRealtimeInventory(businessUnit?: string) {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  const handleInventoryUpdate = useCallback((event: SyncEvent) => {
    setInventory(prev => {
      let newInventory = [...prev]

      switch (event.eventType) {
        case 'INSERT':
          newInventory.push(event.record)
          break
        case 'UPDATE':
          const index = newInventory.findIndex(item => item.id === event.record.id)
          if (index >= 0) {
            newInventory[index] = event.record
          }
          break
        case 'DELETE':
          newInventory = newInventory.filter(item => item.id !== event.old_record?.id)
          break
      }

      // Update low stock items
      const lowStock = newInventory.filter(item =>
        item.currentStock <= (item.minStock || 0)
      )
      setLowStockItems(lowStock)

      return newInventory
    })
  }, [])

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const { queryDocuments } = await import('@/lib/supabase/database-client')
        const filters = businessUnit ? [{ field: 'businessUnit', operator: '==', value: businessUnit }] : []

        const items = await queryDocuments('inventory_items', filters, 'name', 'asc')
        setInventory(items)

        const lowStock = items.filter(item => item.currentStock <= (item.minStock || 0))
        setLowStockItems(lowStock)

        setLoading(false)
      } catch (error) {
        console.error('Failed to load inventory:', error)
        setLoading(false)
      }
    }

    loadInventory()

    const subscription = realtimeSync.subscribe(
      'inventory-realtime',
      ['inventory_items'],
      handleInventoryUpdate,
      businessUnit ? { filter: `businessUnit=eq.${businessUnit}` } : undefined
    )

    return () => {
      realtimeSync.unsubscribe(subscription.id)
    }
  }, [businessUnit, handleInventoryUpdate])

  return {
    inventory,
    lowStockItems,
    loading
  }
}

/**
 * Real-time tables hook
 */
export function useRealtimeTables(businessUnit?: string) {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleTableUpdate = useCallback((event: SyncEvent) => {
    setTables(prev => {
      switch (event.eventType) {
        case 'INSERT':
          return [...prev, event.record]
        case 'UPDATE':
          return prev.map(table =>
            table.id === event.record.id ? { ...table, ...event.record } : table
          )
        case 'DELETE':
          return prev.filter(table => table.id !== event.old_record?.id)
        default:
          return prev
      }
    })
  }, [])

  useEffect(() => {
    const loadTables = async () => {
      try {
        const { queryDocuments } = await import('@/lib/supabase/database-client')
        const filters = businessUnit ? [{ field: 'businessUnit', operator: '==', value: businessUnit }] : []

        const tableData = await queryDocuments('tables', filters, 'tableNumber', 'asc')
        setTables(tableData)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load tables:', error)
        setLoading(false)
      }
    }

    loadTables()

    const subscription = realtimeSync.subscribe(
      'tables-realtime',
      ['tables'],
      handleTableUpdate,
      businessUnit ? { filter: `businessUnit=eq.${businessUnit}` } : undefined
    )

    return () => {
      realtimeSync.unsubscribe(subscription.id)
    }
  }, [businessUnit, handleTableUpdate])

  const updateTableStatus = useCallback(async (tableId: string, status: string, orderId?: string) => {
    // Optimistic update
    setTables(prev =>
      prev.map(table =>
        table.id === tableId ? {
          ...table,
          status,
          currentOrderId: orderId !== undefined ? orderId : (status === 'available' ? null : table.currentOrderId),
          customerCount: status === 'available' ? 0 : table.customerCount
        } : table
      )
    )

    try {
      const { updateDocument } = await import('@/lib/supabase/database-client')
      const updates: any = { status }
      if (orderId !== undefined) updates.currentOrderId = orderId
      if (status === 'available') {
        updates.currentOrderId = null
        updates.customerCount = 0
      }
      await updateDocument('tables', tableId, updates)
    } catch (error) {
      console.error('Failed to update table status:', error)
    }
  }, [])

  return {
    tables,
    loading,
    updateTableStatus,
    occupiedTables: tables.filter(t => t.status === 'occupied'),
    availableTables: tables.filter(t => t.status === 'available')
  }
}