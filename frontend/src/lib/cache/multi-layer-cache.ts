import { SimpleLRUCache } from "./simple-lru-cache"
import { getRedisClient, isRedisAvailable } from "./redis-client"

interface CacheOptions {
  lruSize?: number
  lruTTL?: number
  redisTTL?: number
  useRedis?: boolean
}

class MultiLayerCache {
  private lruCache: SimpleLRUCache<string, any>
  private useRedis: boolean
  private lruTTL: number

  constructor(options: CacheOptions = {}) {
    const lruSize = options.lruSize || 1000
    this.lruTTL = options.lruTTL || 60000
    this.lruCache = new SimpleLRUCache<string, any>(lruSize, this.lruTTL)

    this.useRedis = options.useRedis !== false
  }

  async get<T>(key: string): Promise<T | null> {
    const lruValue = this.lruCache.get(key)

    if (lruValue !== undefined) {
      return lruValue as T
    }

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        const redisValue = await redis.get(key)

        if (redisValue) {
          const parsed = JSON.parse(redisValue)
          this.lruCache.set(key, parsed)
          return parsed as T
        }
      } catch (error) {
        console.error("Redis get error:", error)
      }
    }

    return null
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const lruTTL = ttl || this.lruTTL
    this.lruCache.set(key, value, { ttl: lruTTL })

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        const redisTTL = ttl ? Math.floor(ttl / 1000) : undefined
        await redis.setex(key, redisTTL || 3600, JSON.stringify(value))
      } catch (error) {
        console.error("Redis set error:", error)
      }
    }
  }

  async del(key: string): Promise<void> {
    this.lruCache.delete(key)

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        await redis.del(key)
      } catch (error) {
        console.error("Redis del error:", error)
      }
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = this.lruCache.keys()

    for (const key of keys) {
      if (this.matchPattern(key, pattern)) {
        this.lruCache.delete(key)
      }
    }

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        const redisKeys = await redis.keys(pattern)

        if (redisKeys.length > 0) {
          await redis.del(...redisKeys)
        }
      } catch (error) {
        console.error("Redis delPattern error:", error)
      }
    }
  }

  async clear(): Promise<void> {
    this.lruCache.clear()

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        await redis.flushdb()
      } catch (error) {
        console.error("Redis clear error:", error)
      }
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.lruCache.has(key)) {
      return true
    }

    if (this.useRedis && await isRedisAvailable()) {
      try {
        const redis = getRedisClient()
        const exists = await redis.exists(key)
        return exists === 1
      } catch (error) {
        console.error("Redis has error:", error)
      }
    }

    return false
  }

  private matchPattern(str: string, pattern: string): boolean {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    )
    return regex.test(str)
  }

  async getStats(): Promise<{
    lruSize: number
    lruMaxSize: number
    redisAvailable: boolean
  }> {
    return {
      lruSize: this.lruCache.size,
      lruMaxSize: this.lruCache.max,
      redisAvailable: await isRedisAvailable()
    }
  }
}

const cacheInstances = new Map<string, MultiLayerCache>()

export function getCache(namespace: string, options?: CacheOptions): MultiLayerCache {
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new MultiLayerCache(options))
  }

  return cacheInstances.get(namespace)!
}

export function clearAllCaches(): void {
  for (const cache of cacheInstances.values()) {
    cache.clear()
  }
  cacheInstances.clear()
}

export const defaultCache = getCache("default", {
  lruSize: 1000,
  lruTTL: 60000,
  redisTTL: 3600000
})

export const apiCache = getCache("api", {
  lruSize: 500,
  lruTTL: 30000,
  redisTTL: 600000
})

export const dashboardCache = getCache("dashboard", {
  lruSize: 200,
  lruTTL: 120000,
  redisTTL: 300000
})

export const userCache = getCache("user", {
  lruSize: 300,
  lruTTL: 90000,
  redisTTL: 180000
})

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options?: {
    ttl?: number
    cache?: MultiLayerCache
  }
): Promise<T> {
  const cache = options?.cache || defaultCache

  const cached = await cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const value = await fn()

  await cache.set(key, value, options?.ttl)

  return value
}
