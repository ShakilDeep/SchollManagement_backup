import { SimpleLRUCache } from "@/lib/cache/simple-lru-cache"

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number
}

interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  blockedUntil?: number
}

class RedisRateLimiter {
  private localCache: SimpleLRUCache<string, { count: number; resetTime: number }>
  private blockedCache: SimpleLRUCache<string, { blockedUntil: number }>
  private defaultConfig: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.defaultConfig = config
    this.localCache = new SimpleLRUCache<string, { count: number; resetTime: number }>(
      10000,
      config.windowMs
    )
    this.blockedCache = new SimpleLRUCache<string, { blockedUntil: number }>(
      1000,
      config.blockDurationMs || 3600000
    )
  }

  async checkRateLimit(identifier: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    const mergedConfig = { ...this.defaultConfig, ...config }

    const blocked = this.blockedCache.get(identifier)
    if (blocked && blocked.blockedUntil > Date.now()) {
      return {
        allowed: false,
        limit: mergedConfig.maxRequests,
        remaining: 0,
        resetTime: blocked.blockedUntil,
        blockedUntil: blocked.blockedUntil
      }
    }

    const current = this.localCache.get(identifier)
    const now = Date.now()

    if (!current || current.resetTime <= now) {
      this.localCache.set(identifier, {
        count: 1,
        resetTime: now + mergedConfig.windowMs
      })

      return {
        allowed: true,
        limit: mergedConfig.maxRequests,
        remaining: mergedConfig.maxRequests - 1,
        resetTime: now + mergedConfig.windowMs
      }
    }

    if (current.count >= mergedConfig.maxRequests) {
      if (mergedConfig.blockDurationMs) {
        this.blockedCache.set(identifier, {
          blockedUntil: now + mergedConfig.blockDurationMs
        })
      }

      return {
        allowed: false,
        limit: mergedConfig.maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
        blockedUntil: mergedConfig.blockDurationMs ? now + mergedConfig.blockDurationMs : undefined
      }
    }

    current.count++
    this.localCache.set(identifier, current)

    return {
      allowed: true,
      limit: mergedConfig.maxRequests,
      remaining: mergedConfig.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }

  async increment(identifier: string, amount: number = 1): Promise<number> {
    const current = this.localCache.get(identifier)
    const now = Date.now()

    if (!current || current.resetTime <= now) {
      this.localCache.set(identifier, {
        count: amount,
        resetTime: now + this.defaultConfig.windowMs
      })

      return amount
    }

    current.count += amount
    this.localCache.set(identifier, current)

    return current.count
  }

  async reset(identifier: string): Promise<void> {
    this.localCache.delete(identifier)
    this.blockedCache.delete(identifier)
  }

  async isBlocked(identifier: string): Promise<boolean> {
    const blocked = this.blockedCache.get(identifier)
    if (!blocked) return false

    if (blocked.blockedUntil <= Date.now()) {
      this.blockedCache.delete(identifier)
      return false
    }

    return true
  }

  async block(identifier: string, durationMs?: number): Promise<void> {
    this.blockedCache.set(identifier, {
      blockedUntil: Date.now() + (durationMs || this.defaultConfig.blockDurationMs || 3600000)
    })
  }

  async unblock(identifier: string): Promise<void> {
    this.blockedCache.delete(identifier)
  }

  getStats() {
    return {
      localCache: {
        size: this.localCache.size,
        keys: Array.from(this.localCache.keys()),
        max: this.localCache.max,
        stats: this.localCache.stats
      },
      blockedCache: {
        size: this.blockedCache.size,
        keys: Array.from(this.blockedCache.keys()),
        max: this.blockedCache.max
      }
    }
  }

  clearAll() {
    this.localCache.clear()
    this.blockedCache.clear()
  }
}

const defaultRateLimiter = new RedisRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  blockDurationMs: 300000
})

const strictRateLimiter = new RedisRateLimiter({
  maxRequests: 20,
  windowMs: 60000,
  blockDurationMs: 600000
})

const authRateLimiter = new RedisRateLimiter({
  maxRequests: 5,
  windowMs: 60000,
  blockDurationMs: 900000
})

export function createRateLimiter(config: RateLimitConfig) {
  return new RedisRateLimiter(config)
}

export async function checkRateLimit(
  identifier: string,
  type: "default" | "strict" | "auth" = "default",
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  switch (type) {
    case "strict":
      return strictRateLimiter.checkRateLimit(identifier, config)
    case "auth":
      return authRateLimiter.checkRateLimit(identifier, config)
    default:
      return defaultRateLimiter.checkRateLimit(identifier, config)
  }
}

export async function blockIP(ip: string, durationMs: number = 3600000): Promise<void> {
  await defaultRateLimiter.block(ip, durationMs)
  await strictRateLimiter.block(ip, durationMs)
  await authRateLimiter.block(ip, durationMs)
}

export async function unblockIP(ip: string): Promise<void> {
  await defaultRateLimiter.unblock(ip)
  await strictRateLimiter.unblock(ip)
  await authRateLimiter.unblock(ip)
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  return await defaultRateLimiter.isBlocked(ip)
}

export function getRateLimiterStats() {
  return {
    default: defaultRateLimiter.getStats(),
    strict: strictRateLimiter.getStats(),
    auth: authRateLimiter.getStats()
  }
}

export function clearAllRateLimiters() {
  defaultRateLimiter.clearAll()
  strictRateLimiter.clearAll()
  authRateLimiter.clearAll()
}

export { RedisRateLimiter, defaultRateLimiter, strictRateLimiter, authRateLimiter }
