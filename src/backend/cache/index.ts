// Redis Cache with In-Memory Fallback System for Redundant Backend Architecture

import { CacheConfig, CacheItem, CacheError } from '../core/types';
import { GlobalLogger } from '../logger';

export interface CacheInterface {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<boolean>;
  invalidate(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  keys(pattern?: string): Promise<string[]>;
  size(): Promise<number>;
  stats(): Promise<CacheStats>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
  uptime: number;
  isRedisConnected: boolean;
}

class RedisCache implements CacheInterface {
  private redis: any = null;
  private isConnected = false;
  private logger: GlobalLogger;
  private config: CacheConfig['redis'];

  constructor(config: CacheConfig['redis'], logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Import Redis dynamically to avoid issues if not installed
      const Redis = await import('redis').then(m => m.default);

      this.redis = Redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        disableOfflineQueue: false
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.config.isHealthy = true;
        this.logger.logCacheEvent('redis_connected', 'connection', true);
      });

      this.redis.on('error', (error: Error) => {
        this.isConnected = false;
        this.config.isHealthy = false;
        this.logger.logCacheEvent('redis_error', 'connection', false, { error: error.message });
      });

      this.redis.on('end', () => {
        this.isConnected = false;
        this.config.isHealthy = false;
        this.logger.logCacheEvent('redis_disconnected', 'connection', false);
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis cache', error as Error);
      this.isConnected = false;
      this.config.isHealthy = false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.logger.logCacheEvent('cache_miss', key, true);
        return null;
      }

      this.logger.logCacheEvent('cache_hit', key, true);
      return JSON.parse(value);
    } catch (error) {
      this.logger.logCacheEvent('cache_get_error', key, false, { error: (error as Error).message });
      throw new CacheError(`Failed to get key ${key}: ${(error as Error).message}`);
    }
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      const serializedValue = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await this.redis.setEx(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      this.logger.logCacheEvent('cache_set', key, true, { ttl });
      return true;
    } catch (error) {
      this.logger.logCacheEvent('cache_set_error', key, false, { error: (error as Error).message });
      throw new CacheError(`Failed to set key ${key}: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      const result = await this.redis.del(key);
      this.logger.logCacheEvent('cache_delete', key, result > 0);
      return result > 0;
    } catch (error) {
      this.logger.logCacheEvent('cache_delete_error', key, false, { error: (error as Error).message });
      throw new CacheError(`Failed to delete key ${key}: ${(error as Error).message}`);
    }
  }

  async clear(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      await this.redis.flushDb();
      this.logger.logCacheEvent('cache_clear', 'all', true);
      return true;
    } catch (error) {
      this.logger.logCacheEvent('cache_clear_error', 'all', false, { error: (error as Error).message });
      throw new CacheError(`Failed to clear cache: ${(error as Error).message}`);
    }
  }

  async invalidate(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        this.logger.logCacheEvent('cache_invalidate', pattern, true, { count: 0 });
        return 0;
      }

      const result = await this.redis.del(keys);
      this.logger.logCacheEvent('cache_invalidate', pattern, true, { count: result });
      return result;
    } catch (error) {
      this.logger.logCacheEvent('cache_invalidate_error', pattern, false, { error: (error as Error).message });
      throw new CacheError(`Failed to invalidate pattern ${pattern}: ${(error as Error).message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      throw new CacheError(`Failed to check existence of key ${key}: ${(error as Error).message}`);
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      throw new CacheError(`Failed to get TTL for key ${key}: ${(error as Error).message}`);
    }
  }

  async keys(pattern = '*'): Promise<string[]> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      throw new CacheError(`Failed to get keys with pattern ${pattern}: ${(error as Error).message}`);
    }
  }

  async size(): Promise<number> {
    if (!this.isConnected || !this.redis) {
      throw new CacheError('Redis not connected');
    }

    try {
      return await this.redis.dbSize();
    } catch (error) {
      throw new CacheError(`Failed to get cache size: ${(error as Error).message}`);
    }
  }

  async stats(): Promise<CacheStats> {
    return {
      hits: 0, // Would need to implement tracking
      misses: 0,
      sets: 0,
      deletes: 0,
      size: await this.size(),
      hitRate: 0,
      uptime: 0,
      isRedisConnected: this.isConnected
    };
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.redis && this.isConnected) {
      await this.redis.disconnect();
    }
  }
}

class MemoryCache implements CacheInterface {
  private cache = new Map<string, CacheItem>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  private maxSize: number;
  private defaultTtl: number;
  private logger: GlobalLogger;
  private cleanupTimer: NodeJS.Timeout;

