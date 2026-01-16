import Redis from "ioredis"

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      enableReadyCheck: true,
      lazyConnect: true
    })

    redisClient.on("error", (error) => {
      console.error("Redis connection error:", error)
    })

    redisClient.on("connect", () => {
      console.log("Redis connected successfully")
    })

    redisClient.on("disconnect", () => {
      console.log("Redis disconnected")
    })
  }

  return redisClient
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient()
    await client.ping()
    return true
  } catch {
    return false
  }
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
