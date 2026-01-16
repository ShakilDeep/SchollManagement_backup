import type { NextRequest } from "next/server"

interface CacheEntry<T> {
  value: T
  expiry: number
}

class SimpleLRUCache<K extends string, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, { value, expiry: Date.now() + this.ttl })
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return undefined
    }
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const cache = new SimpleLRUCache<string, { count: number; resetTime: number }>(
  500,
  60000
)

const blockedIPs = new SimpleLRUCache<string, { blockedUntil: number; attempts: number }>(
  100,
  3600000
)

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export async function rateLimit(
  request: NextRequest,
  options: { limit?: number; window?: number } = {}
): Promise<RateLimitResult> {
  const limit = options.limit || 100
  const window = options.window || 60000

  const ip = getClientIP(request)
  const key = `rate_limit:${ip}`

  const now = Date.now()

  const blockedEntry = blockedIPs.get(ip)
  if (blockedEntry && blockedEntry.blockedUntil > now) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: blockedEntry.blockedUntil,
      retryAfter: Math.ceil((blockedEntry.blockedUntil - now) / 1000)
    }
  }

  const entry = cache.get(key)

  if (!entry || now > entry.resetTime) {
    cache.set(key, { count: 1, resetTime: now + window })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: now + window
    }
  }

  const newCount = entry.count + 1

  if (newCount > limit) {
    const blockedUntil = now + 3600000
    const attempts = (blockedEntry?.attempts || 0) + 1

    blockedIPs.set(ip, { blockedUntil, attempts })

    cache.delete(key)

    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: blockedUntil,
      retryAfter: 3600
    }
  }

  cache.set(key, { count: newCount, resetTime: entry.resetTime })

  return {
    success: true,
    limit,
    remaining: limit - newCount,
    resetTime: entry.resetTime
  }
}

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

export function isIPBlocked(ip: string): boolean {
  const blockedEntry = blockedIPs.get(ip)
  return blockedEntry !== undefined && blockedEntry.blockedUntil > Date.now()
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip)
  cache.delete(`rate_limit:${ip}`)
}

export function getRateLimitStatus(ip: string): {
  isBlocked: boolean
  blockedUntil?: number
  currentCount: number
  remaining: number
} {
  const blockedEntry = blockedIPs.get(ip)
  const entry = cache.get(`rate_limit:${ip}`)

  return {
    isBlocked: blockedEntry !== undefined && blockedEntry.blockedUntil > Date.now(),
    blockedUntil: blockedEntry?.blockedUntil,
    currentCount: entry?.count || 0,
    remaining: Math.max(0, 100 - (entry?.count || 0))
  }
}
