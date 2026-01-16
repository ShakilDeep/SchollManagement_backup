interface CacheEntry<T> {
  value: T
  expiry: number
}

export class SimpleLRUCache<K extends string, V> {
  private cache = new Map<K, CacheEntry<V>>()
  private maxSize: number
  private ttl: number
  private hits = 0
  private misses = 0

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key: K, value: V, options?: { ttl?: number }): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    const expiry = options?.ttl ? Date.now() + options.ttl : Date.now() + this.ttl
    this.cache.set(key, { value, expiry })
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return undefined
    }
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.misses++
      return undefined
    }
    this.hits++
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.value
  }

  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  get size(): number {
    return this.cache.size
  }

  get max(): number {
    return this.maxSize
  }

  get stats(): { hits: number; misses: number } {
    return { hits: this.hits, misses: this.misses }
  }

  [Symbol.iterator](): Iterator<[K, V]> {
    const entries = this.entries()
    return entries[Symbol.iterator]()
  }
}