  constructor(config: CacheConfig['fallback'], logger: GlobalLogger) {
    this.maxSize = config.maxSize;
    this.defaultTtl = config.ttl;
    this.logger = logger;

    // Clean up expired items every minute
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 60000);

    this.logger.logCacheEvent('memory_cache_initialized', 'initialization', true, {
      maxSize: this.maxSize,
      defaultTtl: this.defaultTtl
    });
  }

  private performCleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt.getTime() <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.logCacheEvent('memory_cache_cleanup', 'cleanup', true, { cleaned });
    }
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find least recently used item (lowest hits)
    let lruKey = '';
    let lruHits = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.hits < lruHits) {
        lruHits = item.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.logger.logCacheEvent('memory_cache_evict', lruKey, true, { reason: 'LRU' });
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);

    if (!item) {
      this.cacheStats.misses++;
      this.logger.logCacheEvent('cache_miss', key, true);
      return null;
    }

    // Check if expired
    if (item.expiresAt.getTime() <= Date.now()) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.logger.logCacheEvent('cache_miss', key, true, { reason: 'expired' });
      return null;
    }

    // Update hit count
    item.hits++;
    this.cacheStats.hits++;
    this.logger.logCacheEvent('cache_hit', key, true);

    return item.value as T;
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      // Check if we need to evict items
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictLRU();
      }

      const effectiveTtl = ttl || this.defaultTtl;
      const expiresAt = new Date(Date.now() + effectiveTtl * 1000);

      const item: CacheItem<T> = {
        key,
        value,
        ttl: effectiveTtl,
        createdAt: new Date(),
        expiresAt,
        hits: 0
      };

      this.cache.set(key, item);
      this.cacheStats.sets++;
      this.logger.logCacheEvent('cache_set', key, true, { ttl: effectiveTtl });

      return true;
    } catch (error) {
      this.logger.logCacheEvent('cache_set_error', key, false, { error: (error as Error).message });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.delete(key);
    if (existed) {
      this.cacheStats.deletes++;
    }
    this.logger.logCacheEvent('cache_delete', key, existed);
    return existed;
  }

  async clear(): Promise<boolean> {
    this.cache.clear();
    this.logger.logCacheEvent('cache_clear', 'all', true);
    return true;
  }

  async invalidate(pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.logger.logCacheEvent('cache_invalidate', pattern, true, { count });
    return count;
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    // Check if expired
    if (item.expiresAt.getTime() <= Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key);
    if (!item) return -2; // Key doesn't exist

    const remaining = Math.ceil((item.expiresAt.getTime() - Date.now()) / 1000);
    return remaining > 0 ? remaining : -1; // -1 means expired
  }

  async keys(pattern = '*'): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keys: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        // Check if not expired
        const item = this.cache.get(key);
        if (item && item.expiresAt.getTime() > Date.now()) {
          keys.push(key);
        }
      }
    }

    return keys;
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async stats(): Promise<CacheStats> {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      sets: this.cacheStats.sets,
      deletes: this.cacheStats.deletes,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.cacheStats.hits / totalRequests : 0,
      uptime: process.uptime(),
      isRedisConnected: false
    };
  }

  cleanup(): void {
    clearInterval(this.cleanupTimer);
    this.cache.clear();
  }
}

export class CacheManager implements CacheInterface {
  private redisCache: RedisCache | null = null;
  private memoryCache: MemoryCache;
  private logger: GlobalLogger;
  private config: CacheConfig;
  private useRedis = true;

