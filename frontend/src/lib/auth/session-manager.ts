import { prisma } from "@/lib/db"
import { createAuditLog, AuditAction, AuditEntity } from "@/lib/security/audit"

interface SessionConfig {
  maxConcurrentSessions: number
  sessionTimeout: number
  idleTimeout: number
  absoluteTimeout: number
}

interface SessionInfo {
  id: string
  userId: string
  deviceType: string
  browser: string
  os: string
  ipAddress: string
  createdAt: Date
  lastActive: Date
  expiresAt: Date
}

const DEFAULT_CONFIG: SessionConfig = {
  maxConcurrentSessions: 5,
  sessionTimeout: 24 * 60 * 60 * 1000,
  idleTimeout: 30 * 60 * 1000,
  absoluteTimeout: 7 * 24 * 60 * 60 * 1000
}

class SessionManager {
  private config: SessionConfig

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async createSession(
    userId: string,
    sessionData: {
      deviceType: string
      browser: string
      os: string
      ipAddress: string
    }
  ): Promise<{ allowed: boolean; sessionId?: string; message?: string }> {
    const existingSessions = await prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() }
      },
      orderBy: { lastActive: "desc" }
    })

    if (existingSessions.length >= this.config.maxConcurrentSessions) {
      const oldestSession = existingSessions[existingSessions.length - 1]

      await prisma.session.delete({
        where: { id: oldestSession.id }
      })

      await createAuditLog({
        userId,
        action: AuditAction.SESSION_TERMINATED,
        entity: AuditEntity.SESSION,
        details: {
          reason: "Max concurrent sessions exceeded",
          terminatedSessionId: oldestSession.id,
          deviceType: sessionData.deviceType
        }
      })
    }

    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken: this.generateSessionToken(),
        expires: new Date(Date.now() + this.config.sessionTimeout),
        deviceType: sessionData.deviceType,
        browser: sessionData.browser,
        os: sessionData.os,
        ipAddress: sessionData.ipAddress,
        lastActive: new Date()
      }
    })

    await createAuditLog({
      userId,
      action: AuditAction.SESSION_CREATED,
      entity: AuditEntity.SESSION,
      details: {
        sessionId: session.id,
        deviceType: sessionData.deviceType,
        ipAddress: sessionData.ipAddress
      }
    })

    return { allowed: true, sessionId: session.sessionToken }
  }

  async validateSession(sessionToken: string): Promise<SessionInfo | null> {
    const session = await prisma.session.findUnique({
      where: { sessionToken }
    })

    if (!session) {
      return null
    }

    const now = new Date()

    if (session.expires < now) {
      await this.terminateSession(session.id, "Expired")
      return null
    }

    const idleTime = now.getTime() - session.lastActive.getTime()
    if (idleTime > this.config.idleTimeout) {
      await this.terminateSession(session.id, "Idle timeout")
      return null
    }

    const absoluteTime = now.getTime() - session.createdAt.getTime()
    if (absoluteTime > this.config.absoluteTimeout) {
      await this.terminateSession(session.id, "Absolute timeout")
      return null
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActive: now }
    })

    return {
      id: session.id,
      userId: session.userId,
      deviceType: session.deviceType,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expiresAt: session.expires
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: { userId, expires: { gt: new Date() } },
      orderBy: { lastActive: "desc" }
    })

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      deviceType: session.deviceType,
      browser: session.browser,
      os: session.os,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expiresAt: session.expires
    }))
  }

  async terminateSession(sessionId: string, reason: string = "User requested"): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (session) {
      await prisma.session.delete({
        where: { id: sessionId }
      })

      await createAuditLog({
        userId: session.userId,
        action: AuditAction.SESSION_TERMINATED,
        entity: AuditEntity.SESSION,
        details: {
          sessionId,
          reason,
          deviceType: session.deviceType
        }
      })
    }
  }

  async terminateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {})
      }
    })

    for (const session of sessions) {
      await this.terminateSession(session.id, "All sessions terminated")
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expires: { lte: new Date() } }
    })

    return result.count
  }

  private generateSessionToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  }

  async updateSessionActivity(sessionToken: string): Promise<void> {
    await prisma.session.update({
      where: { sessionToken },
      data: { lastActive: new Date() }
    })
  }

  async extendSession(sessionToken: string): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { sessionToken }
    })

    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { expires: new Date(Date.now() + this.config.sessionTimeout) }
      })
    }
  }

  getConfig(): SessionConfig {
    return { ...this.config }
  }
}

const sessionManager = new SessionManager()

export function createSessionManager(config?: Partial<SessionConfig>): SessionManager {
  return new SessionManager(config)
}

export async function createSession(
  userId: string,
  sessionData: {
    deviceType: string
    browser: string
    os: string
    ipAddress: string
  }
) {
  return sessionManager.createSession(userId, sessionData)
}

export async function validateSession(sessionToken: string) {
  return sessionManager.validateSession(sessionToken)
}

export async function getUserSessions(userId: string) {
  return sessionManager.getUserSessions(userId)
}

export async function terminateSession(sessionId: string, reason?: string) {
  return sessionManager.terminateSession(sessionId, reason)
}

export async function terminateAllSessions(userId: string, exceptSessionId?: string) {
  return sessionManager.terminateAllSessions(userId, exceptSessionId)
}

export async function cleanupExpiredSessions() {
  return sessionManager.cleanupExpiredSessions()
}

export { SessionManager, sessionManager }
