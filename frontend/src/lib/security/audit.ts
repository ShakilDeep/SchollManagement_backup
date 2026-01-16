import { prisma } from "@/lib/db"
import type { NextRequest } from "next/server"

export enum AuditAction {
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  READ = "READ",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",
  ROLE_CHANGE = "ROLE_CHANGE",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  API_KEY_GENERATED = "API_KEY_GENERATED",
  API_KEY_REVOKED = "API_KEY_REVOKED",
  DATA_BREACH_ATTEMPT = "DATA_BREACH_ATTEMPT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
}

export enum AuditEntity {
  USER = "User",
  STUDENT = "Student",
  TEACHER = "Teacher",
  STAFF = "Staff",
  PARENT = "Parent",
  ATTENDANCE = "Attendance",
  GRADE = "Grade",
  EXAM = "Exam",
  EXAM_RESULT = "ExamResult",
  MESSAGE = "Message",
  LIBRARY_BOOK = "LibraryBook",
  INVENTORY_ITEM = "InventoryItem",
  TRANSPORT = "Transport",
  HOSTEL = "Hostel",
  SYSTEM_SETTINGS = "SystemSettings",
  AUDIT_LOG = "AuditLog",
  API_KEY = "ApiKey"
}

interface AuditLogOptions {
  userId?: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  details?: string | Record<string, any>
  ipAddress?: string
  userAgent?: string
  request?: NextRequest
}

export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  const ipAddress = options.ipAddress || options.request?.headers.get("x-forwarded-for")?.split(",")[0].trim() || options.request?.headers.get("x-real-ip") || "unknown"
  const userAgent = options.userAgent || options.request?.headers.get("user-agent") || "unknown"

  const details = typeof options.details === "object"
    ? JSON.stringify(options.details)
    : options.details

  await prisma.auditLog.create({
    data: {
      userId: options.userId,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      details,
      ipAddress,
      userAgent
    }
  })
}

export async function createBulkAuditLogs(logs: AuditLogOptions[]): Promise<void> {
  const formattedLogs = logs.map(log => ({
    userId: log.userId,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details: typeof log.details === "object" ? JSON.stringify(log.details) : log.details,
    ipAddress: log.ipAddress || log.request?.headers.get("x-forwarded-for")?.split(",")[0].trim() || log.request?.headers.get("x-real-ip") || "unknown",
    userAgent: log.userAgent || log.request?.headers.get("user-agent") || "unknown"
  }))

  await prisma.auditLog.createMany({
    data: formattedLogs
  })
}

export async function getAuditLogs(filters: {
  userId?: string
  action?: AuditAction
  entity?: AuditEntity
  entityId?: string
  startDate?: Date
  endDate?: Date
  ipAddress?: string
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = filters.action
  if (filters.entity) where.entity = filters.entity
  if (filters.entityId) where.entityId = filters.entityId
  if (filters.ipAddress) where.ipAddress = filters.ipAddress

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 100,
      skip: filters.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])

  return { logs, total }
}

export async function getUserActivitySummary(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [totalActions, actionCounts, recentActivity] = await Promise.all([
    prisma.auditLog.count({
      where: {
        userId,
        createdAt: { gte: startDate }
      }
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      _count: {
        action: true
      },
      orderBy: {
        _count: {
          action: "desc"
        }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ])

  return {
    totalActions,
    actionCounts: actionCounts.map(ac => ({
      action: ac.action,
      count: ac._count.action
    })),
    recentActivity
  }
}

export async function detectSuspiciousActivity(userId: string): Promise<{
  isSuspicious: boolean
  reasons: string[]
}> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [recentActions, failedLogins, unusualIPs] = await Promise.all([
    prisma.auditLog.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo }
      }
    }),
    prisma.auditLog.count({
      where: {
        userId,
        action: AuditAction.SIGN_IN,
        createdAt: { gte: oneHourAgo },
        details: { contains: "failed" }
      }
    }),
    prisma.auditLog.groupBy({
      by: ["ipAddress"],
      where: {
        userId,
        createdAt: { gte: oneDayAgo }
      },
      _count: {
        ipAddress: true
      }
    })
  ])

  const reasons: string[] = []

  if (recentActions > 100) {
    reasons.push(`Excessive activity: ${recentActions} actions in the last hour`)
  }

  if (failedLogins > 5) {
    reasons.push(`Multiple failed login attempts: ${failedLogins} in the last hour`)
  }

  if (unusualIPs.length > 10) {
    reasons.push(`Unusual IP pattern: ${unusualIPs.length} different IPs in the last day`)
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

export async function logSecurityEvent(event: {
  type: "DATA_BREACH_ATTEMPT" | "RATE_LIMIT_EXCEEDED" | "SUSPICIOUS_ACTIVITY"
  severity: "low" | "medium" | "high" | "critical"
  details: Record<string, any>
  ipAddress?: string
  userId?: string
  request?: NextRequest
}) {
  await createAuditLog({
    userId: event.userId,
    action: event.type === "DATA_BREACH_ATTEMPT" ? AuditAction.DATA_BREACH_ATTEMPT :
            event.type === "RATE_LIMIT_EXCEEDED" ? AuditAction.RATE_LIMIT_EXCEEDED :
            AuditAction.SUSPICIOUS_ACTIVITY,
    entity: AuditEntity.SYSTEM_SETTINGS,
    details: {
      severity: event.severity,
      ...event.details
    },
    request: event.request,
    ipAddress: event.ipAddress
  })

  if (event.severity === "critical" || event.severity === "high") {
  }
}

export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  })

  return result.count
}
