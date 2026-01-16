import { prisma } from "@/lib/db"

const MAX_QUERY_TIME = 5000
const MAX_RESULTS = 1000
const MAX_COMPLEXITY_SCORE = 1000

interface QueryOptions {
  timeout?: number
  maxResults?: number
  skipComplexityCheck?: boolean
}

interface QueryResult<T> {
  data: T[]
  executionTime: number
  complexity: number
}

interface QueryStats {
  totalQueries: number
  slowQueries: number
  failedQueries: number
  averageExecutionTime: number
}

const queryStats: QueryStats = {
  totalQueries: 0,
  slowQueries: 0,
  failedQueries: 0,
  averageExecutionTime: 0
}

export async function executeGuardedQuery<T>(
  queryFn: () => Promise<T[]>,
  options: QueryOptions = {}
): Promise<T[]> {
  const timeout = options.timeout || MAX_QUERY_TIME
  const maxResults = options.maxResults || MAX_RESULTS

  const timeoutPromise = new Promise<T[]>((_, reject) => {
    setTimeout(() => reject(new Error("Query timeout")), timeout)
  })

  const startTime = Date.now()

  try {
    const result = await Promise.race([queryFn(), timeoutPromise]) as T[]

    const executionTime = Date.now() - startTime

    if (result.length > maxResults) {
      throw new Error(`Query result exceeds maximum limit of ${maxResults}`)
    }

    updateQueryStats(executionTime, false)

    return result.slice(0, maxResults)
  } catch (error) {
    const executionTime = Date.now() - startTime
    updateQueryStats(executionTime, true)

    if (error instanceof Error && error.message === "Query timeout") {
      throw new Error(`Query exceeded timeout of ${timeout}ms`)
    }

    throw error
  }
}

export async function executeGuardedQueryWithStats<T>(
  queryFn: () => Promise<T[]>,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const timeout = options.timeout || MAX_QUERY_TIME
  const maxResults = options.maxResults || MAX_RESULTS

  const timeoutPromise = new Promise<T[]>((_, reject) => {
    setTimeout(() => reject(new Error("Query timeout")), timeout)
  })

  const startTime = Date.now()

  try {
    const result = await Promise.race([queryFn(), timeoutPromise]) as T[]

    const executionTime = Date.now() - startTime

    if (result.length > maxResults) {
      throw new Error(`Query result exceeds maximum limit of ${maxResults}`)
    }

    const complexity = calculateQueryComplexity(result)

    updateQueryStats(executionTime, false)

    return {
      data: result.slice(0, maxResults),
      executionTime,
      complexity
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    updateQueryStats(executionTime, true)

    if (error instanceof Error && error.message === "Query timeout") {
      throw new Error(`Query exceeded timeout of ${timeout}ms`)
    }

    throw error
  }
}

function calculateQueryComplexity<T>(result: T[]): number {
  let complexity = 0

  complexity += result.length * 1

  for (const item of result) {
    if (typeof item === "object" && item !== null) {
      complexity += Object.keys(item).length * 0.5

      for (const value of Object.values(item)) {
        if (typeof value === "object" && value !== null) {
          complexity += Object.keys(value).length * 0.25
        } else if (typeof value === "string") {
          complexity += value.length * 0.001
        }
      }
    }
  }

  return Math.round(complexity)
}

function updateQueryStats(executionTime: number, failed: boolean) {
  queryStats.totalQueries++

  if (failed) {
    queryStats.failedQueries++
  } else if (executionTime > MAX_QUERY_TIME * 0.8) {
    queryStats.slowQueries++
  }

  const totalExecutionTime = queryStats.averageExecutionTime * (queryStats.totalQueries - 1)
  queryStats.averageExecutionTime = (totalExecutionTime + executionTime) / queryStats.totalQueries
}

export function getQueryStats(): QueryStats {
  return { ...queryStats }
}

export function resetQueryStats() {
  queryStats.totalQueries = 0
  queryStats.slowQueries = 0
  queryStats.failedQueries = 0
  queryStats.averageExecutionTime = 0
}

export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = delayMs * attempt
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

export function createSafePrismaProxy() {
  return new Proxy(prisma, {
    get(target, prop) {
      if (typeof prop === "string" && target[prop as keyof typeof target]) {
        const model = target[prop as keyof typeof target] as any

        if (model && typeof model === "object") {
          return new Proxy(model, {
            get(modelTarget, modelProp) {
              if (typeof modelProp === "string" && typeof modelTarget[modelProp] === "function") {
                return async (...args: any[]) => {
                  const originalMethod = modelTarget[modelProp] as Function

                  if (["findMany", "findFirst", "findUnique"].includes(modelProp)) {
                    return executeGuardedQuery(() => originalMethod.apply(modelTarget, args))
                  }

                  return originalMethod.apply(modelTarget, args)
                }
              }
              return modelTarget[modelProp]
            }
          })
        }
      }

      return target[prop as keyof typeof target]
    }
  })
}
