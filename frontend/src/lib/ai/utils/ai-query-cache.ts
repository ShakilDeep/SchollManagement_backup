export interface CacheEntry<T> {
  data: T
  timestamp: number
  hits: number
  lastAccess: number
}

export interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  totalEntries: number
  size: number
}

export interface CacheConfig {
  defaultTTL: number
  maxSize: number
  enableStats: boolean
  cleanupInterval: number
}

export class AIQueryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>
  private config: CacheConfig
  private stats: { hits: number; misses: number }
  private cleanupTimer: NodeJS.Timeout | null

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map()
    this.stats = { hits: 0, misses: 0 }
    this.config = {
      defaultTTL: config.defaultTTL || 300000,
      maxSize: config.maxSize || 1000,
      enableStats: config.enableStats ?? true,
      cleanupInterval: config.cleanupInterval || 60000
    }
    this.cleanupTimer = null

    if (this.config.cleanupInterval > 0) {
      this.startCleanup()
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++
      }
      return null
    }

    const now = Date.now()

    if (now - entry.timestamp > this.config.defaultTTL) {
      this.cache.delete(key)
      if (this.config.enableStats) {
        this.stats.misses++
      }
      return null
    }

    entry.hits++
    entry.lastAccess = now

    if (this.config.enableStats) {
      this.stats.hits++
    }

    return entry.data
  }

  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      lastAccess: Date.now()
    }

    if (ttl) {
      entry.timestamp = Date.now() - (this.config.defaultTTL - ttl)
    }

    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(key, entry)
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > this.config.defaultTTL) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  size(): number {
    return this.cache.size
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate,
      totalEntries: this.cache.size,
      size: this.cache.size
    }
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null
    let lruTime = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.defaultTTL) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  destroy(): void {
    this.stopCleanup()
    this.clear()
  }

  invalidate(pattern: string | RegExp): number {
    let deleted = 0

    if (typeof pattern === 'string') {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
          deleted++
        }
      }
    } else if (pattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key)
          deleted++
        }
      }
    }

    return deleted
  }

  invalidatePrefix(prefix: string): number {
    return this.invalidate(prefix)
  }

  warm(keys: { key: string; data: T }[]): void {
    keys.forEach(({ key, data }) => {
      if (!this.has(key)) {
        this.set(key, data)
      }
    })
  }

  getOrSet(
    key: string,
    factory: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) {
      return Promise.resolve(cached)
    }

    const result = factory()
    const promiseResult = result instanceof Promise ? result : Promise.resolve(result)

    promiseResult.then(data => {
      this.set(key, data, ttl)
    })

    return promiseResult
  }
}

export class AIQueryCacheManager {
  private static instances: Map<string, AIQueryCache> = new Map()

  static getInstance(name: string, config?: Partial<CacheConfig>): AIQueryCache {
    if (!this.instances.has(name)) {
      this.instances.set(name, new AIQueryCache(config))
    }
    return this.instances.get(name)!
  }

  static clearAll(): void {
    for (const cache of this.instances.values()) {
      cache.destroy()
    }
    this.instances.clear()
  }

  static getStats(name: string): CacheStats | null {
    const cache = this.instances.get(name)
    return cache ? cache.getStats() : null
  }

  static getAllStats(): Map<string, CacheStats> {
    const stats = new Map<string, CacheStats>()
    for (const [name, cache] of this.instances) {
      stats.set(name, cache.getStats())
    }
    return stats
  }
}

export const defaultCache = new AIQueryCache({
  defaultTTL: 300000,
  maxSize: 500,
  enableStats: true,
  cleanupInterval: 60000
})

export const shortTermCache = new AIQueryCache({
  defaultTTL: 60000,
  maxSize: 200,
  enableStats: true,
  cleanupInterval: 30000
})

export const longTermCache = new AIQueryCache({
  defaultTTL: 900000,
  maxSize: 1000,
  enableStats: true,
  cleanupInterval: 120000
})
