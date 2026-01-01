// Enhanced Cache System - Now using Redis with fallback to memory
// This file provides backward compatibility while using the new Redis cache

import { getCache, RedisCacheManager, createCache } from './redis-cache';

// Backward compatibility functions
export function getCachedData<T>(key: string): T | null {
  // Return a promise for async operation
  return getCache().get<T>(key) as T | null;
}

export async function getCachedDataAsync<T>(key: string): Promise<T | null> {
  return getCache().get<T>(key);
}

export function setCachedData<T>(key: string, data: T, ttlMs: number = 30000): void {
  // Convert ms to seconds for Redis
  const ttl = Math.floor(ttlMs / 1000);
  getCache().set(key, data, ttl);
}

export async function setCachedDataAsync<T>(key: string, data: T, ttlMs: number = 30000): Promise<void> {
  const ttl = Math.floor(ttlMs / 1000);
  await getCache().set(key, data, ttl);
}

export function clearCache(pattern?: string): void {
  getCache().clear(pattern);
}

export async function clearCacheAsync(pattern?: string): Promise<void> {
  await getCache().clear(pattern);
}

// Advanced cache utilities
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const ttl = ttlMs ? Math.floor(ttlMs / 1000) : undefined;
  return getCache().getOrSet(key, fetcher, ttl);
}

export async function invalidateCache(key: string): Promise<void> {
  await getCache().delete(key);
}

export async function cacheHealthCheck(): Promise<{ healthy: boolean; redis: boolean; fallback: boolean }> {
  return getCache().healthCheck();
}

export async function getCacheStats(): Promise<any> {
  return getCache().getCacheInfo();
}

// Batch operations
export async function getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
  return getCache().getMultiple<T>(keys);
}

export async function setMultiple<T>(entries: Map<string, T>, ttlMs?: number): Promise<boolean> {
  const ttl = ttlMs ? Math.floor(ttlMs / 1000) : undefined;
  return getCache().setMultiple(entries, ttl);
}

// Export the cache manager for advanced usage
export { RedisCacheManager, getCache, createCache };

