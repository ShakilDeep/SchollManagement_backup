import { PrismaClient } from "@prisma/client"
import { SimpleLRUCache } from "../cache/simple-lru-cache"
import { getMultiLayerCache } from "../cache/multi-layer-cache"

const CACHE_TTL = 300000
const MAX_CACHE_SIZE = 1000

const queryCache = new SimpleLRUCache<string, any>(
  MAX_CACHE_SIZE,
  CACHE_TTL
)

const connectionPool = {
  min: 2,
  max: 10,
  timeout: 10000
}

let prismaInstance: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      errorFormat: "minimal",
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  }
  return prismaInstance
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}

export function generateCacheKey(
  model: string,
  operation: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join("|")
  return `${model}:${operation}:${sortedParams}`
}

export async function cachedQuery<T>(
  model: string,
  operation: string,
  params: Record<string, any>,
  queryFn: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  const cacheKey = generateCacheKey(model, operation, params)
  
  const cachedResult = queryCache.get(cacheKey)
  if (cachedResult !== undefined) {
    return cachedResult as T
  }

  const multiLayerCache = getMultiLayerCache()
  const multiLayerResult = await multiLayerCache.get<T>(cacheKey)
  if (multiLayerResult) {
    queryCache.set(cacheKey, multiLayerResult)
    return multiLayerResult
  }

  const result = await queryFn()
  
  queryCache.set(cacheKey, result)
  await multiLayerCache.set(cacheKey, result, ttl)
  
  return result
}

export function invalidateCache(pattern: string): void {
  const keys = Array.from(queryCache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  })
}

export function invalidateAllCache(): void {
  queryCache.clear()
}

export async function paginatedQuery<T>(
  queryFn: (options: { skip: number; take: number }) => Promise<T[]>,
  totalCountFn: () => Promise<number>,
  page: number,
  pageSize: number = 20
): Promise<{ data: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
  const skip = (page - 1) * pageSize
  const take = pageSize

  const [data, total] = await Promise.all([
    queryFn({ skip, take }),
    totalCountFn()
  ])

  const totalPages = Math.ceil(total / pageSize)

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  }
}

export async function cursorBasedPagination<T, CursorField extends keyof T>(
  queryFn: (cursor?: string, take?: number) => Promise<T[]>,
  cursor?: string,
  take: number = 20
): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
  const data = await queryFn(cursor, take + 1)
  
  const hasMore = data.length > take
  const paginatedData = hasMore ? data.slice(0, -1) : data
  
  const nextCursor = hasMore && paginatedData.length > 0 
    ? String(paginatedData[paginatedData.length - 1][(paginatedData[paginatedData.length - 1] as any).id || "id"])
    : undefined

  return {
    data: paginatedData,
    nextCursor,
    hasMore
  }
}

export async function batchQuery<T>(
  queryFns: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < queryFns.length; i += batchSize) {
    const batch = queryFns.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn => fn()))
    results.push(...batchResults)
  }
  
  return results
}

export async function transaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getPrismaClient()
  return await prisma.$transaction(callback)
}

export async function healthCheck(): Promise<{ status: string; connections: number; cacheSize: number }> {
  try {
    const prisma = getPrismaClient()
    await prisma.$queryRaw`SELECT 1`
    
    return {
      status: "healthy",
      connections: connectionPool.max,
      cacheSize: queryCache.size
    }
  } catch (error) {
    return {
      status: "unhealthy",
      connections: 0,
      cacheSize: queryCache.size
    }
  }
}

export async function optimizeDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const prisma = getPrismaClient()
    
    await prisma.$executeRaw`ANALYZE`
    await prisma.$executeRaw`VACUUM`
    
    invalidateAllCache()
    
    return {
      success: true,
      message: "Database optimization completed successfully"
    }
  } catch (error) {
    console.error("Database optimization error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

export async function getQueryStats(): Promise<{ cacheHits: number; cacheMisses: number; hitRate: number }> {
  const stats = queryCache.stats
  const hitRate = stats.hits + stats.misses > 0 
    ? (stats.hits / (stats.hits + stats.misses)) * 100 
    : 0

  return {
    cacheHits: stats.hits,
    cacheMisses: stats.misses,
    hitRate: Math.round(hitRate * 100) / 100
  }
}

export function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0
    
    const attemptFn = async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        attempt++
        if (attempt >= maxRetries) {
          reject(error)
        } else {
          setTimeout(attemptFn, delay * attempt)
        }
      }
    }
    
    attemptFn()
  })
}

export async function warmUpCache(): Promise<{ success: boolean; message: string }> {
  try {
    const prisma = getPrismaClient()
    const multiLayerCache = getMultiLayerCache()
    
    const cacheKeys = [
      { model: "User", operation: "count", params: {} },
      { model: "Student", operation: "count", params: {} },
      { model: "Grade", operation: "findMany", params: {} },
      { model: "Section", operation: "findMany", params: {} }
    ]
    
    for (const key of cacheKeys) {
      await cachedQuery(
        key.model,
        key.operation,
        key.params,
        async () => {
          if (key.operation === "count") {
            return await (prisma as any)[key.model].count()
          } else {
            return await (prisma as any)[key.model].findMany(key.params)
          }
        }
      )
    }
    
    return {
      success: true,
      message: "Cache warm-up completed successfully"
    }
  } catch (error) {
    console.error("Cache warm-up error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
