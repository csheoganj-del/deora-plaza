// Advanced Redis Caching System for DEORA
// Replaces basic in-memory cache with distributed Redis caching

import Redis from 'redis';

// Cache configuration
interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  defaultTtl: number;
  maxRetries: number;
  retryDelay: number;
}

// Cache entry with metadata
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  lastReset: number;
}

class RedisCacheManager {
  private client!: Redis.RedisClientType;
  private config: CacheConfig;
  private stats: CacheStats;
  private isHealthy: boolean = false;
  private fallbackCache = new Map<string, CacheEntry>();

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'deora:',
      defaultTtl: parseInt(process.env.REDIS_DEFAULT_TTL || '300'), // 5 minutes
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      lastReset: Date.now()
    };

    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = Redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          reconnectStrategy: (retries) => {
            if (retries > this.config.maxRetries) {
              console.error('Redis max retries reached, falling back to memory cache');
              this.isHealthy = false;
              return false;
            }
            return Math.min(retries * this.config.retryDelay, 3000);
          }
        },
        password: this.config.password,
        database: this.config.db
      });

      this.client.on('error', (error) => {
        console.error('Redis error:', error);
        this.isHealthy = false;
        this.stats.errors++;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isHealthy = true;
      });

      this.client.on('disconnect', () => {
        console.warn('Redis disconnected, using fallback cache');
        this.isHealthy = false;
      });

      await this.client.connect();
      await this.testConnection();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.isHealthy = false;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      await this.client.ping();
      this.isHealthy = true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      this.isHealthy = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private serialize<T>(data: T): string {
    return JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: Date.now() + (this.config.defaultTtl * 1000),
      version: 1
    } as CacheEntry<T>);
  }

  private deserialize<T>(serialized: string): T | null {
    try {
      const entry: CacheEntry<T> = JSON.parse(serialized);
      
      // Check if expired
      if (Date.now() > entry.ttl) {
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.error('Cache deserialization error:', error);
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    try {
      if (this.isHealthy && this.client) {
        const serialized = await this.client.get(fullKey);
        if (serialized) {
          const data = this.deserialize<T>(serialized);
          if (data !== null) {
            this.stats.hits++;
            return data;
          }
        }
      }
    } catch (error) {
      console.error('Redis get error:', error);
      this.stats.errors++;
    }

    // Fallback to memory cache
    const fallback = this.fallbackCache.get(key);
    if (fallback && Date.now() < fallback.ttl) {
      this.stats.hits++;
      return fallback.data as T;
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    const fullKey = this.getKey(key);
    const actualTtl = ttl || this.config.defaultTtl;
    const serialized = this.serialize(data);

    try {
      if (this.isHealthy && this.client) {
        await this.client.setEx(fullKey, actualTtl, serialized);
        this.stats.sets++;
        return true;
      }
    } catch (error) {
      console.error('Redis set error:', error);
      this.stats.errors++;
    }

    // Fallback to memory cache
    this.fallbackCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: Date.now() + (actualTtl * 1000),
      version: 1
    });
    this.stats.sets++;
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);

    try {
      if (this.isHealthy && this.client) {
        await this.client.del(fullKey);
      }
    } catch (error) {
      console.error('Redis delete error:', error);
      this.stats.errors++;
    }

    // Always delete from fallback cache
    this.fallbackCache.delete(key);
    this.stats.deletes++;
    return true;
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (this.isHealthy && this.client) {
        if (pattern) {
          const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}*`);
          if (keys.length > 0) {
            await this.client.del(keys);
          }
        } else {
          const keys = await this.client.keys(`${this.config.keyPrefix}*`);
          if (keys.length > 0) {
            await this.client.del(keys);
          }
        }
      }
    } catch (error) {
      console.error('Redis clear error:', error);
      this.stats.errors++;
    }

    // Clear fallback cache
    if (pattern) {
      for (const key of this.fallbackCache.keys()) {
        if (key.includes(pattern)) {
          this.fallbackCache.delete(key);
        }
      }
    } else {
      this.fallbackCache.clear();
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);

    try {
      if (this.isHealthy && this.client) {
        const result = await this.client.exists(fullKey);
        return result === 1;
      }
    } catch (error) {
      console.error('Redis exists error:', error);
      this.stats.errors++;
    }

    // Check fallback cache
    const fallback = this.fallbackCache.get(key);
    return fallback !== undefined && Date.now() < fallback.ttl;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getKey(key);

    try {
      if (this.isHealthy && this.client) {
        return await this.client.incrBy(fullKey, amount);
      }
    } catch (error) {
      console.error('Redis increment error:', error);
      this.stats.errors++;
    }

    // Fallback implementation
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    if (this.isHealthy && this.client) {
      try {
        const fullKeys = keys.map(key => this.getKey(key));
        const values = await this.client.mGet(fullKeys);

        keys.forEach((key, index) => {
          const value = values[index];
          if (value) {
            const data = this.deserialize<T>(value);
            results.set(key, data);
            if (data !== null) {
              this.stats.hits++;
            } else {
              this.stats.misses++;
            }
          } else {
            this.stats.misses++;
            results.set(key, null);
          }
        });

        return results;
      } catch (error) {
        console.error('Redis mget error:', error);
        this.stats.errors++;
      }
    }

    // Fallback: get individually
    for (const key of keys) {
      results.set(key, await this.get<T>(key));
    }

    return results;
  }

  async setMultiple<T>(entries: Map<string, T>, ttl?: number): Promise<boolean> {
    if (this.isHealthy && this.client) {
      try {
        const pipeline = this.client.multi();
        const actualTtl = ttl || this.config.defaultTtl;

        for (const [key, data] of entries) {
          const fullKey = this.getKey(key);
          const serialized = this.serialize(data);
          pipeline.setEx(fullKey, actualTtl, serialized);
        }

        await pipeline.exec();
        this.stats.sets += entries.size;
        return true;
      } catch (error) {
        console.error('Redis mset error:', error);
        this.stats.errors++;
      }
    }

    // Fallback: set individually
    for (const [key, data] of entries) {
      await this.set(key, data, ttl);
    }

    return true;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      lastReset: Date.now()
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; redis: boolean; fallback: boolean }> {
    let redisHealthy = false;
    if (this.client) {
      await this.testConnection();
      redisHealthy = this.isHealthy;
    }
    const fallbackHealthy = this.fallbackCache.size > 0;
    
    return {
      healthy: redisHealthy || fallbackHealthy,
      redis: redisHealthy,
      fallback: fallbackHealthy
    };
  }

  async cleanup(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
    } catch (error) {
      console.error('Error during Redis cleanup:', error);
    }
  }

  // Advanced caching methods

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetcher();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return this.getOrSet(key, fetcher, ttl);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.clear(pattern);
  }

  // Cache warming utilities
  async warmCache<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(entry => this.set(entry.key, entry.data, entry.ttl));
    await Promise.allSettled(promises);
  }

  // Cache analytics
  getHitRatio(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  getCacheInfo(): {
    stats: CacheStats;
    hitRatio: number;
    healthy: boolean;
    fallbackSize: number;
  } {
    return {
      stats: this.getStats(),
      hitRatio: this.getHitRatio(),
      healthy: this.isHealthy,
      fallbackSize: this.fallbackCache.size
    };
  }
}

// Singleton instance
let cacheInstance: RedisCacheManager | null = null;

export function getCache(): RedisCacheManager {
  if (!cacheInstance) {
    cacheInstance = new RedisCacheManager();
  }
  return cacheInstance;
}

export function createCache(config?: Partial<CacheConfig>): RedisCacheManager {
  return new RedisCacheManager(config);
}

// Export types
export type { CacheConfig, CacheEntry, CacheStats };
export { RedisCacheManager };

// Convenience functions for backward compatibility
export async function getCachedData<T>(key: string): Promise<T | null> {
  return getCache().get<T>(key);
}

export async function setCachedData<T>(key: string, data: T, ttlMs?: number): Promise<void> {
  const ttl = ttlMs ? Math.floor(ttlMs / 1000) : undefined;
  await getCache().set(key, data, ttl);
}

export async function clearCache(pattern?: string): Promise<void> {
  await getCache().clear(pattern);
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