  constructor(config: CacheConfig, logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;
    this.memoryCache = new MemoryCache(config.fallback, logger);

    this.initializeRedis();

    // Monitor Redis health
    setInterval(() => {
      this.checkRedisHealth();
    }, 10000); // Check every 10 seconds
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisCache = new RedisCache(this.config.redis, this.logger);
    } catch (error) {
      this.logger.error('Failed to initialize Redis, using memory cache only', error as Error);
      this.useRedis = false;
    }
  }

  private checkRedisHealth(): void {
    if (this.redisCache) {
      const wasUsingRedis = this.useRedis;
      this.useRedis = this.redisCache.isHealthy();

      if (wasUsingRedis && !this.useRedis) {
        this.logger.logFailoverEvent('Redis', 'Memory Cache', 'Redis health check failed', true);
      } else if (!wasUsingRedis && this.useRedis) {
        this.logger.logFailoverEvent('Memory Cache', 'Redis', 'Redis recovered', true);
      }
    }
  }

  private getActiveCache(): CacheInterface {
    if (this.useRedis && this.redisCache) {
      return this.redisCache;
    }
    return this.memoryCache;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const activeCache = this.getActiveCache();

    try {
      return await activeCache.get<T>(key);
    } catch (error) {
      if (this.useRedis && this.redisCache) {
        // Fallback to memory cache
        this.logger.warn(`Redis get failed for key ${key}, falling back to memory cache`);
        return await this.memoryCache.get<T>(key);
      }
      throw error;
    }
  }

  async set<T = any>(key: string, value: T, ttl?: number): Promise<boolean> {
    const activeCache = this.getActiveCache();

    try {
      const result = await activeCache.set(key, value, ttl);

      // If using Redis, also store in memory cache as backup
      if (this.useRedis && this.redisCache) {
        try {
          await this.memoryCache.set(key, value, ttl);
        } catch (error) {
          this.logger.warn(`Failed to backup cache entry in memory: ${key}`);
        }
      }

      return result;
    } catch (error) {
      if (this.useRedis && this.redisCache) {
        // Fallback to memory cache
        this.logger.warn(`Redis set failed for key ${key}, falling back to memory cache`);
        return await this.memoryCache.set(key, value, ttl);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    let redisResult = true;
    let memoryResult = true;

    if (this.useRedis && this.redisCache) {
      try {
        redisResult = await this.redisCache.delete(key);
      } catch (error) {
        this.logger.warn(`Redis delete failed for key ${key}`);
        redisResult = false;
      }
    }

    try {
      memoryResult = await this.memoryCache.delete(key);
    } catch (error) {
      this.logger.warn(`Memory cache delete failed for key ${key}`);
      memoryResult = false;
    }

    return redisResult || memoryResult;
  }

  async clear(): Promise<boolean> {
    let redisResult = true;
    let memoryResult = true;

    if (this.useRedis && this.redisCache) {
      try {
        redisResult = await this.redisCache.clear();
      } catch (error) {
        this.logger.warn('Redis clear failed');
        redisResult = false;
      }
    }

    try {
      memoryResult = await this.memoryCache.clear();
    } catch (error) {
      this.logger.warn('Memory cache clear failed');
      memoryResult = false;
    }

    return redisResult && memoryResult;
  }

  async invalidate(pattern: string): Promise<number> {
    let totalInvalidated = 0;

    if (this.useRedis && this.redisCache) {
      try {
        totalInvalidated += await this.redisCache.invalidate(pattern);
      } catch (error) {
        this.logger.warn(`Redis invalidate failed for pattern ${pattern}`);
      }
    }

    try {
      totalInvalidated += await this.memoryCache.invalidate(pattern);
    } catch (error) {
      this.logger.warn(`Memory cache invalidate failed for pattern ${pattern}`);
    }

    return totalInvalidated;
  }

  async exists(key: string): Promise<boolean> {
    const activeCache = this.getActiveCache();
    return await activeCache.exists(key);
  }

  async ttl(key: string): Promise<number> {
    const activeCache = this.getActiveCache();
    return await activeCache.ttl(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const activeCache = this.getActiveCache();
    return await activeCache.keys(pattern);
  }

  async size(): Promise<number> {
    const activeCache = this.getActiveCache();
    return await activeCache.size();
  }

  async stats(): Promise<CacheStats> {
    const activeCache = this.getActiveCache();
    return await activeCache.stats();
  }

  // Health check methods
  async healthCheck(): Promise<{ redis: boolean; memory: boolean; active: string }> {
    const redisHealth = this.redisCache ? this.redisCache.isHealthy() : false;
    const memoryHealth = true; // Memory cache is always healthy

    return {
      redis: redisHealth,
      memory: memoryHealth,
      active: this.useRedis ? 'redis' : 'memory'
    };
  }

  // Management methods
  async switchToMemory(): Promise<void> {
    this.useRedis = false;
    this.logger.info('Manually switched to memory cache');
  }

  async switchToRedis(): Promise<void> {
    if (this.redisCache && this.redisCache.isHealthy()) {
      this.useRedis = true;
      this.logger.info('Manually switched to Redis cache');
    } else {
      throw new CacheError('Cannot switch to Redis: not available or unhealthy');
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up cache manager');

    if (this.redisCache) {
      await this.redisCache.disconnect();
    }

    this.memoryCache.cleanup();
  }
}

// Factory function
export function createCacheManager(config: CacheConfig, logger: GlobalLogger): CacheManager {
  return new CacheManager(config, logger);
}

export default CacheManager;

