"use client"

/**
 * DEORA PLAZA FAST CACHE SYSTEM
 * Ultra-fast in-memory caching with intelligent invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: number
  tags: string[]
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
}

class FastCacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0
  }
  private maxSize = 1000
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.size--
      return null
    }

    this.stats.hits++
    return entry.data
  }

  /**
   * Set data in cache
   */
  set<T>(
    key: string, 
    data: T, 
    ttl: number = this.defaultTTL,
    tags: string[] = []
  ): void {
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: 1,
      tags
    }

    const existing = this.cache.get(key)
    if (existing) {
      entry.version = existing.version + 1
    } else {
      this.stats.size++
    }

    this.cache.set(key, entry)
    this.stats.sets++
  }

  /**
   * Delete from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.deletes++
      this.stats.size--
    }
    return deleted
  }

  /**
   * Invalidate by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
        invalidated++
        this.stats.size--
      }
    }

    return invalidated
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.size--
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      let cleaned = 0

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.timestamp + entry.ttl) {
          this.cache.delete(key)
          cleaned++
          this.stats.size--
        }
      }

      if (cleaned > 0) {
        console.log(`[FastCache] Cleaned ${cleaned} expired entries`)
      }
    }, 60000) // Cleanup every minute
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Global cache instance
export const fastCache = new FastCacheManager()

/**
 * RESTAURANT-SPECIFIC CACHE HELPERS
 */

// Cache keys
export const CACHE_KEYS = {
  ORDERS: 'orders',
  ORDER_ITEMS: 'order-items',
  MENU_ITEMS: 'menu-items',
  TABLES: 'tables',
  CUSTOMERS: 'customers',
  INVENTORY: 'inventory',
  BILLS: 'bills',
  STAFF: 'staff',
  HOTEL_ROOMS: 'hotel-rooms',
  BUSINESS_SETTINGS: 'business-settings',
  USER_PERMISSIONS: 'user-permissions'
} as const

// Cache tags for intelligent invalidation
export const CACHE_TAGS = {
  ORDERS: ['orders', 'kitchen', 'billing'],
  MENU: ['menu', 'orders'],
  INVENTORY: ['inventory', 'menu'],
  STAFF: ['staff', 'attendance'],
  HOTEL: ['hotel', 'bookings'],
  SETTINGS: ['settings', 'permissions']
} as const

/**
 * Cached data fetchers with automatic invalidation
 */
export function getCachedOrders(businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.ORDERS}-${businessUnit}` : CACHE_KEYS.ORDERS
  return fastCache.get(key)
}

export function setCachedOrders(orders: any[], businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.ORDERS}-${businessUnit}` : CACHE_KEYS.ORDERS
  fastCache.set(key, orders, 2 * 60 * 1000, CACHE_TAGS.ORDERS) // 2 minutes TTL
}

export function getCachedMenuItems(businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.MENU_ITEMS}-${businessUnit}` : CACHE_KEYS.MENU_ITEMS
  return fastCache.get(key)
}

export function setCachedMenuItems(items: any[], businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.MENU_ITEMS}-${businessUnit}` : CACHE_KEYS.MENU_ITEMS
  fastCache.set(key, items, 10 * 60 * 1000, CACHE_TAGS.MENU) // 10 minutes TTL
}

export function getCachedTables(businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.TABLES}-${businessUnit}` : CACHE_KEYS.TABLES
  return fastCache.get(key)
}

export function setCachedTables(tables: any[], businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.TABLES}-${businessUnit}` : CACHE_KEYS.TABLES
  fastCache.set(key, tables, 5 * 60 * 1000, ['tables']) // 5 minutes TTL
}

export function getCachedInventory(businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.INVENTORY}-${businessUnit}` : CACHE_KEYS.INVENTORY
  return fastCache.get(key)
}

export function setCachedInventory(inventory: any[], businessUnit?: string) {
  const key = businessUnit ? `${CACHE_KEYS.INVENTORY}-${businessUnit}` : CACHE_KEYS.INVENTORY
  fastCache.set(key, inventory, 3 * 60 * 1000, CACHE_TAGS.INVENTORY) // 3 minutes TTL
}

export function getCachedBusinessSettings() {
  return fastCache.get(CACHE_KEYS.BUSINESS_SETTINGS)
}

export function setCachedBusinessSettings(settings: any) {
  fastCache.set(CACHE_KEYS.BUSINESS_SETTINGS, settings, 15 * 60 * 1000, CACHE_TAGS.SETTINGS) // 15 minutes TTL
}

export function getCachedUserPermissions(userId: string) {
  return fastCache.get(`${CACHE_KEYS.USER_PERMISSIONS}-${userId}`)
}

export function setCachedUserPermissions(userId: string, permissions: any) {
  fastCache.set(`${CACHE_KEYS.USER_PERMISSIONS}-${userId}`, permissions, 10 * 60 * 1000, CACHE_TAGS.SETTINGS)
}

/**
 * Smart cache invalidation based on data changes
 */
export function invalidateOrdersCache(businessUnit?: string) {
  if (businessUnit) {
    fastCache.delete(`${CACHE_KEYS.ORDERS}-${businessUnit}`)
  } else {
    fastCache.invalidateByTags(CACHE_TAGS.ORDERS)
  }
}

export function invalidateMenuCache(businessUnit?: string) {
  if (businessUnit) {
    fastCache.delete(`${CACHE_KEYS.MENU_ITEMS}-${businessUnit}`)
  } else {
    fastCache.invalidateByTags(CACHE_TAGS.MENU)
  }
}

export function invalidateInventoryCache(businessUnit?: string) {
  if (businessUnit) {
    fastCache.delete(`${CACHE_KEYS.INVENTORY}-${businessUnit}`)
  } else {
    fastCache.invalidateByTags(CACHE_TAGS.INVENTORY)
  }
}

export function invalidateSettingsCache() {
  fastCache.invalidateByTags(CACHE_TAGS.SETTINGS)
}

/**
 * Performance monitoring
 */
export function getCachePerformance() {
  return {
    stats: fastCache.getStats(),
    timestamp: new Date().toISOString()
  }
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    fastCache.destroy()
  })
}