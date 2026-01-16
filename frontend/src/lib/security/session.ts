import { SimpleLRUCache } from "../cache/simple-lru-cache"
import { prisma } from "@/lib/db"
import { createAuditLog, AuditAction, AuditEntity } from "./audit"

interface SessionData {
  userId: string
  sessionId: string
  createdAt: number
  lastActivity: number
  ipAddress: string
  userAgent: string
}

const sessionCache = new SimpleLRUCache<string, SessionData>(
  1000,
  15 * 60 * 1000
)

const userSessions = new SimpleLRUCache<string, string[]>(
  500,
  15 * 60 * 1000
)

const MAX_CONCURRENT_SESSIONS = 3

export async function createSession(sessionData: {
  userId: string
  sessionId: string
  ipAddress: string
  userAgent: string
}): Promise<{ success: boolean; terminatedSessions?: string[] }> {
  const { userId, sessionId, ipAddress, userAgent } = sessionData

  const userSessionIds = userSessions.get(userId) || []
  const now = Date.now()

  if (userSessionIds.length >= MAX_CONCURRENT_SESSIONS) {
    const terminatedSessions: string[] = []

    const sortedSessions = userSessionIds
      .map(id => sessionCache.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.lastActivity - b!.lastActivity)

    const toTerminate = sortedSessions.slice(0, userSessionIds.length - MAX_CONCURRENT_SESSIONS + 1)

    for (const session of toTerminate) {
      if (session) {
        await terminateSession(session.sessionId, userId)
        terminatedSessions.push(session.sessionId)
      }
    }

    const newUserSessionIds = userSessionIds.filter(
      id => !terminatedSessions.includes(id)
    )

    const newSession: SessionData = {
      userId,
      sessionId,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent
    }

    sessionCache.set(sessionId, newSession)
    newUserSessionIds.push(sessionId)
    userSessions.set(userId, newUserSessionIds)

    await createAuditLog({
      userId,
      action: AuditAction.SIGN_IN,
      entity: AuditEntity.USER,
      entityId: userId,
      details: {
        sessionId,
        terminatedSessions,
        reason: "MAX_CONCURRENT_SESSIONS"
      },
      ipAddress,
      userAgent
    })

    return { success: true, terminatedSessions }
  }

  const newSession: SessionData = {
    userId,
    sessionId,
    createdAt: now,
    lastActivity: now,
    ipAddress,
    userAgent
  }

  sessionCache.set(sessionId, newSession)
  userSessionIds.push(sessionId)
  userSessions.set(userId, userSessionIds)

  await createAuditLog({
    userId,
    action: AuditAction.SIGN_IN,
    entity: AuditEntity.USER,
    entityId: userId,
    details: { sessionId },
    ipAddress,
    userAgent
  })

  return { success: true }
}

export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  const session = sessionCache.get(sessionId)

  if (!session) {
    return false
  }

  session.lastActivity = Date.now()
  sessionCache.set(sessionId, session)

  return true
}

export async function terminateSession(
  sessionId: string,
  userId?: string
): Promise<boolean> {
  const session = sessionCache.get(sessionId)

  if (!session) {
    return false
  }

  sessionCache.delete(sessionId)

  if (userId || session.userId) {
    const uid = userId || session.userId
    const userSessionIds = userSessions.get(uid) || []
    const updatedIds = userSessionIds.filter(id => id !== sessionId)

    if (updatedIds.length > 0) {
      userSessions.set(uid, updatedIds)
    } else {
      userSessions.delete(uid)
    }
  }

  return true
}

export async function terminateAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  const userSessionIds = userSessions.get(userId) || []

  const toTerminate = exceptSessionId
    ? userSessionIds.filter(id => id !== exceptSessionId)
    : userSessionIds

  for (const sessionId of toTerminate) {
    await terminateSession(sessionId, userId)
  }

  return toTerminate.length
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessionCache.get(sessionId)
}

export function getUserSessions(userId: string): SessionData[] {
  const userSessionIds = userSessions.get(userId) || []
  return userSessionIds
    .map(id => sessionCache.get(id))
    .filter(Boolean) as SessionData[]
}

export function getUserActiveSessionCount(userId: string): number {
  const userSessionIds = userSessions.get(userId) || []
  const now = Date.now()

  return userSessionIds.filter(id => {
    const session = sessionCache.get(id)
    return session && (now - session.lastActivity) < 15 * 60 * 1000
  }).length
}

export function isSessionValid(sessionId: string): boolean {
  const session = sessionCache.get(sessionId)
  if (!session) {
    return false
  }

  const now = Date.now()
  const sessionAge = now - session.createdAt
  const sessionMaxAge = 15 * 60 * 1000

  if (sessionAge > sessionMaxAge) {
    sessionCache.delete(sessionId)
    return false
  }

  return true
}

export async function validateAndRefreshSession(
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ valid: boolean; session?: SessionData; error?: string }> {
  const session = sessionCache.get(sessionId)

  if (!session) {
    return { valid: false, error: "Session not found" }
  }

  const now = Date.now()
  const sessionAge = now - session.createdAt
  const sessionMaxAge = 15 * 60 * 1000

  if (sessionAge > sessionMaxAge) {
    await terminateSession(sessionId)
    return { valid: false, error: "Session expired" }
  }

  if (session.ipAddress !== ipAddress) {
    await createAuditLog({
      userId: session.userId,
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      entity: AuditEntity.USER,
      details: {
        sessionId,
        reason: "IP_ADDRESS_MISMATCH",
        expectedIP: session.ipAddress,
        actualIP: ipAddress
      },
      ipAddress
    })
  }

  session.lastActivity = now
  sessionCache.set(sessionId, session)

  return { valid: true, session }
}

export function getSessionStats(): {
  totalSessions: number
  activeUsers: number
  averageSessionAge: number
} {
  const sessions = Array.from(sessionCache.values())
  const now = Date.now()

  const activeUsers = new Set(sessions.map(s => s.userId)).size
  const averageSessionAge = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (now - s.createdAt), 0) / sessions.length
    : 0

  return {
    totalSessions: sessions.length,
    activeUsers,
    averageSessionAge
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const now = Date.now()
  const sessionMaxAge = 15 * 60 * 1000
  let cleanedCount = 0

  for (const [sessionId, session] of sessionCache.entries()) {
    if (now - session.createdAt > sessionMaxAge) {
      await terminateSession(sessionId, session.userId)
      cleanedCount++
    }
  }

  return cleanedCount
}
