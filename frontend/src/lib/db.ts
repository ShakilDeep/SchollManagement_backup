import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=20&pool_timeout=10&socket_timeout=10&journal_mode=WAL&cache_size=-64000&synchronous=NORMAL`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    errorFormat: 'pretty'
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export async function disconnectDb() {
  await db.$disconnect()
}